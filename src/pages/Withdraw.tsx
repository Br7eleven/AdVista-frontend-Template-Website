import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Withdraw() {
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    loadUserData();
    loadWithdrawals();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (userData) {
      setBalance(userData.balance);
    }
  };

  const loadWithdrawals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: withdrawalData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (withdrawalData) {
      setWithdrawals(withdrawalData);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 5)  {
      toast.error('Minimum withdrawal amount is $5.00');
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please add a payment method');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create withdrawal request
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: amount,
        status: 'pending',
        payment_method: paymentMethod,
      });

    if (withdrawalError) {
      toast.error('Failed to create withdrawal request');
      return;
    }

    // Update user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        balance: balance - amount,
      })
      .eq('id', user.id);

    if (balanceError) {
      toast.error('Failed to update balance');
      return;
    }

    toast.success('Withdrawal request submitted');
    loadUserData();
    loadWithdrawals();
    setWithdrawAmount('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Withdraw Earnings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Available Balance</h2>
          </div>
          <div className="text-3xl font-bold mb-2">${balance.toFixed(2)}</div>
          <p className="text-gray-600">Minimum withdrawal: $5.00</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Payment Method</h2>
          </div>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="">Select payment method</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Request Withdrawal</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Withdraw</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="5"
                step="0.01"
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg"
                placeholder="0.00"
              />
            </div>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!paymentMethod || !withdrawAmount || parseFloat(withdrawAmount) < 5}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Withdrawal History</h2>
        {withdrawals.length > 0 ? (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">${withdrawal.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                  withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No withdrawals yet</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Withdrawal Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Processing Time</h3>
            <p className="text-gray-600">Withdrawals are typically processed within 1-3 business days.</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Payment Methods</h3>
            <p className="text-gray-600">We currently support PayPal and bank transfers for withdrawals.</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Minimum Withdrawal</h3>
            <p className="text-gray-600">The minimum withdrawal amount is $5.00.</p>
          </div>
        </div>
      </div>
    </div>
  );
}