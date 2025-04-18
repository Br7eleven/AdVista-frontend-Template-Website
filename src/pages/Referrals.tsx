import React, { useEffect, useState } from 'react';
import { Share2, Users, Gift, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Referrals() {
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({
    referralCount: 0,
    referralEarnings: 0,
  });

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('referral_code, referral_count, referral_earnings')
      .eq('id', user.id)
      .single();

    if (userData) {
      setReferralCode(userData.referral_code);
      setStats({
        referralCount: userData.referral_count,
        referralEarnings: userData.referral_earnings,
      });
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy referral code');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Referral Program</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Gift className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Earn $1.00 per referral</h2>
            <p className="text-gray-600">Share your code and earn when friends join</p>
          </div>
          <div className="max-w-xs mx-auto">
            <div className="relative">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-center font-medium"
              />
              <button
                onClick={copyReferralCode}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Your Referrals</h2>
          </div>
          <div className="text-3xl font-bold mb-2">{stats.referralCount}</div>
          <p className="text-gray-600">Total referrals</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Referral Earnings</h2>
          </div>
          <div className="text-3xl font-bold mb-2">${stats.referralEarnings.toFixed(2)}</div>
          <p className="text-gray-600">Total earned from referrals</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="font-semibold text-blue-600">1</span>
            </div>
            <div>
              <h3 className="font-medium">Share Your Code</h3>
              <p className="text-gray-600">Share your unique referral code with friends</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="font-semibold text-blue-600">2</span>
            </div>
            <div>
              <h3 className="font-medium">Friends Join</h3>
              <p className="text-gray-600">When they sign up using your code</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="font-semibold text-blue-600">3</span>
            </div>
            <div>
              <h3 className="font-medium">Earn Rewards</h3>
              <p className="text-gray-600">Get $1.00 for each verified referral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}