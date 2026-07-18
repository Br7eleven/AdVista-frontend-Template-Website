import { useState, useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, RefreshCw, Clock, BarChart2, ChevronDown, Play, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import SimpleTradingChart from '../components/SimpleTradingChart';
import TradingOrderForm from '../components/TradingOrderForm';
import ErrorBoundary from '../components/ErrorBoundary';
import CoinPriceList from '../components/CoinPriceList';
import WatchAds from '../components/WatchAds';
import { setupTradingTables } from '../lib/setupTradingTables';
import { 
  fetchTradingPairs, 
  fetchCandleData, 
  fetchUserWallets, 
  fetchUserTrades,
  TradingPair,
  UserWallet,
  UserTrade,
  CandleData
} from '../lib/tradingApi';

interface MarketStats {
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
}

export default function Earn() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'ads' | 'trading'>('ads');

  // Trading state
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [trades, setTrades] = useState<UserTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pairDropdownOpen, setPairDropdownOpen] = useState<boolean>(false);
  const [timeframeDropdownOpen, setTimeframeDropdownOpen] = useState<boolean>(false);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    volume24h: 0,
    high24h: 0,
    low24h: 0,
    change24h: 0,
  });

  // Refs for dropdown click-outside handling
  const pairDropdownRef = useRef<HTMLDivElement>(null);
  const timeframeDropdownRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Initialize trading tables and mock data
        await setupTradingTables();
        
        // Load trading pairs
        const pairsData = await fetchTradingPairs();
        setPairs(pairsData);
        
        // Set default pair
        if (pairsData.length > 0) {
          setSelectedPair(pairsData[0]);
          loadCandleData(pairsData[0].id, timeframe);
        }
        
        // Load user wallets
        const walletsData = await fetchUserWallets();
        setWallets(walletsData);
        
        // Load user trades
        const tradesData = await fetchUserTrades();
        setTrades(tradesData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load trading data');
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [timeframe]);

  // Load candle data when selected pair or timeframe changes
  useEffect(() => {
    const loadCandleData = async () => {
      if (!selectedPair) return;
      
      try {
        setLoading(true);
        const data = await fetchCandleData(selectedPair.id, timeframe);
        setCandleData(data);
        
        // Calculate market stats
        if (data.length > 0) {
          const last24hData = data.slice(-24);
          const volume24h = last24hData.reduce((sum, candle) => sum + candle.volume, 0);
          const high24h = Math.max(...last24hData.map(candle => candle.high));
          const low24h = Math.min(...last24hData.map(candle => candle.low));
          const firstPrice = last24hData[0].open;
          const lastPrice = last24hData[last24hData.length - 1].close;
          const change24h = ((lastPrice - firstPrice) / firstPrice) * 100;
          
          setMarketStats({
            volume24h,
            high24h,
            low24h,
            change24h,
          });
        }
      } catch (error) {
        console.error('Error loading candle data:', error);
        toast.error('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCandleData();
    
    // Set up interval to refresh data every minute
    const intervalId = setInterval(loadCandleData, 60000);
    
    return () => clearInterval(intervalId);
  }, [selectedPair, timeframe]);

  // Handle pair selection
  const handlePairSelect = (pair: TradingPair) => {
    setSelectedPair(pair);
    setPairDropdownOpen(false);
    loadCandleData(pair.id, timeframe);
  };

  // Handle timeframe selection
  const handleTimeframeSelect = (tf: string) => {
    setTimeframe(tf);
    setTimeframeDropdownOpen(false);
    if (selectedPair) {
      loadCandleData(selectedPair.id, tf);
    }
  };

  // Load candle data for a specific pair and timeframe
  const loadCandleData = async (pairId: string, tf: string) => {
    try {
      const data = await fetchCandleData(pairId, tf);
      setCandleData(data);
      
      // Update market stats
      if (data.length > 0) {
        const high = Math.max(...data.map(candle => candle.high));
        const low = Math.min(...data.map(candle => candle.low));
        const volume = data.reduce((sum, candle) => sum + candle.volume, 0);
        const change = ((data[data.length - 1].close - data[0].open) / data[0].open) * 100;
        
        setMarketStats({
          high24h: high,
          low24h: low,
          volume24h: volume,
          change24h: change
        });
      }
    } catch (error) {
      console.error('Error loading candle data:', error);
      toast.error('Failed to load chart data');
    }
  };

  // Handle order submission
  const handleOrderSubmit = async (type: 'buy' | 'sell', orderAmount: number, orderPrice: number) => {
    if (!selectedPair) return;
    
    try {
      toast.success(`${type.toUpperCase()} order placed successfully!`);
      
      // Refresh wallets and trades after order
      const walletsData = await fetchUserWallets();
      setWallets(walletsData);
      
      const tradesData = await fetchUserTrades();
      setTrades(tradesData);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    }
  };

  // Get current price from candle data
  const getCurrentPrice = (): number => {
    if (!Array.isArray(candleData) || candleData.length === 0) return 0;
    return candleData[candleData.length - 1].close;
  };

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close pair dropdown when clicking outside
      if (pairDropdownRef.current && !pairDropdownRef.current.contains(event.target as Node)) {
        setPairDropdownOpen(false);
      }
      
      // Close timeframe dropdown when clicking outside
      if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(event.target as Node)) {
        setTimeframeDropdownOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to refresh data
  const refreshData = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      toast.success('Refreshing data...');
      
      // Reload all data
      const pairsData = await fetchTradingPairs();
      setPairs(pairsData);
      
      if (selectedPair) {
        await loadCandleData(selectedPair.id, timeframe);
      }
      
      const walletsData = await fetchUserWallets();
      setWallets(walletsData);
      
      const tradesData = await fetchUserTrades();
      setTrades(tradesData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-light">Earn Rewards</h1>
        <button 
          onClick={refreshData}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition border border-gray-200 dark:border-dark-500 text-gray-700 dark:text-light"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('ads')}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'ads'
              ? 'bg-white dark:bg-dark-500 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Play size={18} />
          <span>Watch Ads</span>
        </button>
        <button
          onClick={() => setActiveTab('trading')}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'trading'
              ? 'bg-white dark:bg-dark-500 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <LayoutGrid size={18} />
          <span>Trading</span>
        </button>
      </div>

      {activeTab === 'ads' ? (
        <WatchAds />
      ) : (
        /* Trading Interface */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {/* Main Chart Area (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trading Pair Selector and Controls */}
            <div className="bg-white dark:bg-dark-600 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
              <div className="flex flex-wrap justify-between items-center gap-4">
                {/* Trading Pair Selector */}
                <div className="relative" ref={pairDropdownRef}>
                  <button 
                    onClick={() => setPairDropdownOpen(!pairDropdownOpen)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition text-gray-900 dark:text-light"
                  >
                    <span className="font-semibold">
                      {selectedPair ? selectedPair.display_name : 'Select Pair'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {pairDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-dark-700 rounded-lg shadow-lg border border-gray-200 dark:border-dark-500 max-h-60 overflow-y-auto">
                      {pairs.map((pair) => (
                        <button
                          key={pair.id}
                          onClick={() => handlePairSelect(pair)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-800 flex justify-between items-center text-gray-900 dark:text-light"
                        >
                          <span>{pair.display_name}</span>
                          {pair.id === selectedPair?.id && (
                            <span className="text-primary-600 dark:text-primary-400">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Timeframe Selector */}
                <div className="relative" ref={timeframeDropdownRef}>
                  <button 
                    onClick={() => setTimeframeDropdownOpen(!timeframeDropdownOpen)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition text-gray-900 dark:text-light"
                  >
                    <span>{timeframe}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {timeframeDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-32 bg-white dark:bg-dark-700 rounded-lg shadow-lg border border-gray-200 dark:border-dark-500 text-gray-900 dark:text-light">
                      {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => handleTimeframeSelect(tf)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-800 flex justify-between items-center"
                        >
                          <span>{tf}</span>
                          {tf === timeframe && (
                            <span className="text-primary-600 dark:text-primary-400">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Market Stats */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">24h High:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-light">
                      ${marketStats.high24h.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">24h Low:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-light">
                      ${marketStats.low24h.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">24h Vol:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-light">
                      ${Math.round(marketStats.volume24h).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">24h Change:</span>
                    <div className={`flex items-center text-sm font-semibold ${marketStats.change24h >= 0 ? 'text-accent-600 dark:text-accent-400' : 'text-secondary-600 dark:text-secondary-400'}`}>
                      {marketStats.change24h >= 0 ? <ArrowUp size={14} className="mr-0.5" /> : <ArrowDown size={14} className="mr-0.5" />}
                      {marketStats.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chart */}
            <div className="bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 overflow-hidden">
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
              ) : selectedPair ? (
                <ErrorBoundary
                  fallback={
                    <div className="h-[400px] flex items-center justify-center flex-col p-6 text-center">
                      <p className="text-secondary-600 dark:text-secondary-400 mb-2 font-semibold">Failed to load chart</p>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">There was a problem displaying the trading chart</p>
                      <button 
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        onClick={() => window.location.reload()}
                      >
                        Reload page
                      </button>
                    </div>
                  }
                >
                  <SimpleTradingChart 
                    data={candleData || []} 
                    height={400} 
                    pairName={selectedPair.display_name} 
                  />
                </ErrorBoundary>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">No trading pair selected</p>
                </div>
              )}
            </div>
            
            {/* Recent Trades */}
            <div className="bg-white dark:bg-dark-600 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-light">Your Recent Trades</h2>
              
              {trades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pair</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-500">
                      {trades.map((trade) => (
                        <tr key={trade.id} className="text-gray-900 dark:text-light">
                          <td className="px-4 py-2 whitespace-nowrap">
                            {trade.pair?.display_name || `${trade.pair_id}`}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${trade.type === 'buy' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400' : 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400'}`}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            ${trade.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {trade.amount}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            ${trade.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400 text-sm">
                            {new Date(trade.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No trades yet. Start trading to earn rewards!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Order Form and Wallet (1/3 width on large screens) */}
          <div className="space-y-6">
            {/* Order Form */}
            <div className="bg-white dark:bg-dark-600 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-light">Place Order</h2>
              
              {selectedPair ? (
                <TradingOrderForm 
                  currentPrice={getCurrentPrice()} 
                  pair={selectedPair} 
                  wallets={wallets}
                  onOrderSubmit={handleOrderSubmit}
                />
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Select a trading pair to place an order
                </div>
              )}
            </div>
            
            {/* Wallet Balances */}
            <div className="bg-white dark:bg-dark-600 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-light">Your Wallet</h2>
              
              {wallets.length > 0 ? (
                <div className="space-y-3">
                  {wallets.map(wallet => (
                    <div key={wallet.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <span className="font-medium text-gray-900 dark:text-light">{wallet.currency}</span>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-light">{wallet.balance.toFixed(6)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ≈ ${(wallet.balance * (wallet.currency === 'USDT' ? 1 : getCurrentPrice())).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No wallet data available
                </div>
              )}
            </div>
            
            {/* Live Coin Prices */}
            <CoinPriceList 
              pairs={pairs} 
              onSelectPair={handlePairSelect} 
            />
          </div>
        </div>
      )}
    </div>
  );
}