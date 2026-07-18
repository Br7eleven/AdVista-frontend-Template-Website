import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { fetchNotifications, markNotificationAsRead, AppNotification } from '../lib/userDataService';
import { supabase } from '../lib/supabase';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription for new notifications
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new as AppNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();

    // Click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    const data = await fetchNotifications();
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
  };

  const handleMarkAsRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-accent-500" size={16} />;
      case 'error': return <XCircle className="text-secondary-500" size={16} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={16} />;
      default: return <Info className="text-primary-500" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-secondary-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-dark-600">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-600 rounded-lg shadow-xl border border-gray-100 dark:border-dark-500 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 dark:border-dark-500 flex justify-between items-center bg-gray-50 dark:bg-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-light text-sm">Notifications</h3>
            {unreadCount > 0 && <span className="text-[10px] text-gray-500 dark:text-gray-400">{unreadCount} unread</span>}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b border-gray-50 dark:border-dark-500 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getTypeIcon(n.type)}</div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900 dark:text-light' : 'text-gray-600 dark:text-gray-400'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
