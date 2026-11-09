import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, CheckCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';
import { api } from '../api/client';
import { NotificationItem, UserRole } from '../types';
import { Link } from 'react-router-dom';

export const TopNav: React.FC = () => {
  const { user, logout, quickSwitch } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoadingNotes(true);
      const res = await api.get<NotificationItem[]>('/notifications');
      setNotifications(res || []);
    } catch {
      // Non-blocking
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // 15s refresh
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Non-blocking
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Non-blocking
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
      {/* Quick Role Switcher for QA & Testing */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
          Switch Role:
        </span>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {(['ADMIN', 'HEAD', 'QA', 'DEVELOPER'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => quickSwitch(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                user?.role === r
                  ? 'bg-white text-sky-600 shadow-sm border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'DEVELOPER' ? 'Dev' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-semibold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {loadingNotes && notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markOneRead(n.id)}
                      className={`p-3.5 text-xs transition-colors hover:bg-slate-50 ${
                        !n.isRead ? 'bg-sky-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`flex-1 text-slate-700 ${
                            !n.isRead ? 'font-semibold text-slate-900' : ''
                          }`}
                        >
                          {n.message}
                        </p>
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => setShowNotifications(false)}
                            className="text-sky-600 hover:text-sky-800 p-0.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Role Badge */}
        <div className="h-8 w-px bg-slate-200" />
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name}
            </span>
            <div className="mt-0.5">
              <Badge label={user?.role || 'USER'} variant="role" />
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
