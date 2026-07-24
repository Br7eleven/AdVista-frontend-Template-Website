// Dashboard component
import { useState, useEffect, useRef } from 'react';
import { DollarSign, Users, Clock, Trophy } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { fetchUserStats, UserStats } from '../lib/userDataService';

gsap.registerPlugin(useGSAP);

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats>({} as UserStats);
  const [loading, setLoading] = useState(true);

  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userStats = await fetchUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Stagger entrance for stat cards
  useGSAP(() => {
    if (!cardsRef.current) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: reduce)', () => { return; });
    mm.add('(max-width: 639px)', () => {
      gsap.fromTo(
        cardsRef.current!.querySelectorAll('.stat-card'),
        { opacity: 0 },
        { opacity: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out' }
      );
      return () => mm.revert();
    });
    mm.add('(min-width: 640px)', () => {
      gsap.fromTo(
        cardsRef.current!.querySelectorAll('.stat-card'),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.09, ease: 'power2.out' }
      );
      return () => mm.revert();
    });
    return () => mm.revert();
  }, { scope: cardsRef });

  if (loading) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-royal-600/30 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      icon: DollarSign,
      label: 'Available Balance',
      value: `$${stats.balance?.toFixed(2) || '0.00'}`,
      iconBg: 'rgba(230,0,35,0.08)',
      iconColor: 'text-royal-600 dark:text-royal-400',
    },
    {
      icon: Trophy,
      label: 'Total Earned',
      value: `$${stats.totalEarned?.toFixed(2) || '0.00'}`,
      iconBg: 'rgba(230,0,35,0.08)',
      iconColor: 'text-royal-600 dark:text-royal-400',
    },
    {
      icon: Clock,
      label: 'Tasks Completed',
      value: String(stats.tasksCompleted ?? 0),
      iconBg: 'rgba(230,0,35,0.08)',
      iconColor: 'text-royal-600 dark:text-royal-400',
    },
    {
      icon: Users,
      label: 'Active Referrals',
      value: String(stats.activeReferrals ?? 0),
      iconBg: 'rgba(230,0,35,0.08)',
      iconColor: 'text-royal-600 dark:text-royal-400',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        Welcome back
      </h2>

      {/* Stats grid */}
      <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="stat-card widget-surface p-4 sm:p-5"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: card.iconBg }}
              >
                <card.icon
                  size={15}
                  strokeWidth={2.2}
                  className={card.iconColor}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight">
                {card.label}
              </p>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Start Guide */}
      <div className="widget-surface p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Start Guide
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {[
            { step: '1', title: 'Watch Ads', desc: 'Complete 1-minute ad watching tasks to earn real USD.' },
            { step: '2', title: 'Track Progress', desc: 'Monitor your earnings and completed tasks in real-time.' },
            { step: '3', title: 'Withdraw Earnings', desc: 'Cash out your earnings once you reach the minimum threshold.' },
            { step: '4', title: 'Refer Friends', desc: 'Share your referral code and earn bonus rewards.' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(230,0,35,0.1)' }}
              >
                <span className="text-xs sm:text-sm font-bold text-royal-600 dark:text-royal-400">
                  {item.step}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}