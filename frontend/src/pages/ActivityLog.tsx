import React, { useState, useEffect } from 'react';
import {
  History,
  Filter,
  FolderKanban,
  Bug,
  Boxes,
  FileText,
  User,
  CalendarCheck2,
  Activity,
} from 'lucide-react';
import { api } from '../api/client';
import { ActivityItem, Project } from '../types';

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  PROJECT: FolderKanban,
  BUG: Bug,
  BUILD: Boxes,
  RESOURCE: FileText,
  DAILY_UPDATE: CalendarCheck2,
  USER: User,
};

const ENTITY_COLORS: Record<string, string> = {
  PROJECT: 'bg-sky-100 text-sky-600',
  BUG: 'bg-rose-100 text-rose-600',
  BUILD: 'bg-amber-100 text-amber-600',
  RESOURCE: 'bg-violet-100 text-violet-600',
  DAILY_UPDATE: 'bg-emerald-100 text-emerald-600',
  USER: 'bg-slate-100 text-slate-600',
};

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'created a',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'changed status of',
  COMMENT_ADDED: 'commented on',
};

export const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const LIMIT = 30;

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get<{ data: Project[] }>('/projects?limit=100');
        setProjects(res.data);
      } catch {}
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          ...(entityFilter ? { entity: entityFilter } : {}),
          ...(projectFilter ? { projectId: projectFilter } : {}),
        });
        const res = await api.get<{ data: ActivityItem[]; total: number }>(`/activity?${params}`);
        setLogs(res.data);
        setTotal(res.total);
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, entityFilter, projectFilter]);

  const totalPages = Math.ceil(total / LIMIT);
  const entities = ['PROJECT', 'BUG', 'BUILD', 'RESOURCE', 'DAILY_UPDATE', 'USER'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Activity Log</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Full audit trail of all actions across projects and QA workflows.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Entity Types</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{total} events</span>
      </div>

      {/* Activity Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No activity recorded</h3>
          <p className="text-xs text-slate-500 mt-1">Activity will appear here as the team performs actions.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {logs.map((log) => {
            const Icon = ENTITY_ICONS[log.entity] || Activity;
            const colorClass = ENTITY_COLORS[log.entity] || 'bg-slate-100 text-slate-600';
            const actionLabel = ACTION_LABELS[log.action] || log.action.toLowerCase();

            return (
              <div key={log.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800">
                    <span className="font-bold text-slate-900">{log.user?.name || 'System'}</span>
                    {' '}{actionLabel}{' '}
                    <span className="font-semibold text-slate-700">
                      {log.entity.toLowerCase().replace('_', ' ')}
                    </span>
                    {log.project && (
                      <span className="text-slate-500">
                        {' '}in <span className="font-semibold text-slate-800">{log.project.name}</span>
                      </span>
                    )}
                  </p>
                  {log.details && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xl">
                      {log.details}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                  {new Date(log.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-xs text-slate-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
