import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  ExternalLink,
  Trash2,
  Edit2,
  Search,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { api } from '../api/client';
import { Resource, ResourceCategory, Project } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const CATEGORIES: ResourceCategory[] = [
  'URL',
  'GOOGLE_SHEET',
  'GOOGLE_DOC',
  'GITHUB',
  'API_DOC',
  'APK',
  'REQUIREMENT',
  'TEST_PLAN',
  'BUG_DOC',
  'OTHER',
];

interface ResourceWithProject extends Resource {
  project?: { id: string; name: string; code: string };
}

export const ResourceCenter: React.FC = () => {
  const { user } = useAuth();

  const [resources, setResources] = useState<ResourceWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceWithProject | null>(null);

  // Form
  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ResourceCategory>('URL');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const projRes = await api.get<{ data: Project[] }>('/projects?limit=100');
      const projectList = projRes.data;
      setProjects(projectList);

      const allResources: ResourceWithProject[] = [];
      await Promise.all(
        projectList
          .filter((p) => !projectFilter || p.id === projectFilter)
          .map(async (p) => {
            try {
              const res = await api.get<Resource[]>(`/projects/${p.id}/resources`);
              res.forEach((r) =>
                allResources.push({ ...r, project: { id: p.id, name: p.name, code: p.code } })
              );
            } catch {}
          })
      );

      // Sort by createdAt desc
      allResources.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setResources(
        allResources.filter((r) => {
          if (categoryFilter && r.category !== categoryFilter) return false;
          if (
            search &&
            !r.title.toLowerCase().includes(search.toLowerCase()) &&
            !r.description?.toLowerCase().includes(search.toLowerCase()) &&
            !r.url?.toLowerCase().includes(search.toLowerCase())
          )
            return false;
          return true;
        })
      );
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  }, [projectFilter, categoryFilter, search]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const resetForm = () => {
    setFormProjectId(projects[0]?.id || '');
    setFormTitle('');
    setFormCategory('URL');
    setFormUrl('');
    setFormDescription('');
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (resource: ResourceWithProject) => {
    setSelectedResource(resource);
    setFormProjectId(resource.project?.id || resource.projectId);
    setFormTitle(resource.title);
    setFormCategory(resource.category);
    setFormUrl(resource.url);
    setFormDescription(resource.description);
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
        title: formTitle.trim(),
        category: formCategory,
        url: formUrl.trim(),
        description: formDescription.trim(),
      };

      if (isEditMode && selectedResource) {
        await api.patch(
          `/projects/${selectedResource.project?.id || selectedResource.projectId}/resources/${selectedResource.id}`,
          payload
        );
      } else {
        await api.post(`/projects/${formProjectId}/resources`, payload);
      }
      setShowModal(false);
      resetForm();
      fetchAll();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resource: ResourceWithProject) => {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;
    try {
      await api.delete(
        `/projects/${resource.project?.id || resource.projectId}/resources/${resource.id}`
      );
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource');
    }
  };

  const getCategoryColor = (cat: ResourceCategory) => {
    const map: Record<string, string> = {
      GOOGLE_SHEET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      GOOGLE_DOC: 'bg-blue-50 text-blue-700 border-blue-200',
      GITHUB: 'bg-slate-100 text-slate-700 border-slate-200',
      API_DOC: 'bg-violet-50 text-violet-700 border-violet-200',
      APK: 'bg-orange-50 text-orange-700 border-orange-200',
      REQUIREMENT: 'bg-sky-50 text-sky-700 border-sky-200',
      TEST_PLAN: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      BUG_DOC: 'bg-rose-50 text-rose-700 border-rose-200',
      URL: 'bg-slate-50 text-slate-600 border-slate-200',
      OTHER: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return map[cat] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const canManage = user?.role !== undefined; // All logged-in users can add resources

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resource Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized hub for all project documents, links, and assets.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, description, or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No resources found</h3>
          <p className="text-xs text-slate-500 mt-1">Add project links, docs, and assets here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-4 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border mb-2 ${getCategoryColor(r.category)}`}
                  >
                    {r.category.replace('_', ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{r.title}</h4>
                  {r.project && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {r.project.code} · {r.project.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {r.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">{r.description}</p>
              )}

              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:border-sky-400 hover:bg-sky-50 transition-all group text-xs text-slate-600 font-medium"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 flex-shrink-0" />
                <span className="truncate text-sky-700 font-mono text-[10px]">{r.url}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-sky-600 ml-auto flex-shrink-0" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={isEditMode ? 'Edit Resource' : 'Add New Resource'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {formError}
            </div>
          )}

          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project *</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. API Documentation, Test Cases"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ResourceCategory)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL *</label>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://docs.google.com/... or https://github.com/..."
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of what this resource contains..."
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
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
