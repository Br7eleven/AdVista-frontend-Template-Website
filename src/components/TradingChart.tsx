import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { CandleData } from '../lib/tradingApi';
import { useTheme } from '../context/ThemeContext';

interface TradingChartProps {
  data: CandleData[];
  height?: number;
  width?: number;
  pairName: string;
}

const TradingChart = ({ data, height = 400, width = 800, pairName }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chartColors = {
    background: isDark ? '#1A1B20' : '#ffffff',
    textColor: isDark ? '#9BA3B2' : '#333333',
    gridLines: isDark ? '#252830' : '#f0f0f0',
    borderColor: isDark ? '#3a3d45' : '#d1d1d1',
  };

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      const newChart = createChart(chartContainerRef.current, {
        width: width,
        height: height,
        layout: {
          background: { color: chartColors.background },
          textColor: chartColors.textColor,
        },
        grid: {
          vertLines: { color: chartColors.gridLines },
          horzLines: { color: chartColors.gridLines },
        },
        timeScale: {
          borderColor: chartColors.borderColor,
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: chartColors.borderColor,
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
  }, [height, width, isDark]);

  // Update chart theme when theme changes
  useEffect(() => {
    if (!chart) return;
    try {
      chart.applyOptions({
        layout: {
          background: { color: chartColors.background },
          textColor: chartColors.textColor,
        },
        grid: {
          vertLines: { color: chartColors.gridLines },
          horzLines: { color: chartColors.gridLines },
        },
        timeScale: {
          borderColor: chartColors.borderColor,
        },
        rightPriceScale: {
          borderColor: chartColors.borderColor,
        },
      });
    } catch (err) {
      console.error('Error updating chart theme:', err);
    }
  }, [isDark, chart]);

  // Update data when it changes
  useEffect(() => {
    if (!series || !chart) return;

    try {
      if (!Array.isArray(data)) {
        console.error('Invalid data format: data is not an array');
        return;
      }

      if (data.length === 0) {
        series.setData([]);
        return;
      }

      const formattedData = data
        .filter(candle => {
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

      series.setData(formattedData);
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

  if (error) {
    return (
      <div className="w-full">
        <div className="mb-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900 dark:text-light">{pairName}</h3>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-400 dark:text-gray-500">$0.00</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Data unavailable</div>
            </div>
          </div>
        </div>
        <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="text-center p-4">
            <p className="text-red-500 dark:text-red-400 mb-2">Chart error</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white rounded-lg transition"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="mb-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 dark:text-light">{pairName}</h3>
          {hasValidData ? (
            <div className="text-right">
              <div className={`text-lg font-semibold ${isPriceUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${currentPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                24h Change:
                <span className={isChangePositive ? 'text-green-600 dark:text-green-400 ml-1' : 'text-red-600 dark:text-red-400 ml-1'}>
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-400 dark:text-gray-500">$0.00</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Loading data...</div>
            </div>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
};

export default TradingChart;
