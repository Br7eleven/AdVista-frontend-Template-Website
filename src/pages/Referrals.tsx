import { useState, useEffect } from 'react';
import { Copy, Users, DollarSign, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchUserProfile, fetchUserReferrals, Referral } from '../lib/userDataService';

export default function Referrals() {
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Get user profile (includes referral code)
      const profile = await fetchUserProfile();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
        setReferralLink(`${window.location.origin}/register?ref=${profile.referral_code}`);
      } else {
        // Generate a referral code if user doesn't have one
        const newCode = generateReferralCode();
        setReferralCode(newCode);
        setReferralLink(`${window.location.origin}/register?ref=${newCode}`);
      }

      // Get user's referrals
      const userReferrals = await fetchUserReferrals();
      setReferrals(userReferrals);

      // Calculate stats
      const totalReferrals = userReferrals.length;
      const activeReferrals = userReferrals.filter(ref => ref.status === 'active').length;
      const totalEarnings = userReferrals.reduce((sum, ref) => sum + ref.your_commission, 0);

      setReferralStats({
        totalReferrals,
        activeReferrals,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy referral link');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-light">Referral Program</h1>

      <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border border-pin text-gray-900 dark:text-light">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Your Referral Link</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Share this link with friends and earn 15% of their trading fees!
        </p>

        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="auth-input w-full"
              />
            </div>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={copyReferralLink}
              className="auth-btn-secondary shrink-0 flex-1 px-4 py-2 flex items-center justify-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>

            <a
              href={referralLink}
              target="_blank"
              rel="noopener noreferrer"
              className="auth-btn-primary shrink-0 flex-1 px-4 py-2 flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </a>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50/50 dark:bg-dark-700/50 rounded-xl text-gray-900 dark:text-light">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-royal-600 dark:text-royal-400">Your Referral Code</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-light">{referralCode}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-royal-600 dark:text-royal-400">Total Earnings</p>
              <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">${referralStats.totalEarnings?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border border-pin text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            <h2 className="text-base sm:text-lg font-semibold">Total Referrals</h2>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{referralStats.totalReferrals || 0}</div>
          <p className="text-gray-500 dark:text-gray-400">People you've referred</p>
        </div>

        <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border border-pin text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            <h2 className="text-base sm:text-lg font-semibold">Total Earnings</h2>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">${referralStats.totalEarnings?.toFixed(2) || '0.00'}</div>
          <p className="text-gray-500 dark:text-gray-400">All-time earnings</p>
        </div>

        <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border border-pin text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            <h2 className="text-base sm:text-lg font-semibold">Active Referrals</h2>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{referralStats.activeReferrals || 0}</div>
          <p className="text-gray-500 dark:text-gray-400">Currently active users</p>
        </div>

        <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border border-pin text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
            <h2 className="text-base sm:text-lg font-semibold">Monthly Earnings</h2>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">${referralStats.totalEarnings?.toFixed(2) || '0.00'}</div>
          <p className="text-gray-500 dark:text-gray-400">Last 30 days</p>
        </div>
      </div>

      {/* Referral List */}
      <div className="widget-surface rounded-lg shadow-sm border border-pin overflow-hidden text-gray-900 dark:text-light">
        <div className="p-4 border-b border-pin">
          <h2 className="text-base sm:text-lg font-semibold">Your Referrals</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">You earn 15% of all trading fees from your referrals</p>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-600 dark:border-royal-400"></div>
          </div>
        ) : referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trades
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Their Earnings
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Your Commission
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="widget-surface divide-y divide-gray-200 dark:divide-dark-500">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-500/50 transition-colors text-gray-900 dark:text-light">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex flex-col">
                          <span className="font-medium">{referral.referred_user}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{referral.referred_email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {referral.date_joined}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      {referral.trades_count}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      {referral.last_active}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                      ${referral.total_earnings.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-secondary-600 dark:text-secondary-400 text-right">
                      ${referral.your_commission.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${referral.status === 'active' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-200' : 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-200'}`}>
                        {referral.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">You haven't referred anyone yet. Share your referral link to start earning!</p>
          </div>
        )}
      </div>

      <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border border-pin text-gray-900 dark:text-light">
        <h2 className="text-base sm:text-lg font-semibold mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-royal-50 dark:bg-royal-900/20 p-2 rounded-full h-7 w-7 flex items-center justify-center">
              <span className="font-semibold text-royal-600 dark:text-royal-400">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-light">Share Your Referral Link</h3>
              <p className="text-gray-500 dark:text-gray-400">Share your unique referral link with friends and on social media</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-royal-50 dark:bg-royal-900/20 p-2 rounded-full h-7 w-7 flex items-center justify-center">
              <span className="font-semibold text-royal-600 dark:text-royal-400">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-light">Friends Start Trading</h3>
              <p className="text-gray-500 dark:text-gray-400">When they sign up using your link and start trading</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-royal-50 dark:bg-royal-900/20 p-2 rounded-full h-7 w-7 flex items-center justify-center">
              <span className="font-semibold text-royal-600 dark:text-royal-400">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-light">Earn Commissions</h3>
              <p className="text-gray-500 dark:text-gray-400">Get 15% of all trading fees they generate, forever!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}