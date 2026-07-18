import { CandleData } from '../lib/tradingApi';

interface SimpleTradingChartProps {
  data: CandleData[];
  height?: number;
  width?: number;
  pairName: string;
}

const SimpleTradingChart = ({ data, height = 400, pairName }: SimpleTradingChartProps) => {
  const hasValidData = Array.isArray(data) && data.length > 0;

  const currentPrice = hasValidData ? data[data.length - 1].close : 0;
  const openPrice = hasValidData ? data[0].open : 0;
  const priceChange = hasValidData && openPrice !== 0
    ? ((currentPrice - openPrice) / openPrice * 100)
    : 0;
  const isPriceUp = hasValidData && data[data.length - 1].close > data[data.length - 1].open;
  const isChangePositive = priceChange >= 0;

  const getMinMax = () => {
    if (!hasValidData) return { min: 0, max: 1 };

    let min = data[0].low;
    let max = data[0].high;

    data.forEach((candle) => {
      min = Math.min(min, candle.low);
      max = Math.max(max, candle.high);
    });

    const padding = (max - min) * 0.1;
    return {
      min: min - padding,
      max: max + padding,
    };
  };

  const { min, max } = getMinMax();
  const range = max - min;

  const getYPosition = (price: number): number => {
    if (range === 0) return 0;
    return 100 - ((price - min) / range * 100);
  };

  return (
    <div className="w-full">
      <div className="mb-0 px-4 py-2 bg-gray-50 dark:bg-dark-700 rounded-t-lg border border-b-0 border-gray-200 dark:border-dark-500">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 dark:text-light">{pairName}</h3>
          {hasValidData ? (
            <div className="text-right">
              <div
                className={`text-lg font-semibold ${
                  isPriceUp
                    ? 'text-accent-600 dark:text-accent-400'
                    : 'text-secondary-600 dark:text-secondary-400'
                }`}
              >
                ${currentPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                24h Change:
                <span
                  className={
                    isChangePositive
                      ? 'text-accent-600 dark:text-accent-400 ml-1'
                      : 'text-secondary-600 dark:text-secondary-400 ml-1'
                  }
                >
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-500 dark:text-gray-400">$0.00</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Loading data...</div>
            </div>
          )}
        </div>
      </div>

      <div
        className="w-full bg-white dark:bg-dark-600 border border-gray-200 dark:border-dark-500 rounded-b-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {hasValidData ? (
          <div className="relative w-full h-full p-4">
            <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-300 py-2 pr-1">
              <div>${max.toFixed(0)}</div>
              <div>${((max + min) / 2).toFixed(0)}</div>
              <div>${min.toFixed(0)}</div>
            </div>

            <div className="absolute left-0 right-14 top-0 bottom-0">
              <div className="relative w-full h-full">
                <div className="absolute w-full h-1/4 border-t border-gray-200 dark:border-dark-500"></div>
                <div className="absolute w-full h-2/4 border-t border-gray-200 dark:border-dark-500"></div>
                <div className="absolute w-full h-3/4 border-t border-gray-200 dark:border-dark-500"></div>
                <div className="absolute w-full h-full border-t border-gray-200 dark:border-dark-500"></div>

                <div className="absolute inset-0 flex items-end">
                  {data.map((candle, index) => {
                    const isUp = candle.close >= candle.open;
                    const color = isUp ? 'bg-accent-500' : 'bg-secondary-500';
                    const bodyTop = getYPosition(Math.max(candle.open, candle.close));
                    const bodyBottom = getYPosition(Math.min(candle.open, candle.close));
                    const wickTop = getYPosition(candle.high);
                    const wickBottom = getYPosition(candle.low);
                    const bodyHeight = Math.max(0.5, Math.abs(bodyBottom - bodyTop));

                    const candleWidth = 100 / data.length;
                    const wickWidth = 0.5;

                    return (
                      <div key={index} className="relative" style={{ width: `${candleWidth}%`, height: '100%' }}>
                        <div
                          className={`absolute left-1/2 transform -translate-x-1/2 ${color}`}
                          style={{
                            top: `${wickTop}%`,
                            height: `${wickBottom - wickTop}%`,
                            width: `${wickWidth}px`,
                          }}
                        ></div>

                        <div
                          className={`absolute left-1/2 transform -translate-x-1/2 ${color}`}
                          style={{
                            top: `${bodyTop}%`,
                            height: `${bodyHeight}%`,
                            width: `${candleWidth * 0.6}%`,
                            minHeight: '1px',
                          }}
                        ></div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className="absolute left-0 right-0 border-b border-primary-600 dark:border-primary-400 border-dashed z-10"
                  style={{ top: `${getYPosition(currentPrice)}%` }}
                >
                  <div className="absolute right-0 -top-3 -mr-14 bg-primary-600 dark:bg-primary-500 text-white text-xs px-1 rounded">
                    ${currentPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-0 right-14 bottom-0 flex justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
              {hasValidData &&
                [0, Math.floor(data.length / 2), data.length - 1].map((index) => {
                  const date = new Date(data[index].time * 1000);
                  return (
                    <div key={index}>
                      {date.toLocaleDateString()} {date.getHours()}:{date.getMinutes().toString().padStart(2, '0')}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleTradingChart;
