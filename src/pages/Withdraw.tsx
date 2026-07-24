import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchUserStats, fetchUserWithdrawals, createWithdrawalRequest, UserStats, Withdrawal } from '../lib/userDataService';

export default function Withdraw() {
  const [stats, setStats] = useState<UserStats>({} as UserStats);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch user stats (includes balance)
      const userStats = await fetchUserStats();
      setStats(userStats);

      // Fetch withdrawals
      const userWithdrawals = await fetchUserWithdrawals();
      setWithdrawals(userWithdrawals);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load user data');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 5)  {
      toast.error('Minimum withdrawal amount is $5.00');
      return;
    }

    if (amount > stats.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Check if payment details are required but not provided
    if (showPaymentDetails && !paymentDetails) {
      toast.error('Please enter your payment details');
      return;
    }

    // Create withdrawal request using our service
    const success = await createWithdrawalRequest(
      amount,
      paymentMethod,
      paymentDetails || undefined
    );

    if (!success) {
      toast.error('Failed to create withdrawal request');
      return;
    }

    toast.success('Withdrawal request submitted');
    await loadData();
    setWithdrawAmount('');
    setPaymentDetails('');
    setPaymentMethod('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-light">Withdraw Earnings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border-pin text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-5 h-5 text-royal-600 dark:text-royal-400" />
            <h2 className="text-base sm:text-lg font-semibold">Available Balance</h2>
          </div>
          <div className="text-2xl sm:text-3xl font-bold mb-2">${stats.balance?.toFixed(2) || '0.00'}</div>
          <p className="text-gray-500 dark:text-gray-400">Minimum withdrawal: $5.00</p>
        </div>

        <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border-pin text-gray-900 dark:text-light">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-5 h-5 text-royal-600 dark:text-royal-400" />
            <h2 className="text-base sm:text-lg font-semibold">Payment Method</h2>
          </div>
          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              // Show payment details field for all methods except Bank Transfer
              setShowPaymentDetails(e.target.value !== '' && e.target.value !== 'bank');
            }}
            className="auth-input"
          >
            <option value="">Select payment method</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Bank Transfer</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="binance">Binance Pay</option>
          </select>
        </div>
      </div>

      <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border-pin text-gray-900 dark:text-light">
        <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-light">Request Withdrawal</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Amount to Withdraw</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="5"
                step="0.01"
                className="auth-input"
                placeholder="0.00"
              />
            </div>
          </div>

          {showPaymentDetails && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                {paymentMethod === 'paypal' ? 'PayPal Email' :
                 paymentMethod === 'jazzcash' ? 'JazzCash Number' :
                 paymentMethod === 'easypaisa' ? 'EasyPaisa Number' :
                 paymentMethod === 'binance' ? 'Binance Pay ID' : 'Payment Details'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm"
                  placeholder={paymentMethod === 'paypal' ? 'your@email.com' :
                              paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa' ? '03XX-XXXXXXX' :
                              paymentMethod === 'binance' ? '123456789' : ''}
                />
              </div>
            </div>
          )}
          <button
            onClick={handleWithdraw}
            disabled={!paymentMethod || !withdrawAmount || parseFloat(withdrawAmount) < 5 || (showPaymentDetails && !paymentDetails)}
            className="auth-btn-primary text-center"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border-pin text-gray-900 dark:text-light">
        <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-light">Withdrawal History</h2>
        {withdrawals.length > 0 ? (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-light">${withdrawal.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    withdrawal.status === 'completed' ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-200' :
                    withdrawal.status === 'pending' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200' :
                    'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-200'
                  }`}>
                    {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase">{withdrawal.payment_method}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No withdrawals yet</p>
          </div>
        )}
      </div>

      <div className="widget-surface p-4 sm:p-5 rounded-lg shadow-sm border-pin text-gray-900 dark:text-light">
        <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 dark:text-light">Withdrawal Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1 text-gray-900 dark:text-light">Processing Time</h3>
            <p className="text-gray-500 dark:text-gray-400">Withdrawals are typically processed within 1-3 business days.</p>
          </div>
          <div>
            <h3 className="font-medium mb-1 text-gray-900 dark:text-light">Payment Methods</h3>
            <p className="text-gray-500 dark:text-gray-400">We currently support PayPal, Bank Transfer, JazzCash, EasyPaisa, and Binance Pay.</p>
          </div>
          <div>
            <h3 className="font-medium mb-1 text-gray-900 dark:text-light">Minimum Withdrawal</h3>
            <p className="text-gray-500 dark:text-gray-400">The minimum withdrawal amount is $5.00.</p>
          </div>
        </div>
      </div>
    </div>
  );
}