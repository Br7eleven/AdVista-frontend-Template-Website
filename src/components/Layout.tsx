import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, Users, Wallet, User, LayoutDashboard, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ name?: string, avatar_url?: string, is_admin?: boolean } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('name, avatar_url, is_admin')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserProfile(data);
        }
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const handleSignOut = async () => {
    // Race signOut against a timeout — if Supabase API hangs, navigate anyway
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    navigate('/login');
  };
  
  const isActive = (path: string) => {
    return location.pathname === path 
      ? 'bg-primary-50 dark:bg-dark-400 text-primary-700 dark:text-white font-medium' 
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-500 hover:text-gray-900 dark:hover:text-white';
  };

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/earn', icon: DollarSign, label: 'Earn' },
    { to: '/withdraw', icon: Wallet, label: 'Withdraw' },
    { to: '/referrals', icon: Users, label: 'Referrals' },
    { to: '/account', icon: User, label: 'Account' },
  ];

  if (userProfile?.is_admin) {
    navLinks.push({ to: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-white dark:bg-dark-600 border-b border-gray-200 dark:border-dark-500 z-50 flex items-center justify-between px-4 h-16">
        <h1 className="text-xl font-bold text-gray-900 dark:text-light">AdVista</h1>
        <div className="flex items-center space-x-1">
          <NotificationBell />
          <div className="w-10 flex justify-center">
            <ThemeToggle compact />
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-700 dark:text-gray-200"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar & Mobile Drawer */}
      <nav className={`
        fixed z-40 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        bottom-0 left-0 w-full bg-white dark:bg-dark-600 border-t md:border-t-0 md:border-r border-gray-200 dark:border-dark-500 text-gray-900 dark:text-light 
        md:w-64 md:h-full md:top-0
      `}>
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="p-6 hidden md:flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-light">AdVista Rewards</h1>
            </div>
            
            {userProfile && (
              <div className="hidden md:flex items-center p-4 border-b border-gray-200 dark:border-dark-500">
                <div className="flex items-center space-x-3">
                  {userProfile.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-400 flex items-center justify-center">
                      <User size={20} className="text-gray-600 dark:text-gray-200" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium truncate w-32 text-gray-900 dark:text-white">{userProfile.name || 'User'}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex md:flex-col justify-around md:justify-start p-4 space-y-0 md:space-y-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition ${isActive(link.to)}`}
                >
                  <link.icon size={20} />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="p-4 space-y-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center space-x-3 p-3 w-full rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-500 hover:text-gray-900 dark:hover:text-white transition text-left"
            >
              <LogOut size={20} />
              <span className="md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Bar (Bottom) - Only visible when menu is closed */}
      {!isMobileMenuOpen && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-dark-600 border-t border-gray-200 dark:border-dark-500 z-50 flex justify-around p-2">
          {navLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              className={`flex flex-col items-center p-2 rounded-lg transition ${
                location.pathname === link.to
                  ? 'text-primary-700 dark:text-white font-medium'
                  : 'text-gray-600 dark:text-gray-200'
              }`}
            >
              <link.icon size={20} />
              <span className="text-xs mt-1">{link.label}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-800 transition-colors duration-200">
      <Navigation />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}