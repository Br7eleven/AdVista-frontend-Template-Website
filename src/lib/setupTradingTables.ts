import { supabase } from './supabase';
import toast from 'react-hot-toast';

// This function provides mock trading data for the application
// Since we can't create tables directly through the Supabase client,
// we'll use client-side mocking instead

// Mock trading pairs data
const mockTradingPairs = [
  { id: '1', base_currency: 'BTC', quote_currency: 'USDT', display_name: 'Bitcoin/USDT', price_precision: 2, min_trade_amount: 0.001, is_active: true },
  { id: '2', base_currency: 'ETH', quote_currency: 'USDT', display_name: 'Ethereum/USDT', price_precision: 2, min_trade_amount: 0.01, is_active: true },
  { id: '3', base_currency: 'BNB', quote_currency: 'USDT', display_name: 'Binance Coin/USDT', price_precision: 2, min_trade_amount: 0.1, is_active: true },
  { id: '4', base_currency: 'SOL', quote_currency: 'USDT', display_name: 'Solana/USDT', price_precision: 3, min_trade_amount: 0.1, is_active: true },
  { id: '5', base_currency: 'ADA', quote_currency: 'USDT', display_name: 'Cardano/USDT', price_precision: 4, min_trade_amount: 1.0, is_active: true }
];

// Mock user wallet data
const createMockWallets = (userId: string) => [
  { id: '1', user_id: userId, currency: 'USDT', balance: 1000 },
  { id: '2', user_id: userId, currency: 'BTC', balance: 0.05 },
  { id: '3', user_id: userId, currency: 'ETH', balance: 1.0 },
  { id: '4', user_id: userId, currency: 'BNB', balance: 0.5 },
  { id: '5', user_id: userId, currency: 'SOL', balance: 5.0 },
  { id: '6', user_id: userId, currency: 'ADA', balance: 100.0 }
];

// Mock user trades data
const createMockTrades = (userId: string) => [
  { 
    id: '1', 
    user_id: userId, 
    pair_id: '1', 
    type: 'buy', 
    amount: 0.01, 
    price: 30000, 
    total: 300, 
    status: 'completed',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    pair: { display_name: 'Bitcoin/USDT' }
  },
  { 
    id: '2', 
    user_id: userId, 
    pair_id: '2', 
    type: 'buy', 
    amount: 0.5, 
    price: 2000, 
    total: 1000, 
    status: 'completed',
    created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    pair: { display_name: 'Ethereum/USDT' }
  },
  { 
    id: '3', 
    user_id: userId, 
    pair_id: '1', 
    type: 'sell', 
    amount: 0.005, 
    price: 31000, 
    total: 155, 
    status: 'completed',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    pair: { display_name: 'Bitcoin/USDT' }
  }
];

// Mock data storage - this will be used instead of actual database tables
let mockData = {
  tradingPairs: [...mockTradingPairs],
  userWallets: [],
  userTrades: []
};

// Override Supabase methods for trading-related tables
const setupMockSupabase = () => {
  // Store the original from method
  const originalFrom = supabase.from;
  
  // Override the from method to intercept calls to our mock tables
  // @ts-ignore - We're monkey patching for mocking purposes
  supabase.from = function(table: string) {
    // If it's one of our mock tables, return mock methods
    if (['trading_pairs', 'user_wallets', 'user_trades'].includes(table)) {
      return {
        select: (columns?: string) => {
          return {
            eq: (column: string, value: any) => {
              return {
                order: (column: string, { ascending }: { ascending: boolean }) => {
                  return {
                    limit: (limit: number) => {
                      // Return mock data based on the table
                      let filteredData = [];
                      if (table === 'trading_pairs') {
                        filteredData = mockData.tradingPairs;
                      } else if (table === 'user_wallets') {
                        filteredData = mockData.userWallets.filter(w => w.user_id === value);
                      } else if (table === 'user_trades') {
                        filteredData = mockData.userTrades.filter(t => t.user_id === value);
                        // Sort by created_at
                        if (ascending) {
                          filteredData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        } else {
                          filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                        }
                        // Limit results
                        filteredData = filteredData.slice(0, limit);
                      }
                      return Promise.resolve({ data: filteredData, error: null });
                    }
                  };
                },
                limit: (limit: number) => {
                  // Return mock data based on the table
                  let filteredData = [];
                  if (table === 'trading_pairs') {
                    filteredData = mockData.tradingPairs;
                  } else if (table === 'user_wallets') {
                    filteredData = mockData.userWallets.filter(w => w.user_id === value);
                  } else if (table === 'user_trades') {
                    filteredData = mockData.userTrades.filter(t => t.user_id === value);
                  }
                  return Promise.resolve({ data: filteredData.slice(0, limit), error: null });
                }
              };
            },
            limit: (limit: number) => {
              // Return mock data based on the table
              let data = [];
              if (table === 'trading_pairs') {
                data = mockData.tradingPairs.slice(0, limit);
              } else if (table === 'user_wallets') {
                data = mockData.userWallets.slice(0, limit);
              } else if (table === 'user_trades') {
                data = mockData.userTrades.slice(0, limit);
              }
              return Promise.resolve({ data, error: null });
            }
          };
        },
        insert: (data: any) => {
          // Handle insert operations
          if (table === 'trading_pairs') {
            mockData.tradingPairs.push(data);
          } else if (table === 'user_wallets') {
            mockData.userWallets.push(data);
          } else if (table === 'user_trades') {
            mockData.userTrades.push(data);
          }
          return Promise.resolve({ data, error: null });
        }
      };
    }
    
    // For other tables, use the original method
    return originalFrom.call(supabase, table);
  };
};

// Setup trading data with client-side mocking
export const setupTradingTables = async () => {
  try {
    console.log('Setting up mock trading data...');
    const loadingToastId = toast.loading('Setting up trading data...');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found');
      toast.error('You must be logged in to access trading features');
      toast.dismiss(loadingToastId);
      return false;
    }
    
    // Setup mock data for the current user
    mockData.userWallets = createMockWallets(user.id);
    mockData.userTrades = createMockTrades(user.id);
    
    // Setup mock Supabase methods
    setupMockSupabase();
    
    console.log('Mock trading data setup complete');
    console.log('Mock trading pairs:', mockData.tradingPairs.length);
    console.log('Mock user wallets:', mockData.userWallets.length);
    console.log('Mock user trades:', mockData.userTrades.length);
    
    toast.dismiss(loadingToastId);
    toast.success('Trading data loaded successfully');
    return true;
  } catch (error) {
    console.error('Error setting up mock trading data:', error);
    toast.error('Failed to load trading data');
    return false;
  }
};
