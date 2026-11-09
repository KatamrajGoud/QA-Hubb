import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'status' | 'priority' | 'severity' | 'role' | 'platform' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', className = '' }) => {
  const norm = label.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'status') {
    switch (norm) {
      case 'ACTIVE':
      case 'PASSED':
      case 'CLOSED':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'IN_TESTING':
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'FIXED':
      case 'RETEST':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'FAILED':
      case 'REOPENED':
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'NEW':
      case 'PENDING':
      case 'ON_HOLD':
      case 'RETEST_REQUIRED':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'ARCHIVED':
      case 'COMPLETED':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
        break;
    }
  } else if (variant === 'severity' || variant === 'priority') {
    switch (norm) {
      case 'CRITICAL':
        colorClasses = 'bg-red-100 text-red-800 border-red-300 font-semibold';
        break;
      case 'HIGH':
        colorClasses = 'bg-orange-100 text-orange-800 border-orange-200';
        break;
      case 'MEDIUM':
        colorClasses = 'bg-amber-100 text-amber-800 border-amber-200';
        break;
      case 'LOW':
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
    }
  } else if (variant === 'role') {
    switch (norm) {
      case 'ADMIN':
        colorClasses = 'bg-purple-100 text-purple-800 border-purple-200';
        break;
      case 'HEAD':
        colorClasses = 'bg-indigo-100 text-indigo-800 border-indigo-200';
        break;
      case 'QA':
        colorClasses = 'bg-cyan-100 text-cyan-800 border-cyan-200';
        break;
      case 'DEVELOPER':
        colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        break;
    }
  } else if (variant === 'platform') {
    switch (norm) {
      case 'WEB':
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        break;
      case 'ANDROID':
        colorClasses = 'bg-green-50 text-green-700 border-green-200';
        break;
      case 'IOS':
        colorClasses = 'bg-gray-100 text-gray-800 border-gray-300';
        break;
      case 'API':
        colorClasses = 'bg-violet-50 text-violet-700 border-violet-200';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      {label.replace('_', ' ')}
    </span>
  );
};
