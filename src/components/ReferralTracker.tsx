import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReferralData {
  id: string;
  referred_user: string;
  referred_email: string;
  date_joined: string;
  total_earnings: number;
  your_commission: number;
  status: 'active' | 'inactive';
}

const ReferralTracker = () => {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('No user found');
          setLoading(false);
          return;
        }

        let code = '';
        const { data: existingCode } = await supabase
          .from('user_referrals')
          .select('referral_code')
          .eq('user_id', user.id)
          .single();

        if (existingCode && existingCode.referral_code) {
          code = existingCode.referral_code;
        } else {
          code = generateReferralCode(user.id);

          await supabase
            .from('user_referrals')
            .insert({
              user_id: user.id,
              referral_code: code,
              created_at: new Date().toISOString()
            });
        }

        setReferralCode(code);

        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/register?ref=${code}`);

        const mockReferrals = generateMockReferrals();
        setReferrals(mockReferrals);

        const total = mockReferrals.reduce((sum, ref) => sum + ref.your_commission, 0);
        setTotalEarnings(total);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching referral data:', error);
        setLoading(false);
      }
    };

    fetchReferralData();
  }, []);

  const generateReferralCode = (userId: string): string => {
    const timestamp = Date.now().toString(36);
    const userPart = userId.substring(0, 5);
    return `${userPart}${timestamp}`.toUpperCase();
  };

  const generateMockReferrals = (): ReferralData[] => {
    const names = ['John Smith', 'Alice Johnson', 'Bob Williams', 'Emma Brown', 'Michael Davis'];
    const emails = ['john@example.com', 'alice@example.com', 'bob@example.com', 'emma@example.com', 'michael@example.com'];

    return Array.from({ length: 5 }).map((_, index) => {
      const totalEarning = Math.floor(Math.random() * 1000) + 100;
      return {
        id: `ref-${index + 1}`,
        referred_user: names[index],
        referred_email: emails[index],
        date_joined: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
        total_earnings: totalEarning,
        your_commission: Math.round(totalEarning * 0.15),
        status: Math.random() > 0.3 ? 'active' : 'inactive'
      };
    });
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Referral Link */}
      <div className="bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-light">Your Referral Link</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Share this link with friends and earn 15% of their trading fees!
        </p>

        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 dark:border-dark-500 rounded-lg bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-light focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-500 transition flex items-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>

            <a
              href={referralLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 text-white rounded-lg transition flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </a>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Your Referral Code</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{referralCode}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-dark-500">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-light">Your Referrals</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">You earn 15% of all trading fees from your referrals</p>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Their Earnings
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Your Commission (15%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-600 divide-y divide-gray-200 dark:divide-dark-500">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-light">{referral.referred_user}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{referral.referred_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {referral.date_joined}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                      ${referral.total_earnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 text-right">
                      ${referral.your_commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        referral.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-dark-500 text-gray-800 dark:text-gray-300'
                      }`}>
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
    </div>
  );
};

export default ReferralTracker;
