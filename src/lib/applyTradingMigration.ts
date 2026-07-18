import { supabase } from './supabase';
import toast from 'react-hot-toast';

export const applyTradingMigration = async () => {
  try {
    console.log('Applying trading migration...');
    
    // Create trading_pairs table
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create trading_pairs table to store available trading pairs
        CREATE TABLE IF NOT EXISTS public.trading_pairs (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          base_currency TEXT NOT NULL,
          quote_currency TEXT NOT NULL,
          display_name TEXT NOT NULL,
          price_precision INTEGER NOT NULL DEFAULT 2,
          min_trade_amount DECIMAL(18, 8) NOT NULL DEFAULT 0.001,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(base_currency, quote_currency)
        );
      `
    });
    
    // Create trading_candles table
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create trading_candles table to store historical price data
        CREATE TABLE IF NOT EXISTS public.trading_candles (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          pair_id UUID REFERENCES public.trading_pairs(id) ON DELETE CASCADE,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          open DECIMAL(18, 8) NOT NULL,
          high DECIMAL(18, 8) NOT NULL,
          low DECIMAL(18, 8) NOT NULL,
          close DECIMAL(18, 8) NOT NULL,
          volume DECIMAL(18, 8) NOT NULL,
          timeframe TEXT NOT NULL,
          UNIQUE(pair_id, timestamp, timeframe)
        );
      `
    });
    
    // Create user_trades table
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create user_trades table to store user trading activity
        CREATE TABLE IF NOT EXISTS public.user_trades (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          pair_id UUID REFERENCES public.trading_pairs(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
          amount DECIMAL(18, 8) NOT NULL,
          price DECIMAL(18, 8) NOT NULL,
          total DECIMAL(18, 8) NOT NULL,
          status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    
    // Create user_wallets table
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create user_wallets table to store user crypto balances
        CREATE TABLE IF NOT EXISTS public.user_wallets (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          currency TEXT NOT NULL,
          balance DECIMAL(18, 8) NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(user_id, currency)
        );
      `
    });
    
    // Enable Row Level Security
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Enable Row Level Security
        ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.trading_candles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
      `
    });
    
    // Create policies
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create policies for trading_pairs table
        CREATE POLICY "Trading pairs are viewable by all users" 
          ON public.trading_pairs FOR SELECT 
          USING (true);

        -- Create policies for trading_candles table
        CREATE POLICY "Trading candles are viewable by all users" 
          ON public.trading_candles FOR SELECT 
          USING (true);

        -- Create policies for user_trades table
        CREATE POLICY "Users can view their own trades" 
          ON public.user_trades FOR SELECT 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own trades" 
          ON public.user_trades FOR INSERT 
          WITH CHECK (auth.uid() = user_id);

        -- Create policies for user_wallets table
        CREATE POLICY "Users can view their own wallets" 
          ON public.user_wallets FOR SELECT 
          USING (auth.uid() = user_id);

        CREATE POLICY "Users can update their own wallets" 
          ON public.user_wallets FOR UPDATE 
          USING (auth.uid() = user_id);
      `
    });
    
    // Insert initial trading pairs
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Insert some initial trading pairs
        INSERT INTO public.trading_pairs (base_currency, quote_currency, display_name, price_precision, min_trade_amount)
        VALUES
          ('BTC', 'USDT', 'Bitcoin/USDT', 2, 0.001),
          ('ETH', 'USDT', 'Ethereum/USDT', 2, 0.01),
          ('BNB', 'USDT', 'Binance Coin/USDT', 2, 0.1),
          ('SOL', 'USDT', 'Solana/USDT', 3, 0.1),
          ('ADA', 'USDT', 'Cardano/USDT', 4, 1.0)
        ON CONFLICT (base_currency, quote_currency) DO NOTHING;
      `
    });
    
    // Create function to create initial wallet
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Function to create initial wallet for new users
        CREATE OR REPLACE FUNCTION create_initial_wallet()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Give new users some initial USDT to start trading
          INSERT INTO public.user_wallets (user_id, currency, balance)
          VALUES (NEW.id, 'USDT', 1000.00);
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    // Create trigger
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Trigger to create initial wallet for new users
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION create_initial_wallet();
      `
    });
    
    // Create process_trade function
    await supabase.rpc('exec_sql', {
      sql_string: `
        -- Function to process a trade
        CREATE OR REPLACE FUNCTION process_trade(
          p_user_id UUID,
          p_pair_id UUID,
          p_type TEXT,
          p_amount DECIMAL,
          p_price DECIMAL
        )
        RETURNS UUID AS $$
        DECLARE
          v_base_currency TEXT;
          v_quote_currency TEXT;
          v_total DECIMAL;
          v_trade_id UUID;
          v_base_balance DECIMAL;
          v_quote_balance DECIMAL;
        BEGIN
          -- Get the currencies for this trading pair
          SELECT base_currency, quote_currency INTO v_base_currency, v_quote_currency
          FROM public.trading_pairs
          WHERE id = p_pair_id;
          
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Trading pair not found';
          END IF;
          
          -- Calculate the total
          v_total := p_amount * p_price;
          
          -- Check if user has enough balance
          IF p_type = 'buy' THEN
            -- For buy, check quote currency (e.g., USDT)
            SELECT balance INTO v_quote_balance
            FROM public.user_wallets
            WHERE user_id = p_user_id AND currency = v_quote_currency;
            
            IF v_quote_balance < v_total THEN
              RAISE EXCEPTION 'Insufficient balance';
            END IF;
            
            -- Update quote currency balance (decrease)
            UPDATE public.user_wallets
            SET balance = balance - v_total,
                updated_at = now()
            WHERE user_id = p_user_id AND currency = v_quote_currency;
            
            -- Update or insert base currency balance (increase)
            INSERT INTO public.user_wallets (user_id, currency, balance)
            VALUES (p_user_id, v_base_currency, p_amount)
            ON CONFLICT (user_id, currency)
            DO UPDATE SET balance = public.user_wallets.balance + p_amount,
                          updated_at = now();
                          
          ELSIF p_type = 'sell' THEN
            -- For sell, check base currency (e.g., BTC)
            SELECT balance INTO v_base_balance
            FROM public.user_wallets
            WHERE user_id = p_user_id AND currency = v_base_currency;
            
            IF v_base_balance < p_amount THEN
              RAISE EXCEPTION 'Insufficient balance';
            END IF;
            
            -- Update base currency balance (decrease)
            UPDATE public.user_wallets
            SET balance = balance - p_amount,
                updated_at = now()
            WHERE user_id = p_user_id AND currency = v_base_currency;
            
            -- Update or insert quote currency balance (increase)
            INSERT INTO public.user_wallets (user_id, currency, balance)
            VALUES (p_user_id, v_quote_currency, v_total)
            ON CONFLICT (user_id, currency)
            DO UPDATE SET balance = public.user_wallets.balance + v_total,
                          updated_at = now();
          ELSE
            RAISE EXCEPTION 'Invalid trade type';
          END IF;
          
          -- Record the trade
          INSERT INTO public.user_trades (user_id, pair_id, type, amount, price, total, status)
          VALUES (p_user_id, p_pair_id, p_type, p_amount, p_price, v_total, 'completed')
          RETURNING id INTO v_trade_id;
          
          RETURN v_trade_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    // Create initial wallet for current user if not exists
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.rpc('exec_sql', {
        sql_string: `
          -- Create initial wallet for current user if not exists
          INSERT INTO public.user_wallets (user_id, currency, balance)
          VALUES ('${user.id}', 'USDT', 1000.00)
          ON CONFLICT (user_id, currency) DO NOTHING;
          
          -- Add some BTC for testing
          INSERT INTO public.user_wallets (user_id, currency, balance)
          VALUES ('${user.id}', 'BTC', 0.05)
          ON CONFLICT (user_id, currency) DO NOTHING;
          
          -- Add some ETH for testing
          INSERT INTO public.user_wallets (user_id, currency, balance)
          VALUES ('${user.id}', 'ETH', 1.0)
          ON CONFLICT (user_id, currency) DO NOTHING;
        `
      });
    }
    
    console.log('Trading migration applied successfully!');
    toast.success('Trading database setup completed');
    return true;
  } catch (error) {
    console.error('Error applying trading migration:', error);
    toast.error('Failed to set up trading database');
    return false;
  }
};
