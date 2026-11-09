import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { Build, Project, QAStatusType, PlatformType } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const QA_STATUSES: QAStatusType[] = ['PENDING', 'IN_TESTING', 'PASSED', 'FAILED', 'RETEST_REQUIRED'];
const PLATFORMS: PlatformType[] = ['WEB', 'ANDROID', 'IOS', 'API'];

interface BuildWithProject extends Build {
  project?: { id: string; name: string; code: string };
}

export const BuildTracker: React.FC = () => {
  const { user } = useAuth();

  const [builds, setBuilds] = useState<BuildWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [projectFilter, setProjectFilter] = useState('');
  const [qaStatusFilter, setQaStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<BuildWithProject | null>(null);

  // Form
  const [formProjectId, setFormProjectId] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formPlatform, setFormPlatform] = useState<PlatformType>('WEB');
  const [formReleaseDate, setFormReleaseDate] = useState('');
  const [formBuildUrl, setFormBuildUrl] = useState('');
  const [formReleaseNotes, setFormReleaseNotes] = useState('');
  const [formQaStatus, setFormQaStatus] = useState<QAStatusType>('PENDING');
  const [formTestingNotes, setFormTestingNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get<{ data: Project[] }>('/projects?limit=100');
      setProjects(res.data);
    } catch {}
  }, []);

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch builds per project and aggregate
      const projs = await api.get<{ data: Project[] }>('/projects?limit=100');
      const projectList = projs.data;

      const allBuilds: BuildWithProject[] = [];
      await Promise.all(
        projectList
          .filter((p) => !projectFilter || p.id === projectFilter)
          .map(async (p) => {
            try {
              const pBuilds = await api.get<Build[]>(`/projects/${p.id}/builds`);
              pBuilds.forEach((b) => allBuilds.push({ ...b, project: { id: p.id, name: p.name, code: p.code } }));
            } catch {}
          })
      );

      // Sort by releaseDate desc
      allBuilds.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

      setBuilds(
        allBuilds.filter((b) => {
          if (qaStatusFilter && b.qaStatus !== qaStatusFilter) return false;
          if (platformFilter && b.platform !== platformFilter) return false;
          return true;
        })
      );
    } catch (err) {
      console.error('Failed to load builds:', err);
    } finally {
      setLoading(false);
    }
  }, [projectFilter, qaStatusFilter, platformFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const resetForm = () => {
    setFormProjectId(projects[0]?.id || '');
    setFormVersion('');
    setFormPlatform('WEB');
    setFormReleaseDate(new Date().toISOString().split('T')[0]);
    setFormBuildUrl('');
    setFormReleaseNotes('');
    setFormQaStatus('PENDING');
    setFormTestingNotes('');
    setFormError('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (build: BuildWithProject) => {
    setSelectedBuild(build);
    setFormProjectId(build.projectId);
    setFormVersion(build.version);
    setFormPlatform(build.platform);
    setFormReleaseDate(build.releaseDate.split('T')[0]);
    setFormBuildUrl(build.buildUrl);
    setFormReleaseNotes(build.releaseNotes);
    setFormQaStatus(build.qaStatus);
    setFormTestingNotes(build.testingNotes);
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
        version: formVersion.trim(),
        platform: formPlatform,
        releaseDate: formReleaseDate ? new Date(formReleaseDate).toISOString() : undefined,
        buildUrl: formBuildUrl.trim(),
        releaseNotes: formReleaseNotes.trim(),
        qaStatus: formQaStatus,
        testingNotes: formTestingNotes.trim(),
      };

      if (isEditMode && selectedBuild) {
        await api.patch(`/projects/${selectedBuild.projectId}/builds/${selectedBuild.id}`, payload);
      } else {
        await api.post(`/projects/${formProjectId}/builds`, payload);
      }
      setShowModal(false);
      resetForm();
      fetchBuilds();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save build');
    } finally {
      setSubmitting(false);
    }
  };

  const updateQaStatus = async (build: BuildWithProject, newStatus: QAStatusType) => {
    try {
      await api.patch(`/projects/${build.projectId}/builds/${build.id}`, { qaStatus: newStatus });
      fetchBuilds();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getQaStatusIcon = (status: QAStatusType) => {
    switch (status) {
      case 'PASSED': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'IN_TESTING': return <Clock className="w-4 h-4 text-sky-600" />;
      case 'RETEST_REQUIRED': return <RefreshCw className="w-4 h-4 text-amber-600" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'HEAD' || user?.role === 'QA' || user?.role === 'DEVELOPER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Build Tracker</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track all build releases and their QA validation status.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Upload Build
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter:</span>
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
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={qaStatusFilter}
          onChange={(e) => setQaStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All QA Statuses</option>
          {QA_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <span className="text-xs text-slate-500 ml-auto">{builds.length} builds</span>
      </div>

      {/* Build List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : builds.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No builds found</h3>
          <p className="text-xs text-slate-500 mt-1">Upload a build to track QA progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {builds.map((build) => (
            <div
              key={build.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-5"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-slate-100 flex-shrink-0">
                  {getQaStatusIcon(build.qaStatus)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{build.version}</span>
                    <Badge label={build.platform} variant="platform" />
                    <Badge label={build.qaStatus} variant="status" />
                    {build.project && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-50 text-sky-700 rounded border border-sky-100">
                        {build.project.code} · {build.project.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                    <span>Released: <strong>{new Date(build.releaseDate).toLocaleDateString()}</strong></span>
                    {build.uploadedBy && <span>By: <strong>{build.uploadedBy.name}</strong></span>}
                    {build._count && <span>Bugs: <strong className="text-rose-600">{build._count.bugs}</strong></span>}
                  </div>

                  {build.releaseNotes && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                      {build.releaseNotes}
                    </p>
                  )}

                  {build.testingNotes && (
                    <p className="text-xs text-sky-700 mt-1.5 italic">
                      QA Notes: {build.testingNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {build.buildUrl && (
                    <a
                      href={build.buildUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-xs text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Artifact
                    </a>
                  )}
                  {canManage && (
                    <button
                      onClick={() => openEditModal(build)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick QA Status Update */}
              {(user?.role === 'QA' || user?.role === 'ADMIN' || user?.role === 'HEAD') && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Update QA Status:
                  </span>
                  {QA_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateQaStatus(build, s)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                        build.qaStatus === s
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'text-slate-600 border-slate-200 hover:border-sky-400 hover:bg-sky-50'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={isEditMode ? 'Edit Build' : 'Upload New Build'}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version *</label>
              <input
                type="text"
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                placeholder="e.g. v2.3.1, 1.0.0-rc"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Platform *</label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value as PlatformType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Release Date</label>
              <input
                type="date"
                value={formReleaseDate}
                onChange={(e) => setFormReleaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Build / Artifact URL</label>
            <input
              type="url"
              value={formBuildUrl}
              onChange={(e) => setFormBuildUrl(e.target.value)}
              placeholder="https://drive.google.com/... or APK download link"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Release Notes</label>
            <textarea
              value={formReleaseNotes}
              onChange={(e) => setFormReleaseNotes(e.target.value)}
              placeholder="What changed in this build? Features added, bugs fixed..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">QA Status</label>
              <select
                value={formQaStatus}
                onChange={(e) => setFormQaStatus(e.target.value as QAStatusType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {QA_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">QA Testing Notes</label>
              <input
                type="text"
                value={formTestingNotes}
                onChange={(e) => setFormTestingNotes(e.target.value)}
                placeholder="Brief QA notes or blockers..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
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
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Upload Build'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
