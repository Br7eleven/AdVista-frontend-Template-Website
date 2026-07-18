// Dashboard component
import { useState, useEffect } from 'react';
import { DollarSign, Users, Clock, Trophy } from 'lucide-react';
import { fetchUserStats, UserStats } from '../lib/userDataService';

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats>({} as UserStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userStats = await fetchUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600 dark:text-light">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-light">Welcome to AdVista Rewards</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Available Balance */}
        <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
              <div className="text-3xl font-bold">${stats.balance?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </div>
        
        {/* Total Earned */}
        <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
              <div className="text-3xl font-bold">${stats.totalEarned?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </div>
        
        {/* Tasks Completed */}
        <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-3 rounded-full">
              <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tasks Completed</p>
              <div className="text-3xl font-bold">{stats.tasksCompleted || 0}</div>
            </div>
          </div>
        </div>
        
        {/* Referrals */}
        <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-3 rounded-full">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Referrals</p>
              <div className="text-3xl font-bold">{stats.activeReferrals || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 text-gray-900 dark:text-light">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-light">Quick Start Guide</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-2 rounded-full h-8 w-8 flex items-center justify-center">
              <span className="font-semibold text-primary-600 dark:text-primary-400">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-light">Watch Ads</h3>
              <p className="text-gray-500 dark:text-gray-400">Complete 1-minute ad watching tasks to earn real USD.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-2 rounded-full h-8 w-8 flex items-center justify-center">
              <span className="font-semibold text-primary-600 dark:text-primary-400">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-light">Track Progress</h3>
              <p className="text-gray-500 dark:text-gray-400">Monitor your earnings and completed tasks in real-time.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-2 rounded-full h-8 w-8 flex items-center justify-center">
              <span className="font-semibold text-primary-600 dark:text-primary-400">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-light">Withdraw Earnings</h3>
              <p className="text-gray-500 dark:text-gray-400">Cash out your earnings once you reach the minimum threshold.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-primary-50 dark:bg-dark-400 p-2 rounded-full h-8 w-8 flex items-center justify-center">
              <span className="font-semibold text-primary-600 dark:text-primary-400">4</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-light">Refer Friends</h3>
              <p className="text-gray-500 dark:text-gray-400">Share your referral code and earn bonus rewards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}