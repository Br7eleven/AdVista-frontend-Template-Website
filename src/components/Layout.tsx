import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, Users, Wallet, User, LayoutDashboard, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<{ name?: string; avatar_url?: string; is_admin?: boolean } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-royal-50 dark:bg-pin-element text-royal-700 dark:text-white font-semibold'
      : 'text-gray-700 dark:text-pin-muted hover:bg-gray-50 dark:hover:bg-pin-element hover:text-gray-900 dark:hover:text-white';
  };

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/earn', icon: DollarSign, label: 'Earn' },
    { to: '/withdraw', icon: Wallet, label: 'Cash' },
    { to: '/referrals', icon: Users, label: 'Invite' },
    { to: '/account', icon: User, label: 'You' },
  ];

  const desktopLabels: Record<string, string> = {
    '/': 'Dashboard',
    '/earn': 'Earn',
    '/withdraw': 'Withdraw',
    '/referrals': 'Referrals',
    '/account': 'Account',
    '/admin': 'Admin',
  };

  if (userProfile?.is_admin) {
    navLinks.push({ to: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  const mobileTabs = navLinks.filter((link) => link.to !== '/admin');

  const linkClass = (path: string) =>
    `flex items-center space-x-3 p-3 rounded-2xl transition-all duration-300 ${isActive(path)}`;

  return (
    <>
      {/* Mobile glass header */}
      <header className="md:hidden fixed top-0 left-0 w-full z-50 glass-header animate-nav-in">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="brand-mark" aria-hidden>
              A
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[17px] font-bold tracking-tight text-gray-950 dark:text-white leading-none">
                AdVista
              </h1>
              <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-royal-600 dark:text-royal-400 mt-0.5">
                Rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell glass />
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`glass-chip h-10 w-10 text-gray-800 dark:text-gray-100 ${
                isMobileMenuOpen ? 'bg-royal-600/15 border-royal-500/30 text-royal-700 dark:text-royal-300' : ''
              }`}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} strokeWidth={2.25} /> : <Menu size={20} strokeWidth={2.25} />}
            </button>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-500/35 to-transparent" />
      </header>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed z-40 top-0 left-0 h-full w-64 flex-col justify-between bg-white dark:bg-pin-surface border-r border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
        <div>
          <div className="p-6 flex items-center gap-3">
            <span className="brand-mark">A</span>
            <h1 className="text-xl font-bold font-display text-gray-900 dark:text-white">AdVista Rewards</h1>
          </div>

          {userProfile && (
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center space-x-3">
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-royal-600/25"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-royal-50 dark:bg-pin-element flex items-center justify-center">
                    <User size={20} className="text-royal-600 dark:text-royal-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium truncate w-32 text-gray-900 dark:text-white">
                    {userProfile.name || 'User'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col p-4 space-y-1.5">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                <link.icon size={20} />
                <span>{desktopLabels[link.to] || link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2 border-t border-gray-200 dark:border-white/10">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center space-x-3 p-3 w-full rounded-2xl text-gray-700 dark:text-pin-muted hover:bg-royal-50 dark:hover:bg-pin-element hover:text-royal-700 dark:hover:text-royal-400 transition text-left"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col h-full mx-0 bg-white/95 dark:bg-pin-surface/98 backdrop-blur-2xl border-l border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white shadow-2xl">
          {userProfile && (
            <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-white/10">
              {userProfile.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Profile"
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-royal-600/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-royal-50 dark:bg-pin-element flex items-center justify-center">
                  <User size={24} className="text-royal-600 dark:text-royal-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate text-gray-900 dark:text-white font-display">
                  {userProfile.name || 'User'}
                </p>
                <p className="text-xs text-royal-600 dark:text-pin-muted font-medium">Your space</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={linkClass(link.to)}
              >
                <link.icon size={20} />
                <span>{desktopLabels[link.to] || link.label}</span>
              </Link>
            ))}
          </div>

          <div className="shrink-0 p-4 safe-bottom space-y-2 border-t border-gray-200 dark:border-white/10">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center space-x-3 p-3.5 w-full rounded-2xl bg-royal-50 dark:bg-pin-element text-royal-700 dark:text-royal-400 hover:bg-royal-100 dark:hover:bg-[#2c303a] transition text-left font-semibold"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Pinterest-style glass dock */}
      {!isMobileMenuOpen && (
        <nav
          className="md:hidden fixed inset-x-0 bottom-0 z-50 px-3 safe-bottom pointer-events-none animate-nav-in"
          aria-label="Primary"
        >
          <div className="glass-dock pointer-events-auto mx-auto max-w-md rounded-[28px] px-1.5 py-1.5 flex items-end justify-between">
            {mobileTabs.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`dock-tab ${active ? 'dock-tab-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="dock-tab-icon">
                    <link.icon size={18} strokeWidth={active ? 2.4 : 2} />
                  </span>
                  <span className="dock-tab-label">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-black/35 backdrop-blur-[2px] z-30 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
};

export default function Layout() {
  return (
    <div className="min-h-screen bg-pin-canvas transition-colors duration-300">
      <Navigation />
      <main className="md:ml-64 p-4 md:p-8 pt-[4.75rem] md:pt-8 pb-32 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
