import { supabase } from './supabase';

// User profile interface
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  balance: number;
  referral_code?: string;
  is_admin: boolean;
  created_at: string;
}

// Cache for user data to ensure consistency
let userProfileCache: UserProfile | null = null;
let userStatsCache: UserStats | null = null;
let userWithdrawalsCache: Withdrawal[] | null = null;
let userReferralsCache: Referral[] | null = null;

// Function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Function to fetch user profile
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    // If we have cached data, return it
    if (userProfileCache) {
      return userProfileCache;
    }

    const user = await getCurrentUser();
    if (!user) return null;

    // Get user profile from database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    userProfileCache = data as UserProfile;
    return userProfileCache;
  } catch (error) {
    console.error('Exception in fetchUserProfile:', error);
    return null;
  }
};

// Function to check if current user is admin
export const checkIsAdmin = async (): Promise<boolean> => {
  const profile = await fetchUserProfile();
  return profile?.is_admin || false;
};

// Admin: Fetch all withdrawals
export const fetchAllWithdrawals = async (): Promise<Withdrawal[]> => {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        *,
        user:users(name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all withdrawals:', error);
      return [];
    }

    return data as any[];
  } catch (error) {
    console.error('Exception in fetchAllWithdrawals:', error);
    return [];
  }
};

// Admin: Process withdrawal
export const processWithdrawal = async (withdrawalId: string, status: 'completed' | 'rejected'): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('process_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_status: status
    });

    if (error) {
      console.error('Error processing withdrawal:', error);
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Exception in processWithdrawal:', error);
    return false;
  }
};

// Admin: Fetch all users
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      return [];
    }

    return data as UserProfile[];
  } catch (error) {
    console.error('Exception in fetchAllUsers:', error);
    return [];
  }
};

// Withdrawal interface
export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  payment_method: string;
  payment_details?: string;
  created_at: string;
}

// Referral interface
export interface Referral {
  id: string;
  user_id: string;
  referred_user: string;
  referred_email: string;
  date_joined: string;
  total_earnings: number;
  your_commission: number;
  status: 'active' | 'inactive';
  last_active: string;
  trades_count: number;
}

// Stats interface (Aligned with your schema)
export interface UserStats {
  balance: number;
  totalEarned: number;
  tasksCompleted: number;
  referralCount: number;
  referralEarnings: number;
  activeReferrals: number;
  monthlyEarnings: number;
}

// ... (fetchUserProfile remains same)

// Function to fetch user stats (Aligned with your schema)
export const fetchUserStats = async (): Promise<UserStats> => {
  try {
    if (userStatsCache) return userStatsCache;

    const user = await getCurrentUser();
    if (!user) return { balance: 0, totalEarned: 0, tasksCompleted: 0, referralCount: 0, referralEarnings: 0, activeReferrals: 0, monthlyEarnings: 0 };

    // Get user data directly from the users table columns
    const { data: profile, error } = await supabase
      .from('users')
      .select('balance, total_earned, tasks_completed, referral_count, referral_earnings')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return { balance: 0, totalEarned: 0, tasksCompleted: 0, referralCount: 0, referralEarnings: 0, activeReferrals: 0, monthlyEarnings: 0 };
    }

    // Get active referrals count from referrals table
    const { count: activeCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'active');

    const stats = {
      balance: profile.balance || 0,
      totalEarned: profile.total_earned || 0,
      tasksCompleted: profile.tasks_completed || 0,
      referralCount: profile.referral_count || 0,
      referralEarnings: profile.referral_earnings || 0,
      activeReferrals: activeCount || 0,
      monthlyEarnings: profile.referral_earnings || 0 // Default to total for now
    };
    
    userStatsCache = stats;
    return stats;
  } catch (error) {
    console.error('Exception in fetchUserStats:', error);
    return { balance: 0, totalEarned: 0, tasksCompleted: 0, referralCount: 0, referralEarnings: 0, activeReferrals: 0, monthlyEarnings: 0 };
  }
};

// Function to fetch user withdrawals
export const fetchUserWithdrawals = async (): Promise<Withdrawal[]> => {
  try {
    // If we have cached data, return it
    if (userWithdrawalsCache) {
      return userWithdrawalsCache;
    }

    const user = await getCurrentUser();
    if (!user) return [];

    // Get withdrawals from database
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return [];
    }

    userWithdrawalsCache = data as Withdrawal[];
    return userWithdrawalsCache;
  } catch (error) {
    console.error('Exception in fetchUserWithdrawals:', error);
    return [];
  }
};

// Function to fetch user referrals
export const fetchUserReferrals = async (): Promise<Referral[]> => {
  try {
    // If we have cached data, return it
    if (userReferralsCache) {
      return userReferralsCache;
    }

    const user = await getCurrentUser();
    if (!user) return [];

    // Get referrals from database
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('user_id', user.id)
      .order('date_joined', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      
      // For demo purposes, generate mock referrals
      const mockReferrals = generateMockReferrals(user.id);
      userReferralsCache = mockReferrals;
      return mockReferrals;
    }

    userReferralsCache = data as Referral[];
    return userReferralsCache;
  } catch (error) {
    console.error('Exception in fetchUserReferrals:', error);
    return [];
  }
};

// Function to create a withdrawal request
export const createWithdrawalRequest = async (
  amount: number, 
  paymentMethod: string,
  paymentDetails?: string
): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Get user profile for balance check
    const profile = await fetchUserProfile();
    if (!profile || profile.balance < amount) {
      return false;
    }

    // Create withdrawal request
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        created_at: new Date().toISOString()
      });

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError);
      return false;
    }

    // Update user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        balance: profile.balance - amount
      })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return false;
    }

    // Clear caches to force refresh
    userProfileCache = null;
    userStatsCache = null;
    userWithdrawalsCache = null;

    return true;
  } catch (error) {
    console.error('Exception in createWithdrawalRequest:', error);
    return false;
  }
};

// Ad task interface
export interface AdTask {
  id: string;
  title: string;
  duration: number;
  reward: number;
}

// Function to fetch available ad tasks
export const fetchAdTasks = async (): Promise<AdTask[]> => {
  try {
    const { data, error } = await supabase
      .from('ad_tasks')
      .select('*')
      .eq('is_active', true)
      .order('reward', { ascending: false });

    if (error) {
      console.error('Error fetching ad tasks:', error);
      return [];
    }

    return data as AdTask[];
  } catch (error) {
    console.error('Exception in fetchAdTasks:', error);
    return [];
  }
};

// Function to complete an ad task securely via RPC
export const completeAdTask = async (taskId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('complete_ad_task', {
      p_task_id: taskId
    });

    if (error) {
      console.error('Error completing ad task:', error);
      return false;
    }

    // Clear caches to force refresh
    userProfileCache = null;
    userStatsCache = null;

    return data as boolean;
  } catch (error) {
    console.error('Exception in completeAdTask:', error);
    return false;
  }
};

// Function to reward user for completing a task (kept for backward compatibility, but now uses completeAdTask if possible)
export const rewardUser = async (amount: number, taskId?: string): Promise<boolean> => {
  if (taskId) {
    return completeAdTask(taskId);
  }
  
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Get user profile for current balance
    const profile = await fetchUserProfile();
    if (!profile) return false;

    // Update user balance in database
    const { error } = await supabase
      .from('users')
      .update({
        balance: profile.balance + amount
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error rewarding user:', error);
      return false;
    }

    // Clear caches to force refresh
    userProfileCache = null;
    userStatsCache = null;

    return true;
  } catch (error) {
    console.error('Exception in rewardUser:', error);
    return false;
  }
};

// Function to update user profile
export const updateUserProfile = async (
  name: string,
  email: string,
  phone?: string
): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Update auth metadata
    if (phone) {
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { 
          name,
          phone
        }
      });

      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError);
        return false;
      }
    }

    // Update user profile in database
    const { error: profileUpdateError } = await supabase
      .from('users')
      .update({
        name,
        email
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError);
      return false;
    }

    // Clear cache to force refresh
    userProfileCache = null;

    return true;
  } catch (error) {
    console.error('Exception in updateUserProfile:', error);
    return false;
  }
};

// Helper function to generate mock referrals (for demo)
const generateMockReferrals = (userId: string): Referral[] => {
  const names = ['John Smith', 'Alice Johnson', 'Bob Williams', 'Emma Brown', 'Michael Davis', 'Sarah Wilson', 'David Taylor'];
  const emails = ['john@example.com', 'alice@example.com', 'bob@example.com', 'emma@example.com', 'michael@example.com', 'sarah@example.com', 'david@example.com'];
  
  return Array.from({ length: 7 }).map((_, index) => {
    const totalEarning = Math.floor(Math.random() * 1000) + 100;
    const commission = Math.round(totalEarning * 0.15); // 15% commission
    const isActive = Math.random() > 0.3;
    const joinDate = new Date(Date.now() - Math.random() * 10000000000);
    const lastActive = isActive 
      ? new Date(Date.now() - Math.random() * 1000000000) 
      : new Date(Date.now() - Math.random() * 5000000000);
    
    return {
      id: `ref-${index + 1}`,
      user_id: userId,
      referred_user: names[index],
      referred_email: emails[index],
      date_joined: joinDate.toISOString().split('T')[0],
      total_earnings: totalEarning,
      your_commission: commission,
      status: isActive ? 'active' : 'inactive',
      last_active: lastActive.toISOString().split('T')[0],
      trades_count: Math.floor(Math.random() * 50) + 1
    };
  });
};

// Notification interface
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

// Function to fetch user notifications
export const fetchNotifications = async (): Promise<AppNotification[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data as AppNotification[];
  } catch (error) {
    console.error('Exception in fetchNotifications:', error);
    return [];
  }
};

// Function to mark notification as read
export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in markNotificationAsRead:', error);
    return false;
  }
};
