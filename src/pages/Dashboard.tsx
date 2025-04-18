import React from 'react';
import { DollarSign, Users, Clock, Trophy } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Available Balance', value: '$0.00', icon: DollarSign },
    { label: 'Total Earned', value: '$0.00', icon: Trophy },
    { label: 'Tasks Completed', value: '0', icon: Clock },
    { label: 'Referrals', value: '0', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to AdVista Rewards</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Quick Start Guide</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="font-semibold text-blue-600">1</span>
            </div>
            <div>
              <h3 className="font-medium">Watch Ads</h3>
              <p className="text-gray-600">Complete 1-minute ad watching tasks to earn real USD.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="font-semibold text-blue-600">2</span>
            </div>
            <div>
              <h3 className="font-medium">Track Progress</h3>
              <p className="text-gray-600">Monitor your earnings and completed tasks in real-time.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="font-semibold text-blue-600">3</span>
            </div>
            <div>
              <h3 className="font-medium">Withdraw Earnings</h3>
              <p className="text-gray-600">Cash out your earnings once you reach the minimum threshold.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="font-semibold text-blue-600">4</span>
            </div>
            <div>
              <h3 className="font-medium">Refer Friends</h3>
              <p className="text-gray-600">Share your referral code and earn bonus rewards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}