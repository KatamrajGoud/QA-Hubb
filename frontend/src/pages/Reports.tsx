import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bug,
  Boxes,
  FolderKanban,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { Badge } from '../components/Badge';

interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  status: string;
  priority: string;
  targetDate: string | null;
  totalBugs: number;
  totalBuilds: number;
  openBugs: number;
  criticalBugs: number;
  latestBuildStatus: string | null;
}

interface BugStats {
  byStatus: { status: string; _count: { _all: number } }[];
  bySeverity: { severity: string; _count: { _all: number } }[];
  byAssignee: { assigneeId: string; _count: { _all: number } }[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-slate-200',
  ASSIGNED: 'bg-sky-300',
  IN_PROGRESS: 'bg-blue-400',
  FIXED: 'bg-emerald-400',
  RETEST: 'bg-amber-400',
  REOPENED: 'bg-orange-500',
  CLOSED: 'bg-slate-400',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-400',
  LOW: 'bg-slate-400',
};

export const Reports: React.FC = () => {
  const [summary, setSummary] = useState<ProjectSummary[]>([]);
  const [bugStats, setBugStats] = useState<BugStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'bugs'>('projects');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, statRes] = await Promise.all([
        api.get<ProjectSummary[]>('/reports/summary'),
        api.get<BugStats>('/reports/bug-stats'),
      ]);
      setSummary(sumRes);
      setBugStats(statRes);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBugs = bugStats?.bySeverity.reduce((acc, s) => acc + s._count._all, 0) || 0;
  const totalOpen = bugStats?.byStatus
    .filter((s) => !['CLOSED', 'FIXED'].includes(s.status))
    .reduce((acc, s) => acc + s._count._all, 0) || 0;

  const getHealthColor = (project: ProjectSummary) => {
    if (project.criticalBugs > 0) return 'border-l-red-500';
    if (project.openBugs > 5) return 'border-l-orange-400';
    if (project.openBugs > 0) return 'border-l-amber-400';
    return 'border-l-emerald-400';
  };

  const isOverdue = (targetDate: string | null) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">QA Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive-level overview of project health, bug trends, and team performance.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Top KPI Cards */}
      {!loading && bugStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</span>
              <FolderKanban className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{summary.length}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {summary.filter((p) => p.status === 'ACTIVE').length} active
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bugs</span>
              <Bug className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalBugs}</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">{totalOpen} open</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Critical</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-red-600">
              {bugStats.bySeverity.find((s) => s.severity === 'CRITICAL')?._count._all || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">critical defects</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue</span>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black text-orange-600">
              {summary.filter((p) => isOverdue(p.targetDate) && p.status !== 'COMPLETED').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">past deadline</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl shadow-sm">
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Project Health Matrix
        </button>
        <button
          onClick={() => setActiveTab('bugs')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'bugs'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bug className="w-4 h-4" />
          Bug Statistics
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : activeTab === 'projects' ? (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-sm overflow-hidden">
          {summary.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No project data</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Project</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Priority</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Total Bugs</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Open</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Critical</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Builds</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Latest QA</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Target Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 border-l-4 ${getHealthColor(p)}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={p.status} variant="status" />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={p.priority} variant="priority" />
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {p.totalBugs}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${p.openBugs > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                          {p.openBugs}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${p.criticalBugs > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {p.criticalBugs}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {p.totalBuilds}
                      </td>
                      <td className="px-4 py-3">
                        {p.latestBuildStatus ? (
                          <Badge label={p.latestBuildStatus} variant="status" />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.targetDate ? (
                          <span
                            className={`font-semibold ${
                              isOverdue(p.targetDate) && p.status !== 'COMPLETED'
                                ? 'text-red-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {new Date(p.targetDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                            {isOverdue(p.targetDate) && p.status !== 'COMPLETED' && (
                              <span className="ml-1 text-red-500">⚠</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Bug Stats Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-600" />
              Bugs by Status
            </h3>
            <div className="space-y-3">
              {(bugStats?.byStatus || []).map((item) => {
                const pct = totalBugs > 0 ? (item._count._all / totalBugs) * 100 : 0;
                return (
                  <div key={item.status}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">{item.status.replace('_', ' ')}</span>
                      <span className="text-slate-500">{item._count._all}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${STATUS_COLORS[item.status] || 'bg-slate-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!bugStats?.byStatus || bugStats.byStatus.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No bug data available.</p>
              )}
            </div>
          </div>

          {/* By Severity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Bugs by Severity
            </h3>
            <div className="space-y-3">
              {(bugStats?.bySeverity || []).map((item) => {
                const pct = totalBugs > 0 ? (item._count._all / totalBugs) * 100 : 0;
                return (
                  <div key={item.severity}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">{item.severity}</span>
                      <span className="text-slate-500">{item._count._all}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${SEVERITY_COLORS[item.severity] || 'bg-slate-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!bugStats?.bySeverity || bugStats.bySeverity.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-4">No bug data available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
