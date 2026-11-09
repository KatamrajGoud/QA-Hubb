import React, { useState, useEffect, useCallback } from 'react';
import {
  Bug,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Edit2,
  X,
  Send,
  User,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { Bug as BugType, BugComment, Project, User as UserType, BugSeverity, BugStatus, PriorityLevel } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const STATUSES: BugStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'RETEST', 'REOPENED', 'CLOSED'];
const SEVERITIES: BugSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const BugTracker: React.FC = () => {
  const { user } = useAuth();

  // List state
  const [bugs, setBugs] = useState<BugType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Data
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBug, setSelectedBug] = useState<BugType | null>(null);
  const [comments, setComments] = useState<BugComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    module: '',
    stepsToRepro: '',
    expected: '',
    actual: '',
    severity: 'MEDIUM' as BugSeverity,
    priority: 'MEDIUM' as PriorityLevel,
    status: 'NEW' as BugStatus,
    assigneeId: '',
    evidenceUrl: '',
    retestNotes: '',
    buildId: '',
    fixedBuildId: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const LIMIT = 20;

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LIMIT.toString(),
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(severityFilter ? { severity: severityFilter } : {}),
        ...(projectFilter ? { projectId: projectFilter } : {}),
      });
      const res = await api.get<{ data: BugType[]; total: number }>(`/bugs?${params}`);
      setBugs(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load bugs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, severityFilter, projectFilter]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

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
    setFormData({
      projectId: projects[0]?.id || '',
      title: '',
      description: '',
      module: '',
      stepsToRepro: '',
      expected: '',
      actual: '',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      status: 'NEW',
      assigneeId: '',
      evidenceUrl: '',
      retestNotes: '',
      buildId: '',
      fixedBuildId: '',
    });
    setFormError('');
    setIsEditMode(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (bug: BugType) => {
    setFormData({
      projectId: bug.projectId,
      title: bug.title,
      description: bug.description,
      module: bug.module,
      stepsToRepro: bug.stepsToRepro,
      expected: bug.expected,
      actual: bug.actual,
      severity: bug.severity,
      priority: bug.priority,
      status: bug.status,
      assigneeId: bug.assigneeId || '',
      evidenceUrl: bug.evidenceUrl,
      retestNotes: bug.retestNotes,
      buildId: bug.buildId || '',
      fixedBuildId: bug.fixedBuildId || '',
    });
    setSelectedBug(bug);
    setIsEditMode(true);
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        assigneeId: formData.assigneeId || null,
        buildId: formData.buildId || null,
        fixedBuildId: formData.fixedBuildId || null,
      };
      if (isEditMode && selectedBug) {
        await api.patch(`/bugs/${selectedBug.id}`, payload);
      } else {
        await api.post('/bugs', payload);
      }
      setShowCreateModal(false);
      resetForm();
      fetchBugs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save bug');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = async (bug: BugType) => {
    setSelectedBug(bug);
    setComments([]);
    setCommentBody('');
    setShowDetailModal(true);
    try {
      const full = await api.get<BugType>(`/bugs/${bug.id}`);
      setSelectedBug(full);
      setComments(full.comments || []);
    } catch {}
  };

  const submitComment = async () => {
    if (!commentBody.trim() || !selectedBug) return;
    setSubmittingComment(true);
    try {
      const comment = await api.post<BugComment>(`/bugs/${selectedBug.id}/comments`, {
        body: commentBody.trim(),
      });
      setComments((prev) => [...prev, comment]);
      setCommentBody('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const updateBugStatus = async (bugId: string, newStatus: BugStatus) => {
    try {
      await api.patch(`/bugs/${bugId}`, { status: newStatus });
      fetchBugs();
      if (selectedBug && selectedBug.id === bugId) {
        setSelectedBug((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'HEAD' || user?.role === 'QA';
  const totalPages = Math.ceil(total / LIMIT);

  const getSeverityColor = (severity: BugSeverity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-200';
      case 'HIGH': return 'bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 border-amber-200';
      case 'LOW': return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bug Tracker</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log, track, and resolve defects across all projects.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Report Bug
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); fetchBugs(); }}
          className="flex-1 w-full relative"
        >
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search bugs by ID, title, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{total} bugs found</span>
        {statusFilter && <span>• filtered by status: <strong>{statusFilter}</strong></span>}
        {severityFilter && <span>• severity: <strong>{severityFilter}</strong></span>}
      </div>

      {/* Bug List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : bugs.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Bug className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No bugs found</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust your filters or report a new bug.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              className={`bg-white rounded-xl border transition-shadow hover:shadow-md p-4 ${getSeverityColor(bug.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">{bug.bugId}</span>
                    <Badge label={bug.severity} variant="severity" />
                    <Badge label={bug.status} variant="status" />
                    <Badge label={bug.priority} variant="priority" />
                  </div>
                  <button
                    onClick={() => openDetailModal(bug)}
                    className="mt-1.5 text-sm font-bold text-slate-900 hover:text-sky-600 text-left transition-colors line-clamp-1"
                  >
                    {bug.title}
                  </button>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                    <span>Project: <strong className="text-slate-700">{bug.project?.name || '—'}</strong></span>
                    {bug.module && <span>• Module: <strong>{bug.module}</strong></span>}
                    <span>• Assignee: <strong>{bug.assignee?.name || 'Unassigned'}</strong></span>
                    <span>• Reporter: <strong>{bug.reporter?.name || 'Unknown'}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openDetailModal(bug)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-500 hover:text-sky-600 border border-slate-200 rounded-md"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {bug._count?.comments ?? 0}
                  </button>
                  {canManage && (
                    <button
                      onClick={() => openEditModal(bug)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md"
                      title="Edit bug"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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
          <span className="text-xs text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create / Edit Bug Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title={isEditMode ? `Edit ${selectedBug?.bugId}` : 'Report New Bug'}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project *</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData((f) => ({ ...f, projectId: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Module / Feature</label>
              <input
                type="text"
                value={formData.module}
                onChange={(e) => setFormData((f) => ({ ...f, module: e.target.value }))}
                placeholder="e.g. Login, Payment, Checkout"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bug Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
              placeholder="Concise description of the defect"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Detailed description of the bug..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Steps to Reproduce</label>
            <textarea
              value={formData.stepsToRepro}
              onChange={(e) => setFormData((f) => ({ ...f, stepsToRepro: e.target.value }))}
              placeholder="1. Navigate to...\n2. Click on...\n3. Observe..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Result</label>
              <textarea
                value={formData.expected}
                onChange={(e) => setFormData((f) => ({ ...f, expected: e.target.value }))}
                placeholder="What should happen?"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Result</label>
              <textarea
                value={formData.actual}
                onChange={(e) => setFormData((f) => ({ ...f, actual: e.target.value }))}
                placeholder="What actually happens?"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData((f) => ({ ...f, severity: e.target.value as BugSeverity }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((f) => ({ ...f, priority: e.target.value as PriorityLevel }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as PriorityLevel[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value as BugStatus }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData((f) => ({ ...f, assigneeId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence URL (Screenshot / Video)</label>
            <input
              type="url"
              value={formData.evidenceUrl}
              onChange={(e) => setFormData((f) => ({ ...f, evidenceUrl: e.target.value }))}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Retest Notes</label>
              <textarea
                value={formData.retestNotes}
                onChange={(e) => setFormData((f) => ({ ...f, retestNotes: e.target.value }))}
                placeholder="Notes from QA retest..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Report Bug'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bug Detail Modal */}
      {selectedBug && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setSelectedBug(null); }}
          title={`${selectedBug.bugId} — ${selectedBug.title}`}
        >
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge label={selectedBug.severity} variant="severity" />
              <Badge label={selectedBug.status} variant="status" />
              <Badge label={selectedBug.priority} variant="priority" />
              {selectedBug.project && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                  {selectedBug.project.name}
                </span>
              )}
            </div>

            {/* Quick status change */}
            {canManage && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">Change Status:</span>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateBugStatus(selectedBug.id, s)}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-colors ${
                      selectedBug.status === s
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'text-slate-600 border-slate-200 hover:border-sky-400 hover:bg-sky-50'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Module</span>
                <span className="text-slate-800 font-semibold">{selectedBug.module || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Assignee</span>
                <span className="text-slate-800 font-semibold">{selectedBug.assignee?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Reporter</span>
                <span className="text-slate-800 font-semibold">{selectedBug.reporter?.name || 'Unknown'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Logged</span>
                <span className="text-slate-800 font-semibold">
                  {new Date(selectedBug.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedBug.description && (
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">Description</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedBug.description}</p>
              </div>
            )}

            {selectedBug.stepsToRepro && (
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">Steps to Reproduce</span>
                <pre className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap font-mono">
                  {selectedBug.stepsToRepro}
                </pre>
              </div>
            )}

            {(selectedBug.expected || selectedBug.actual) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedBug.expected && (
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 block mb-1">✓ Expected</span>
                    <p className="text-xs text-slate-700 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                      {selectedBug.expected}
                    </p>
                  </div>
                )}
                {selectedBug.actual && (
                  <div>
                    <span className="text-xs font-semibold text-rose-700 block mb-1">✗ Actual</span>
                    <p className="text-xs text-slate-700 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                      {selectedBug.actual}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedBug.evidenceUrl && (
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">Evidence</span>
                <a
                  href={selectedBug.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-600 hover:underline truncate block"
                >
                  {selectedBug.evidenceUrl}
                </a>
              </div>
            )}

            {selectedBug.retestNotes && (
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">Retest Notes</span>
                <p className="text-xs text-slate-700 bg-amber-50 border border-amber-100 p-3 rounded-lg">
                  {selectedBug.retestNotes}
                </p>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                Comments ({comments.length})
              </h4>

              <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-800">{c.user.name}</span>
                          <Badge label={c.user.role} variant="role" />
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">{c.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="Add a comment... (Enter to send)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  onClick={submitComment}
                  disabled={submittingComment || !commentBody.trim()}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
