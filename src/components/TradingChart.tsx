import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { CandleData } from '../lib/tradingApi';

interface TradingChartProps {
  data: CandleData[];
  height?: number;
  width?: number;
  pairName: string;
}

const TradingChart = ({ data, height = 400, width = 800, pairName }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    try {
      const newChart = createChart(chartContainerRef.current, {
        width: width,
        height: height,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        timeScale: {
          borderColor: '#d1d1d1',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#d1d1d1',
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      try {
        // @ts-ignore - Type definitions might be outdated, but this method exists in the library
        const newSeries = newChart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        setChart(newChart);
        setSeries(newSeries);
      } catch (err) {
        console.error('Error creating candlestick series:', err);
        setError('Failed to create chart series');
        newChart.remove();
      }

      // Cleanup
      return () => {
        try {
          newChart.remove();
        } catch (err) {
          console.error('Error removing chart:', err);
        }
        setChart(null);
        setSeries(null);
      };
    } catch (err) {
      console.error('Error creating chart:', err);
      setError('Failed to create chart');
    }
  }, [height, width]);

  // Update data when it changes
  useEffect(() => {
    if (!series || !chart) return;

    try {
      // Validate data
      if (!Array.isArray(data)) {
        console.error('Invalid data format: data is not an array');
        return;
      }

      if (data.length === 0) {
        // Clear the chart if no data
        series.setData([]);
        return;
      }

      // Format and validate each candle
      const formattedData = data
        .filter(candle => {
          // Filter out invalid candles
          if (!candle || typeof candle.time !== 'number' || 
              typeof candle.open !== 'number' || 
              typeof candle.high !== 'number' || 
              typeof candle.low !== 'number' || 
              typeof candle.close !== 'number') {
            console.warn('Invalid candle data:', candle);
            return false;
          }
          return true;
        })
        .map(candle => ({
          time: candle.time as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

      if (formattedData.length === 0) {
        console.warn('No valid candles in data');
        return;
      }

      // Update chart with validated data
      series.setData(formattedData);
      
      // Fit content to view
      chart.timeScale().fitContent();
    } catch (err) {
      console.error('Error updating chart data:', err);
      setError('Failed to update chart data');
    }
  }, [data, series, chart]);

  // Resize chart on container size changes
  useEffect(() => {
    if (!chart || !chartContainerRef.current) return;

    try {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== chartContainerRef.current) {
          return;
        }
        
        try {
          const { width, height } = entries[0].contentRect;
          chart.resize(width, height);
        } catch (err) {
          console.error('Error resizing chart:', err);
        }
      });

      resizeObserver.observe(chartContainerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    } catch (err) {
      console.error('Error setting up resize observer:', err);
    }
  }, [chart]);

  // Check if we have an error
  if (error) {
    return (
      <div className="w-full">
        <div className="mb-2 px-4 py-2 bg-gray-100 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">{pairName}</h3>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-400">$0.00</div>
              <div className="text-xs text-gray-500">Data unavailable</div>
            </div>
          </div>
        </div>
        <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">Chart error</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe data validation
  let hasValidData = false;
  let currentPrice = 0;
  let openPrice = 0;
  let priceChange = 0;
  let isPriceUp = false;
  let isChangePositive = false;

  try {
    hasValidData = Array.isArray(data) && data.length > 0 && 
                  data.every(candle => 
                    candle && 
                    typeof candle.open === 'number' && 
                    typeof candle.high === 'number' && 
                    typeof candle.low === 'number' && 
                    typeof candle.close === 'number');
    
    if (hasValidData) {
      currentPrice = data[data.length - 1].close;
      openPrice = data[0].open;
      priceChange = openPrice !== 0 ? ((currentPrice - openPrice) / openPrice * 100) : 0;
      isPriceUp = data[data.length - 1].close > data[data.length - 1].open;
      isChangePositive = priceChange >= 0;
    }
  } catch (err) {
    console.error('Error calculating price data:', err);
    hasValidData = false;
  }

  return (
    <div className="w-full">
      <div className="mb-2 px-4 py-2 bg-gray-100 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{pairName}</h3>
          {hasValidData ? (
            <div className="text-right">
              <div className={`text-lg font-semibold ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
                ${currentPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                24h Change: 
                <span className={isChangePositive ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-400">$0.00</div>
              <div className="text-xs text-gray-500">Loading data...</div>
            </div>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
};

export default TradingChart;
