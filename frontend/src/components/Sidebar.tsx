import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Boxes,
  Bug,
  CalendarCheck2,
  BarChart3,
  History,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/resources', label: 'Resource Center', icon: FileText },
    { to: '/builds', label: 'Build Tracker', icon: Boxes },
    { to: '/bugs', label: 'Bug Tracker', icon: Bug },
    { to: '/daily-updates', label: 'Daily Updates', icon: CalendarCheck2 },
    { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'HEAD'] },
    { to: '/activity', label: 'Activity Log', icon: History },
    { to: '/users', label: 'User Directory', icon: Users, roles: ['ADMIN'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight">QA Hub</h1>
          <p className="text-[11px] text-slate-400 font-medium">Project & QA Management</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu
        </div>
        {navItems
          .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Workspace / Version Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Environment</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            Internal v1.0
          </span>
        </div>
      </div>
    </aside>
  );
};
