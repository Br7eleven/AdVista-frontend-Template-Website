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
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user found');
          setLoading(false);
          return;
        }
        
        // Generate or fetch referral code
        let code = '';
        const { data: existingCode } = await supabase
          .from('user_referrals')
          .select('referral_code')
          .eq('user_id', user.id)
          .single();
        
        if (existingCode && existingCode.referral_code) {
          code = existingCode.referral_code;
        } else {
          // Generate a new code
          code = generateReferralCode(user.id);
          
          // Save the new code
          await supabase
            .from('user_referrals')
            .insert({
              user_id: user.id,
              referral_code: code,
              created_at: new Date().toISOString()
            });
        }
        
        setReferralCode(code);
        
        // Create referral link
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/register?ref=${code}`);
        
        // For demo purposes, generate mock referral data
        // In a real app, you would fetch this from the database
        const mockReferrals = generateMockReferrals();
        setReferrals(mockReferrals);
        
        // Calculate total earnings
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
    // Generate a unique code based on user ID and timestamp
    const timestamp = Date.now().toString(36);
    const userPart = userId.substring(0, 5);
    return `${userPart}${timestamp}`.toUpperCase();
  };
  
  const generateMockReferrals = (): ReferralData[] => {
    // Generate some mock referral data for demonstration
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
        your_commission: Math.round(totalEarning * 0.15), // 15% commission
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
        <p className="text-gray-600 mb-4">
          Share this link with friends and earn 15% of their trading fees!
        </p>
        
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </button>
            
            <a
              href={referralLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </a>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-blue-800">Your Referral Code</p>
              <p className="text-2xl font-bold text-blue-900">{referralCode}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-800">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Referral List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold">Your Referrals</h2>
          <p className="text-sm text-gray-500">You earn 15% of all trading fees from your referrals</p>
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Their Earnings
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Commission (15%)
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{referral.referred_user}</div>
                          <div className="text-sm text-gray-500">{referral.referred_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {referral.date_joined}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      ${referral.total_earnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                      ${referral.your_commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        referral.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
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
            <p className="text-gray-500">You haven't referred anyone yet. Share your referral link to start earning!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralTracker;
