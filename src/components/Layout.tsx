import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, Users, Wallet, User, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Toaster } from 'react-hot-toast';

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-blue-600 text-white md:w-64 md:h-full md:top-0">
      <div className="flex flex-col h-full">
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold">AdVista Rewards</h1>
        </div>
        
        <div className="flex md:flex-col justify-around md:justify-start p-4 space-y-0 md:space-y-2">
          <Link to="/" className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-700 transition ${isActive('/')}`}>
            <LayoutDashboard size={20} />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
          
          <Link to="/earn" className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-700 transition ${isActive('/earn')}`}>
            <DollarSign size={20} />
            <span className="hidden md:inline">Earn</span>
          </Link>
          
          <Link to="/withdraw" className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-700 transition ${isActive('/withdraw')}`}>
            <Wallet size={20} />
            <span className="hidden md:inline">Withdraw</span>
          </Link>
          
          <Link to="/referrals" className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-700 transition ${isActive('/referrals')}`}>
            <Users size={20} />
            <span className="hidden md:inline">Referrals</span>
          </Link>
          
          <Link to="/account" className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-700 transition ${isActive('/account')}`}>
            <User size={20} />
            <span className="hidden md:inline">Account</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="md:ml-64 p-6">
        <Outlet />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}