import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  AlertTriangle,
  Boxes,
  Bug,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardData } from '../types';
import { Badge } from '../components/Badge';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get<DashboardData>('/dashboard');
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const { projects, bugs, builds, blockedProjects, recentActivity, recentBuilds } = data || {
    projects: { total: 0, active: 0, inTesting: 0, completed: 0 },
    bugs: { total: 0, open: 0, critical: 0, high: 0, medium: 0, low: 0 },
    builds: { awaitingTesting: 0 },
    blockedProjects: [],
    recentActivity: [],
    recentBuilds: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive & QA Overview</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time project health, build statuses, and quality metrics across the organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/bugs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Bug className="w-4 h-4" />
            Report Bug
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <FolderKanban className="w-4 h-4" />
            View Projects
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active Projects */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Projects
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{projects.total}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{projects.active} Active</span>
              <span>•</span>
              <span className="font-semibold text-sky-600">{projects.inTesting} In Testing</span>
            </div>
          </div>
        </div>

        {/* Builds Awaiting Testing */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Builds in QA Queue
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{builds.awaitingTesting}</div>
            <p className="mt-2 text-xs text-slate-500">Awaiting validation and smoke testing</p>
          </div>
        </div>

        {/* Open Bugs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Defects
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <Bug className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-rose-600">{bugs.open}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <span className="font-bold text-red-600">{bugs.critical} Critical</span>
              <span>•</span>
              <span className="font-semibold text-orange-600">{bugs.high} High</span>
            </div>
          </div>
        </div>

        {/* Blocked / On Hold */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Blocked Projects
            </span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{blockedProjects.length}</div>
            <p className="mt-2 text-xs text-slate-500">Projects on hold or blocked</p>
          </div>
        </div>
      </div>

      {/* Middle Section: Severity Breakdown & Blocked Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bug Severity Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-sky-600" />
            Defects By Severity
          </h3>
          <p className="text-xs text-slate-500 mt-1">Open bugs needing resolution</p>

          <div className="mt-6 space-y-4 flex-1 flex flex-col justify-center">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-red-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span> Critical
                </span>
                <span>{bugs.critical}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all"
                  style={{ width: `${bugs.open > 0 ? (bugs.critical / bugs.open) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-orange-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> High
                </span>
                <span>{bugs.high}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${bugs.open > 0 ? (bugs.high / bugs.open) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium
                </span>
                <span>{bugs.medium}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${bugs.open > 0 ? (bugs.medium / bugs.open) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Low
                </span>
                <span>{bugs.low}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-slate-400 h-2 rounded-full transition-all"
                  style={{ width: `${bugs.open > 0 ? (bugs.low / bugs.open) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Builds Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-sky-600" />
              Latest Builds
            </h3>
            <Link to="/builds" className="text-xs font-semibold text-sky-600 hover:text-sky-800">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {recentBuilds.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No builds released yet.</div>
            ) : (
              recentBuilds.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{b.version}</span>
                      <Badge label={b.platform} variant="platform" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                      {b.project?.name}
                    </p>
                  </div>
                  <Badge label={b.qaStatus} variant="status" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blocked Projects & Critical Action Items */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Blocked Projects
            </h3>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {blockedProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                🎉 No projects currently blocked!
              </div>
            ) : (
              blockedProjects.map((p) => (
                <div key={p.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    <Badge label={p.status} variant="status" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {p.description || 'No blocker description recorded.'}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Lead: {p.owner?.name || 'Unassigned'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            Recent Organization Activity
          </h3>
          <Link to="/activity" className="text-xs font-semibold text-sky-600 hover:text-sky-800">
            View full log
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No activity logged yet.</div>
          ) : (
            recentActivity.slice(0, 6).map((item) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-800">
                      <span className="font-semibold text-slate-900">{item.user?.name || 'System'}</span>{' '}
                      {item.action.toLowerCase()}{' '}
                      <span className="font-medium text-slate-700">{item.entity.toLowerCase()}</span>
                      {item.project && (
                        <span>
                          {' '}
                          in <span className="font-semibold text-slate-900">{item.project.name}</span>
                        </span>
                      )}
                    </p>
                    {item.details && (
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-xl">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleDateString([], {
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
    </div>
  );
};
