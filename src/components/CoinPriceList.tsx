import { useState, useEffect } from 'react';
import { TradingPair, fetchFreeCryptoSpotQuotes } from '../lib/tradingApi';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CoinPriceListProps {
  pairs: TradingPair[];
  onSelectPair: (pair: TradingPair) => void;
}

interface PriceData {
  id: string;
  currentPrice: number;
  priceChange24h: number;
  lastUpdated: number;
  isUpdating: boolean;
}

const CoinPriceList = ({ pairs, onSelectPair }: CoinPriceListProps) => {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  
  const hasFreeCryptoKey = Boolean(
    (import.meta.env.VITE_FREECRYPTOAPI_KEY as string | undefined)?.trim()
  );

  // Initialize price data (placeholders; may be replaced by FreeCryptoAPI)
  useEffect(() => {
    const initialPriceData: Record<string, PriceData> = {};

    pairs.forEach((pair) => {
      let basePrice = 0;
      if (pair.base_currency === 'BTC') basePrice = 25000 + Math.random() * 5000;
      else if (pair.base_currency === 'ETH') basePrice = 1800 + Math.random() * 400;
      else if (pair.base_currency === 'SOL') basePrice = 80 + Math.random() * 20;
      else if (pair.base_currency === 'DOGE') basePrice = 0.1 + Math.random() * 0.05;
      else basePrice = 10 + Math.random() * 100;

      initialPriceData[pair.id] = {
        id: pair.id,
        currentPrice: basePrice,
        priceChange24h: (Math.random() * 10) - 5,
        lastUpdated: Date.now(),
        isUpdating: false,
      };
    });

    setPriceData(initialPriceData);
  }, [pairs]);

  // Live quotes from FreeCryptoAPI when VITE_FREECRYPTOAPI_KEY is set
  useEffect(() => {
    if (!hasFreeCryptoKey || pairs.length === 0) return;

    let cancelled = false;

    const refresh = async () => {
      const quotes = await fetchFreeCryptoSpotQuotes(pairs);
      if (cancelled || !quotes?.size) return;

      setPriceData((prev) => {
        const next = { ...prev };
        pairs.forEach((pair) => {
          const q = quotes.get(pair.base_currency.toUpperCase());
          if (!q) return;
          next[pair.id] = {
            id: pair.id,
            currentPrice: q.price,
            priceChange24h: q.change24h,
            lastUpdated: Date.now(),
            isUpdating: false,
          };
        });
        return next;
      });
    };

    void refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pairs, hasFreeCryptoKey]);
  
  // Simulate live price updates when no FreeCryptoAPI key (mock movement)
  useEffect(() => {
    if (hasFreeCryptoKey) return;

    const updateInterval = setInterval(() => {
      setPriceData(prevData => {
        const newData = { ...prevData };
        
        // Randomly select 1-3 pairs to update
        const pairsToUpdate = pairs
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 1);
        
        pairsToUpdate.forEach(pair => {
          if (!newData[pair.id]) return;
          
          const currentPrice = newData[pair.id].currentPrice;
          const changePercent = (Math.random() * 0.6) - 0.3; // -0.3% to +0.3%
          const newPrice = currentPrice * (1 + changePercent / 100);
          
          // Calculate new 24h change
          let newChange = newData[pair.id].priceChange24h;
          // Slightly adjust the 24h change to follow the current price movement
          if (changePercent > 0) {
            newChange += Math.random() * 0.1;
          } else {
            newChange -= Math.random() * 0.1;
          }
          
          // Keep 24h change within reasonable bounds
          newChange = Math.max(Math.min(newChange, 15), -15);
          
          newData[pair.id] = {
            ...newData[pair.id],
            currentPrice: newPrice,
            priceChange24h: newChange,
            lastUpdated: Date.now(),
            isUpdating: true
          };
        });
        
        // Reset the updating flag after a short delay
        setTimeout(() => {
          setPriceData(prevData => {
            const resetData = { ...prevData };
            Object.keys(resetData).forEach(key => {
              if (resetData[key].isUpdating) {
                resetData[key] = {
                  ...resetData[key],
                  isUpdating: false
                };
              }
            });
            return resetData;
          });
        }, 500);
        
        return newData;
      });
    }, 3000);
    
    return () => clearInterval(updateInterval);
  }, [pairs, hasFreeCryptoKey]);
  
  return (
    <div className="bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 overflow-hidden text-gray-900 dark:text-light">
      <div className="p-4 border-b border-gray-100 dark:border-dark-500">
        <h2 className="text-xl font-semibold">All Coins</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {hasFreeCryptoKey
            ? 'Prices from FreeCryptoAPI (refreshed every minute)'
            : 'Simulated price updates every few seconds'}
        </p>
      </div>
      
      <div className="overflow-y-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-dark-500">
          <thead className="bg-gray-50 dark:bg-dark-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Coin
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                24h Change
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-600 divide-y divide-gray-100 dark:divide-dark-500">
            {pairs.map(pair => {
              const data = priceData[pair.id];
              if (!data) return null;
              
              const isPositive = data.priceChange24h >= 0;
              const changeColor = isPositive ? 'text-accent-600 dark:text-accent-400' : 'text-secondary-600 dark:text-secondary-400';
              const bgColor = data.isUpdating ? (isPositive ? 'bg-accent-50 dark:bg-accent-900/30' : 'bg-secondary-50 dark:bg-secondary-900/30') : '';
              
              return (
                <tr 
                  key={pair.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-dark-500 cursor-pointer transition-colors ${bgColor}`}
                  onClick={() => onSelectPair(pair)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-0 md:ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-light">
                          {pair.base_currency}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {pair.display_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${data.currentPrice.toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${changeColor}`}>
                    <div className="flex items-center justify-end">
                      {isPositive ? (
                        <ArrowUp className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 mr-1" />
                      )}
                      {Math.abs(data.priceChange24h).toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoinPriceList;
