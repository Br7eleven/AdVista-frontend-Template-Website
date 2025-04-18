import React, { useState, useEffect } from 'react';
import { Play, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Earn() {
  const [isWatching, setIsWatching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    earningsToday: 0,
  });

  useEffect(() => {
    loadTasks();
    loadStats();
  }, []);

  const loadTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'ad_watch')
      .order('created_at', { ascending: false })
      .limit(3);

    if (tasks) {
      setRecentTasks(tasks);
    }
  };

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'ad_watch')
      .gte('created_at', today.toISOString())
      .eq('status', 'completed');

    if (tasks) {
      const totalEarnings = tasks.reduce((sum, task) => sum + task.reward, 0);
      setStats({
        tasksCompleted: tasks.length,
        earningsToday: totalEarnings,
      });
    }
  };

  const startTask = () => {
    setIsWatching(true);
    setTimeLeft(60);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completeTask();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeTask = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const reward = 0.10;

    // Create new task
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        type: 'ad_watch',
        status: 'completed',
        reward: reward,
        completed_at: new Date().toISOString(),
      });

    if (taskError) {
      toast.error('Failed to complete task');
      return;
    }

    // Update user balance and stats
    const { error: userError } = await supabase
      .from('users')
      .update({
        balance: supabase.rpc('increment', { amount: reward }),
        total_earned: supabase.rpc('increment', { amount: reward }),
        tasks_completed: supabase.rpc('increment', { amount: 1 }),
      })
      .eq('id', user.id);

    if (userError) {
      toast.error('Failed to update balance');
      return;
    }

    setIsWatching(false);
    toast.success('Task completed! Earned $0.10');
    loadTasks();
    loadStats();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Earn Rewards</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            {isWatching ? (
              <div className="text-2xl font-bold text-blue-600">{timeLeft}s</div>
            ) : (
              <Play className="w-12 h-12 text-blue-600" />
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">Watch Ad to Earn $0.10</h2>
            <p className="text-gray-600">Complete a 1-minute ad watching task</p>
          </div>
          
          <button
            onClick={startTask}
            disabled={isWatching}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isWatching ? 'Watching...' : 'Start Task'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Today's Progress</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Tasks Completed</span>
            <span className="font-semibold">{stats.tasksCompleted}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(stats.tasksCompleted / 10) * 100}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Earnings Today</span>
            <span className="font-semibold">${stats.earningsToday.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
        <div className="space-y-3">
          {recentTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Ad Watch Task</span>
              </div>
              <span className="text-green-500">+${task.reward.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}