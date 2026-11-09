import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  Edit2,
  Archive,
  Calendar,
  Layers,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import { Project, User, PriorityLevel, ProjectStatus } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('ACTIVE');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('MEDIUM');
  const [formTechStack, setFormTechStack] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
      });
      const res = await api.get<{ data: Project[]; total: number }>(`/projects?${queryParams}`);
      setProjects(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>('/users');
      setUsers(res);
      if (res.length > 0 && !formOwnerId) {
        setFormOwnerId(res[0].id);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormDesc('');
    setFormStatus('ACTIVE');
    setFormPriority('MEDIUM');
    setFormTechStack('');
    setFormStartDate('');
    setFormTargetDate('');
    if (user) setFormOwnerId(user.id);
    setFormError('');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/projects', {
        code: formCode.toUpperCase().trim(),
        name: formName.trim(),
        description: formDesc.trim(),
        status: formStatus,
        priority: formPriority,
        techStack: formTechStack.trim(),
        startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
        targetDate: formTargetDate ? new Date(formTargetDate).toISOString() : null,
        ownerId: formOwnerId || user?.id,
      });
      setShowCreateModal(false);
      resetForm();
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (p: Project) => {
    setSelectedProject(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormStatus(p.status);
    setFormPriority(p.priority);
    setFormTechStack(p.techStack);
    setFormStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setFormTargetDate(p.targetDate ? p.targetDate.split('T')[0] : '');
    setFormOwnerId(p.ownerId);
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setFormError('');
    setSubmitting(true);
    try {
      await api.patch(`/projects/${selectedProject.id}`, {
        name: formName.trim(),
        description: formDesc.trim(),
        status: formStatus,
        priority: formPriority,
        techStack: formTechStack.trim(),
        startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
        targetDate: formTargetDate ? new Date(formTargetDate).toISOString() : null,
        ownerId: formOwnerId,
      });
      setShowEditModal(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveProject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive project "${name}"?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to archive project');
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'HEAD';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Project Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage projects, assigned teams, tech stacks, and delivery milestones.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by project name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_TESTING">In Testing</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Project Cards Grid / Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-shadow hover:shadow-md p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {p.code}
                    </span>
                    <Badge label={p.priority} variant="priority" />
                  </div>
                  <Badge label={p.status} variant="status" />
                </div>

                <Link
                  to={`/projects/${p.id}`}
                  className="block mt-3 text-base font-bold text-slate-900 hover:text-sky-600 transition-colors"
                >
                  {p.name}
                </Link>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {p.description || 'No description provided.'}
                </p>

                {p.techStack && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate text-[11px] font-medium">{p.techStack}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Lead: <span className="font-semibold text-slate-700">{p.owner?.name || 'Unassigned'}</span>
                  </span>
                  <span>
                    Bugs: <span className="font-semibold text-rose-600">{p._count?.bugs ?? 0}</span>
                  </span>
                </div>

                {p.targetDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Target: {new Date(p.targetDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-2">
                  <Link
                    to={`/projects/${p.id}`}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                  >
                    View Hub
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchiveProject(p.id, p.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Archive project"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Code * (e.g. SHOP-001)
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="PROJ-01"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="E-Commerce Mobile App"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Primary objectives, target users, and deliverable scope..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="IN_TESTING">In Testing</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Lead</label>
              <select
                value={formOwnerId}
                onChange={(e) => setFormOwnerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tech Stack / Application Type
            </label>
            <input
              type="text"
              value={formTechStack}
              onChange={(e) => setFormTechStack(e.target.value)}
              placeholder="e.g. React Native, Node.js, PostgreSQL"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Completion</label>
              <input
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Project ${formCode}`}
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="IN_TESTING">In Testing</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Lead</label>
              <select
                value={formOwnerId}
                onChange={(e) => setFormOwnerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tech Stack</label>
            <input
              type="text"
              value={formTechStack}
              onChange={(e) => setFormTechStack(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Completion</label>
              <input
                type="date"
                value={formTargetDate}
                onChange={(e) => setFormTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
