export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  totalEarned: number;
  referralCode: string;
  referralCount: number;
  referralEarnings: number;
  tasksCompleted: number;
}

export interface Task {
  id: string;
  type: 'ad_watch';
  status: 'available' | 'in_progress' | 'completed';
  reward: number;
  duration: number;
}