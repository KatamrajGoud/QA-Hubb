import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck2,
  Plus,
  Edit2,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api/client';
import { DailyUpdate, Project, User as UserType } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const DailyUpdates: React.FC = () => {
  const { user } = useAuth();

  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  // Filters
  const [projectFilter, setProjectFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<DailyUpdate | null>(null);

  // Form
  const [formProjectId, setFormProjectId] = useState('');
  const [formWorkDone, setFormWorkDone] = useState('');
  const [formCurrentTask, setFormCurrentTask] = useState('');
  const [formBlockers, setFormBlockers] = useState('');
  const [formNextSteps, setFormNextSteps] = useState('');
  const [formTimeSpent, setFormTimeSpent] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const LIMIT = 20;

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(projectFilter ? { projectId: projectFilter } : {}),
        ...(userFilter ? { userId: userFilter } : {}),
      });
      const res = await api.get<{ data: DailyUpdate[]; total: number }>(`/daily-updates?${params}`);
      setUpdates(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load daily updates:', err);
    } finally {
      setLoading(false);
    }
  }, [page, projectFilter, userFilter]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [projRes, userRes] = await Promise.all([
          api.get<{ data: Project[] }>('/projects?limit=100'),
          api.get<UserType[]>('/users'),
        ]);
        setProjects(projRes.data);
        setUsers(userRes);
      } catch {}
    };
    fetchMeta();
  }, []);

  const resetForm = () => {
    setFormProjectId('');
    setFormWorkDone('');
    setFormCurrentTask('');
    setFormBlockers('');
    setFormNextSteps('');
    setFormTimeSpent('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsEditMode(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (update: DailyUpdate) => {
    setSelectedUpdate(update);
    setFormProjectId(update.projectId || '');
    setFormWorkDone(update.workDone);
    setFormCurrentTask(update.currentTask);
    setFormBlockers(update.blockers);
    setFormNextSteps(update.nextSteps);
    setFormTimeSpent(update.timeSpent?.toString() || '');
    setFormDate(update.date.split('T')[0]);
    setFormError('');
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        projectId: formProjectId || null,
        workDone: formWorkDone.trim(),
        currentTask: formCurrentTask.trim(),
        blockers: formBlockers.trim(),
        nextSteps: formNextSteps.trim(),
        timeSpent: formTimeSpent ? parseFloat(formTimeSpent) : null,
        date: new Date(formDate).toISOString(),
      };
      if (isEditMode && selectedUpdate) {
        await api.patch(`/daily-updates/${selectedUpdate.id}`, payload);
      } else {
        await api.post('/daily-updates', payload);
      }
      setShowModal(false);
      resetForm();
      fetchUpdates();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save update');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdminOrHead = user?.role === 'ADMIN' || user?.role === 'HEAD';
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daily Updates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Post your daily standup updates — work done, blockers, and next steps.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Update
        </button>
      </div>

      {/* Filters (ADMIN/HEAD only) */}
      {isAdminOrHead && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter:</span>
          <select
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
          >
            <option value="">All Team Members</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Updates List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No updates yet</h3>
          <p className="text-xs text-slate-500 mt-1">Post your first daily standup update.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((upd) => (
            <div
              key={upd.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4.5 h-4.5 text-sky-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{upd.user?.name || 'Unknown'}</span>
                      {upd.user && <Badge label={upd.user.role} variant="role" />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <CalendarCheck2 className="w-3 h-3" />
                      {new Date(upd.date).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {upd.project && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-slate-600">
                            {upd.project.code}: {upd.project.name}
                          </span>
                        </>
                      )}
                      {upd.timeSpent != null && (
                        <>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{upd.timeSpent}h</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {(user?.id === upd.userId || isAdminOrHead) && (
                  <button
                    onClick={() => openEditModal(upd)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md flex-shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upd.workDone && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Work Done
                    </div>
                    <p className="text-xs text-slate-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                      {upd.workDone}
                    </p>
                  </div>
                )}

                {upd.currentTask && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1.5">
                      <Clock className="w-3 h-3" />
                      Current Task
                    </div>
                    <p className="text-xs text-slate-700 bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                      {upd.currentTask}
                    </p>
                  </div>
                )}

                {upd.blockers && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                      <AlertCircle className="w-3 h-3" />
                      Blockers
                    </div>
                    <p className="text-xs text-slate-700 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                      {upd.blockers}
                    </p>
                  </div>
                )}

                {upd.nextSteps && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                      <ArrowRight className="w-3 h-3" />
                      Next Steps
                    </div>
                    <p className="text-xs text-slate-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                      {upd.nextSteps}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={isEditMode ? 'Edit Daily Update' : 'Post Daily Update'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project (optional)</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">No specific project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hours Spent</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formTimeSpent}
                  onChange={(e) => setFormTimeSpent(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Done *</label>
            <textarea
              value={formWorkDone}
              onChange={(e) => setFormWorkDone(e.target.value)}
              placeholder="Summarize what you completed today..."
              rows={3}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Task / In Progress</label>
            <textarea
              value={formCurrentTask}
              onChange={(e) => setFormCurrentTask(e.target.value)}
              placeholder="What are you currently working on?"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 text-rose-700">
              Blockers / Issues
            </label>
            <textarea
              value={formBlockers}
              onChange={(e) => setFormBlockers(e.target.value)}
              placeholder="Any blockers, dependencies, or issues blocking progress? (Leave blank if none)"
              rows={2}
              className="w-full px-3 py-2 border border-rose-200 rounded-lg text-xs focus:ring-rose-400 bg-rose-50/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Next Steps / Plan</label>
            <textarea
              value={formNextSteps}
              onChange={(e) => setFormNextSteps(e.target.value)}
              placeholder="What will you work on tomorrow?"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Post Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
