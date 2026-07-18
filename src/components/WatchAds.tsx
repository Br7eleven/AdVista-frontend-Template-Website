import { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAdTasks, completeAdTask, AdTask } from '../lib/userDataService';

export default function WatchAds() {
  const [ads, setAds] = useState<AdTask[]>([]);
  const [currentAd, setCurrentAd] = useState<AdTask | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      setLoading(true);
      const tasks = await fetchAdTasks();
      setAds(tasks);
    } catch (error) {
      console.error('Error loading ads:', error);
      toast.error('Failed to load available ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWatching && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isWatching && timeLeft === 0) {
      handleAdComplete();
    }
    return () => clearInterval(timer);
  }, [isWatching, timeLeft]);

  const startAd = (ad: AdTask) => {
    setCurrentAd(ad);
    setTimeLeft(ad.duration);
    setIsWatching(true);
    setIsCompleted(false);
  };

  const handleAdComplete = async () => {
    if (!currentAd) return;
    
    setIsWatching(false);
    setIsCompleted(true);
    
    const success = await completeAdTask(currentAd.id);
    if (success) {
      toast.success(`You earned $${currentAd.reward.toFixed(2)}!`);
    } else {
      toast.error('Failed to claim reward. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <RefreshCw className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">Loading available tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-light">Available Ad Tasks</h2>
          <button 
            onClick={loadAds}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Refresh ads"
          >
            <RefreshCw size={20} />
          </button>
        </div>
        
        {!isWatching && !isCompleted && (
          <>
            {ads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ads.map((ad) => (
                  <div 
                    key={ad.id} 
                    className="p-4 border border-gray-100 dark:border-dark-500 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 transition-colors cursor-pointer group bg-gray-50/50 dark:bg-dark-700/50"
                    onClick={() => startAd(ad)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-light group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {ad.title}
                      </h3>
                      <span className="text-primary-600 dark:text-primary-400 font-bold">
                        +${Number(ad.reward).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={14} className="mr-1" />
                      <span>{ad.duration} seconds</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No ads available at the moment. Check back later!</p>
              </div>
            )}
          </>
        )}

        {isWatching && currentAd && (
          <div className="text-center py-12 space-y-6">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-dark-400"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - timeLeft / currentAd.duration)}
                  className="text-primary-600 dark:text-primary-400 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-light">{timeLeft}s</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-light">Watching: {currentAd.title}</h3>
              <p className="text-gray-500 dark:text-gray-400">Do not close this tab or your reward will be lost.</p>
            </div>

            <div className="max-w-md mx-auto h-2 bg-gray-200 dark:bg-dark-400 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 dark:text-primary-400 transition-all duration-1000" 
                style={{ width: `${(1 - timeLeft / currentAd.duration) * 100}%` }}
              />
            </div>
          </div>
        )}

        {isCompleted && currentAd && (
          <div className="text-center py-12 space-y-6">
            <div className="flex justify-center">
              <CheckCircle size={80} className="text-accent-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-light">Task Completed!</h3>
              <p className="text-gray-500 dark:text-gray-400">
                You have successfully watched <span className="font-semibold">{currentAd.title}</span> and earned <span className="text-primary-600 dark:text-primary-400 font-bold">${currentAd.reward.toFixed(2)}</span>.
              </p>
            </div>
            <button
              onClick={() => setIsCompleted(false)}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
            >
              Watch Another Ad
            </button>
          </div>
        )}
      </div>

      <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg flex items-start space-x-3 border border-primary-100 dark:border-primary-900/30">
        <AlertCircle className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-medium text-primary-900 dark:text-primary-100">Pro Tip</h4>
          <p className="text-sm text-primary-700 dark:text-primary-200">
            Ad rewards are credited instantly to your available balance. You can withdraw your earnings once you reach the minimum threshold of $10.00.
          </p>
        </div>
      </div>
    </div>
  );
}
