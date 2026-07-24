import { useState, useEffect } from 'react';
import { TradingPair, UserWallet, executeTrade } from '../lib/tradingApi';
import toast from 'react-hot-toast';

interface TradingOrderFormProps {
  pair: TradingPair;
  currentPrice: number;
  onOrderSubmit?: (type: 'buy' | 'sell', amount: number, price: number) => Promise<void>;
  wallets?: UserWallet[];
}

const TradingOrderForm = ({ pair, currentPrice, onOrderSubmit, wallets = [] }: TradingOrderFormProps) => {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>(currentPrice.toFixed(pair.price_precision));
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Find relevant wallet balances
  const baseWallet = wallets.find(w => w.currency === pair.base_currency);
  const quoteWallet = wallets.find(w => w.currency === pair.quote_currency);
  
  const baseBalance = baseWallet?.balance || 0;
  const quoteBalance = quoteWallet?.balance || 0;

  // Update price when currentPrice changes
  useEffect(() => {
    setPrice(currentPrice.toFixed(pair.price_precision));
  }, [currentPrice, pair.price_precision]);

  // Calculate total when amount or price changes
  useEffect(() => {
    const amountValue = parseFloat(amount) || 0;
    const priceValue = parseFloat(price) || 0;
    setTotal(amountValue * priceValue);
  }, [amount, price]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handlePercentageClick = (percentage: number) => {
    const priceValue = parseFloat(price);
    if (!priceValue || priceValue <= 0) {
      toast.error('Enter a valid price first');
      return;
    }
    if (orderType === 'buy') {
      // Calculate max amount based on quote balance (e.g., USDT)
      const maxAmount = quoteBalance / priceValue;
      setAmount((maxAmount * percentage / 100).toFixed(8));
    } else {
      // For sell, use base balance (e.g., BTC)
      setAmount((baseBalance * percentage / 100).toFixed(8));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);
    const priceValue = parseFloat(price);
    const totalValue = amountValue * priceValue;

    if (!amount || !price) {
      toast.error('Please enter amount and price');
      return;
    }

    if (isNaN(amountValue) || isNaN(priceValue)) {
      toast.error('Invalid amount or price');
      return;
    }

    if (amountValue <= 0 || priceValue <= 0) {
      toast.error('Amount and price must be greater than 0');
      return;
    }

    if (isNaN(totalValue) || !isFinite(totalValue)) {
      toast.error('Invalid total calculation');
      return;
    }

    if (amountValue < pair.min_trade_amount) {
      toast.error(`Minimum trade amount is ${pair.min_trade_amount} ${pair.base_currency}`);
      return;
    }

    // Check if user has enough balance
    if (orderType === 'buy' && totalValue > quoteBalance) {
      toast.error(`Insufficient ${pair.quote_currency} balance`);
      return;
    }

    if (orderType === 'sell' && amountValue > baseBalance) {
      toast.error(`Insufficient ${pair.base_currency} balance`);
      return;
    }
    
    try {
      setLoading(true);
      
      // Execute the trade
      await executeTrade(
        pair.id,
        orderType,
        amountValue,
        priceValue
      );
      
      toast.success(`${orderType.toUpperCase()} order executed successfully`);
      
      // Reset form
      setAmount('');
      setPrice(currentPrice.toFixed(pair.price_precision));
      
      // Notify parent component to refresh data
      if (onOrderSubmit) {
        await onOrderSubmit(orderType, amountValue, priceValue);
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      toast.error('Failed to execute trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-600 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
      <div className="flex mb-4 border-b border-gray-100 dark:border-dark-400">
        <button
          className={`flex-1 py-2 text-center font-medium transition-colors ${
            orderType === 'buy' ? 'text-accent-600 dark:text-accent-400 border-b-2 border-accent-600 dark:border-accent-400' : 'text-gray-400 dark:text-gray-500'
          }`}
          onClick={() => setOrderType('buy')}
        >
          Buy
        </button>
        <button
          className={`flex-1 py-2 text-center font-medium transition-colors ${
            orderType === 'sell' ? 'text-secondary-600 dark:text-secondary-400 border-b-2 border-secondary-600 dark:border-secondary-400' : 'text-gray-400 dark:text-gray-500'
          }`}
          onClick={() => setOrderType('sell')}
        >
          Sell
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">Price</label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pair.quote_currency}
            </span>
          </div>
          <input
            type="number"
            value={price}
            onChange={handlePriceChange}
            className="w-full px-3 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            step={Math.pow(10, -pair.price_precision)}
            min={0}
          />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">Amount</label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pair.base_currency}
            </span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-3 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            step={pair.min_trade_amount}
            min={pair.min_trade_amount}
          />
        </div>
        
        <div className="flex justify-between space-x-2">
          {[25, 50, 75, 100].map((percentage) => (
            <button
              key={percentage}
              type="button"
              onClick={() => handlePercentageClick(percentage)}
              className="flex-1 py-1 text-xs bg-gray-100 dark:bg-dark-500 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-dark-400 transition-colors"
            >
              {percentage}%
            </button>
          ))}
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">Total</label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pair.quote_currency}
            </span>
          </div>
          <div className="w-full px-3 py-2 border border-gray-200 dark:border-dark-400 rounded-lg bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-light">
            {total.toFixed(pair.price_precision)}
          </div>
        </div>
        
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-500 dark:text-gray-400">
            Available: {orderType === 'buy' ? quoteBalance.toFixed(8) : baseBalance.toFixed(8)} {orderType === 'buy' ? pair.quote_currency : pair.base_currency}
          </span>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-medium text-white shadow-md transition-all ${orderType === 'buy' 
            ? 'bg-accent-600 hover:bg-accent-700 shadow-accent-200 dark:shadow-none' 
            : 'bg-secondary-600 hover:bg-secondary-700 shadow-secondary-200 dark:shadow-none'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `${orderType === 'buy' ? 'Buy' : 'Sell'} ${pair.base_currency}`
          )}
        </button>
      </form>
    </div>
  );
};

export default TradingOrderForm;
