import { useState, useEffect } from 'react';
import { Users, DollarSign, CreditCard, CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchAllWithdrawals, fetchAllUsers, processWithdrawal, Withdrawal, UserProfile } from '../lib/userDataService';

export default function Admin() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users'>('withdrawals');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [withdrawalsData, usersData] = await Promise.all([
        fetchAllWithdrawals(),
        fetchAllUsers()
      ]);
      setWithdrawals(withdrawalsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (id: string, status: 'completed' | 'rejected') => {
    try {
      const success = await processWithdrawal(id, status);
      if (success) {
        toast.success(`Withdrawal ${status} successfully`);
        loadData();
      } else {
        toast.error('Failed to update withdrawal');
      }
    } catch (error) {
      toast.error('Unauthorized or system error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading secure admin data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-light">Admin Control Room</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-accent-600" />
            <h2 className="text-lg font-semibold dark:text-light">Total Users</h2>
          </div>
          <div className="text-3xl font-bold dark:text-light">{users.length}</div>
        </div>

        <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-semibold dark:text-light">Pending Withdrawals</h2>
          </div>
          <div className="text-3xl font-bold dark:text-light">
            {withdrawals.filter(w => w.status === 'pending').length}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-secondary-600" />
            <h2 className="text-lg font-semibold dark:text-light">Total Paid Out</h2>
          </div>
          <div className="text-3xl font-bold dark:text-light">
            ${withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 dark:border-dark-500">
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`py-2 px-4 font-medium transition-colors ${
            activeTab === 'withdrawals' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Withdrawal Requests
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 font-medium transition-colors ${
            activeTab === 'users' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          User Management
        </button>
      </div>

      {activeTab === 'withdrawals' ? (
        <div className="bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-500">
              {withdrawals.map((w: any) => (
                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium dark:text-light">{w.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{w.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold dark:text-light">${w.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 uppercase">{w.payment_method}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      w.status === 'completed' ? 'bg-accent-100 text-accent-700' :
                      w.status === 'pending' ? 'bg-primary-50 text-primary-700' :
                      'bg-secondary-100 text-secondary-700'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {w.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleProcessWithdrawal(w.id, 'completed')}
                          className="p-1 text-accent-600 hover:bg-accent-50 rounded transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleProcessWithdrawal(w.id, 'rejected')}
                          className="p-1 text-secondary-600 hover:bg-secondary-50 rounded transition-colors"
                          title="Reject"
                        >
                          <XCircle size={20} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-600 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-500">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium dark:text-light">{user.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-accent-600">${user.balance?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_admin ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
