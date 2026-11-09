import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderKanban,
  FileText,
  Boxes,
  Bug as BugIcon,
  Users,
  ExternalLink,
  Plus,
  ArrowLeft,
  Calendar,
  Layers,
  Clock,
  Trash2,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { api } from '../api/client';
import {
  Project,
  Resource,
  Build,
  Bug as BugType,
  User as UserType,
  ResourceCategory,
  PlatformType,
  QAStatusType,
  BugSeverity,
  BugStatus,
  PriorityLevel,
} from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const RESOURCE_CATEGORIES: ResourceCategory[] = [
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

const PLATFORMS: PlatformType[] = ['WEB', 'ANDROID', 'IOS', 'API'];
const QA_STATUSES: QAStatusType[] = ['PENDING', 'IN_TESTING', 'PASSED', 'FAILED', 'RETEST_REQUIRED'];

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [bugs, setBugs] = useState<BugType[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'builds' | 'bugs'>('overview');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);

  // Form states
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState('DEVELOPER');
  const [memberError, setMemberError] = useState('');

  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceCategory, setResourceCategory] = useState<ResourceCategory>('URL');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceDesc, setResourceDesc] = useState('');
  const [resourceError, setResourceError] = useState('');

  const [buildVersion, setBuildVersion] = useState('');
  const [buildPlatform, setBuildPlatform] = useState<PlatformType>('WEB');
  const [buildUrl, setBuildUrl] = useState('');
  const [buildReleaseNotes, setBuildReleaseNotes] = useState('');
  const [buildQaStatus, setBuildQaStatus] = useState<QAStatusType>('PENDING');
  const [buildError, setBuildError] = useState('');

  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');
  const [bugModule, setBugModule] = useState('');
  const [bugSteps, setBugSteps] = useState('');
  const [bugExpected, setBugExpected] = useState('');
  const [bugActual, setBugActual] = useState('');
  const [bugSeverity, setBugSeverity] = useState<BugSeverity>('MEDIUM');
  const [bugPriority, setBugPriority] = useState<PriorityLevel>('MEDIUM');
  const [bugAssigneeId, setBugAssigneeId] = useState('');
  const [bugError, setBugError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projData, resData, buildData, bugData] = await Promise.all([
        api.get<Project>(`/projects/${id}`),
        api.get<Resource[]>(`/projects/${id}/resources`).catch(() => []),
        api.get<Build[]>(`/projects/${id}/builds`).catch(() => []),
        api.get<{ data: BugType[] }>(`/bugs?projectId=${id}`).catch(() => ({ data: [] })),
      ]);
      setProject(projData);
      setResources(resData);
      setBuilds(buildData);
      setBugs(bugData.data || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
    api.get<UserType[]>('/users').then(setAllUsers).catch(() => {});
  }, [fetchProjectData]);

  // Handlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !memberUserId) return;
    setMemberError('');
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, { userId: memberUserId, role: memberRole });
      setShowMemberModal(false);
      setMemberUserId('');
      fetchProjectData();
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id || !window.confirm('Remove this team member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      fetchProjectData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setResourceError('');
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/resources`, {
        title: resourceTitle.trim(),
        category: resourceCategory,
        url: resourceUrl.trim(),
        description: resourceDesc.trim(),
      });
      setShowResourceModal(false);
      setResourceTitle('');
      setResourceUrl('');
      setResourceDesc('');
      fetchProjectData();
    } catch (err: any) {
      setResourceError(err.message || 'Failed to add resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setBuildError('');
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/builds`, {
        version: buildVersion.trim(),
        platform: buildPlatform,
        buildUrl: buildUrl.trim(),
        releaseNotes: buildReleaseNotes.trim(),
        qaStatus: buildQaStatus,
      });
      setShowBuildModal(false);
      setBuildVersion('');
      setBuildUrl('');
      setBuildReleaseNotes('');
      fetchProjectData();
    } catch (err: any) {
      setBuildError(err.message || 'Failed to upload build');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setBugError('');
    setSubmitting(true);
    try {
      await api.post('/bugs', {
        projectId: id,
        title: bugTitle.trim(),
        description: bugDesc.trim(),
        module: bugModule.trim(),
        stepsToRepro: bugSteps.trim(),
        expected: bugExpected.trim(),
        actual: bugActual.trim(),
        severity: bugSeverity,
        priority: bugPriority,
        assigneeId: bugAssigneeId || null,
      });
      setShowBugModal(false);
      setBugTitle('');
      setBugDesc('');
      setBugModule('');
      setBugSteps('');
      setBugExpected('');
      setBugActual('');
      fetchProjectData();
    } catch (err: any) {
      setBugError(err.message || 'Failed to report bug');
    } finally {
      setSubmitting(false);
    }
  };

  const canManageMembers =
    user?.role === 'ADMIN' || user?.role === 'HEAD' || (project && project.ownerId === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <h3 className="text-sm font-bold text-slate-800">Project not found</h3>
        <Link to="/projects" className="text-xs text-sky-600 mt-2 inline-block">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects Directory
        </Link>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {project.code}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h2>
              <Badge label={project.status} variant="status" />
              <Badge label={project.priority} variant="priority" />
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{project.description}</p>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              onClick={() => setShowResourceModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Resource
            </button>
            <button
              onClick={() => setShowBuildModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Build
            </button>
            <button
              onClick={() => setShowBugModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5"
            >
              <BugIcon className="w-3.5 h-3.5" />
              Report Bug
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'resources'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Resources ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('builds')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'builds'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Builds ({builds.length})
        </button>
        <button
          onClick={() => setActiveTab('bugs')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'bugs'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BugIcon className="w-4 h-4" />
          Bugs ({bugs.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Project Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Technology Stack</span>
                  <span className="text-slate-800 font-semibold mt-0.5 block">
                    {project.techStack || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Project Lead / Owner</span>
                  <span className="text-slate-800 font-semibold mt-0.5 block">
                    {project.owner?.name || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Start Date</span>
                  <span className="text-slate-800 font-semibold mt-0.5 block">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Target Completion</span>
                  <span className="text-slate-800 font-semibold mt-0.5 block">
                    {project.targetDate
                      ? new Date(project.targetDate).toLocaleDateString()
                      : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Team Members */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Assigned Team Members
                </h3>
                {canManageMembers && (
                  <button
                    onClick={() => { setMemberError(''); setShowMemberModal(true); }}
                    className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Member
                  </button>
                )}
              </div>

              {project.members && project.members.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {project.members.map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-800">{m.user.name}</span>
                        <span className="text-[10px] text-slate-400 block">{m.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge label={m.role} variant="role" />
                        {canManageMembers && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove from project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No additional team members assigned.</p>
              )}
            </div>
          </div>

          {/* Quick Metrics Column */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Builds
              </h3>
              <p className="text-2xl font-black text-slate-900 mt-2">{builds.length}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Defects Logged
              </h3>
              <p className="text-2xl font-black text-rose-600 mt-2">{bugs.length}</p>
              <div className="text-[11px] text-slate-500 mt-1">
                {bugs.filter((b) => b.status !== 'CLOSED').length} open defects
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Resources & Links
              </h3>
              <p className="text-2xl font-black text-sky-600 mt-2">{resources.length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Project Resources & Links</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResourceModal(true)}
                className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Resource
              </button>
              <Link to="/resources" className="text-xs text-sky-600 hover:text-sky-800 font-semibold">
                Resource Center →
              </Link>
            </div>
          </div>
          {resources.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No resources linked yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 border border-slate-200 rounded-lg hover:border-sky-400 hover:bg-sky-50/30 transition-all flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{r.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {r.category}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{r.description}</p>
                    )}
                    <span className="text-[10px] text-sky-600 font-mono mt-1 block truncate max-w-sm">
                      {r.url}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 mt-1 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'builds' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Build History</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBuildModal(true)}
                className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Upload Build
              </button>
              <Link to="/builds" className="text-xs text-sky-600 hover:text-sky-800 font-semibold">
                Build Tracker →
              </Link>
            </div>
          </div>
          {builds.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No builds recorded.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {builds.map((b) => (
                <div key={b.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{b.version}</span>
                      <Badge label={b.platform} variant="platform" />
                      <Badge label={b.qaStatus} variant="status" />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{b.releaseNotes || 'No notes'}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Released: {new Date(b.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                  {b.buildUrl && (
                    <a
                      href={b.buildUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      Artifact Link
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bugs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Defects & QA Bugs</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBugModal(true)}
                className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <BugIcon className="w-3.5 h-3.5" />
                Report Bug
              </button>
              <Link to="/bugs" className="text-xs text-sky-600 hover:text-sky-800 font-semibold">
                Bug Tracker →
              </Link>
            </div>
          </div>
          {bugs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No bugs logged for this project.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {bugs.map((bg) => (
                <div key={bg.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{bg.bugId}</span>
                      <span className="text-xs font-semibold text-slate-800">{bg.title}</span>
                      <Badge label={bg.severity} variant="severity" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>Module: {bg.module || 'General'}</span>
                      <span>•</span>
                      <span>Assignee: {bg.assignee?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                  <Badge label={bg.status} variant="status" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          {memberError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {memberError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">User *</label>
            <select
              value={memberUserId}
              onChange={(e) => setMemberUserId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="">Select a user...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — {u.role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Role *</label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="DEVELOPER">DEVELOPER</option>
              <option value="QA">QA</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowMemberModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Resource Modal */}
      <Modal isOpen={showResourceModal} onClose={() => setShowResourceModal(false)} title="Add Resource">
        <form onSubmit={handleAddResource} className="space-y-4">
          {resourceError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {resourceError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Resource title"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={resourceCategory}
                onChange={(e) => setResourceCategory(e.target.value as ResourceCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL *</label>
            <input
              type="url"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={resourceDesc}
              onChange={(e) => setResourceDesc(e.target.value)}
              placeholder="Notes on this resource..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowResourceModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Build Modal */}
      <Modal isOpen={showBuildModal} onClose={() => setShowBuildModal(false)} title="Upload Build">
        <form onSubmit={handleUploadBuild} className="space-y-4">
          {buildError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {buildError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Version *</label>
              <input
                type="text"
                value={buildVersion}
                onChange={(e) => setBuildVersion(e.target.value)}
                placeholder="v1.0.0"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Platform *</label>
              <select
                value={buildPlatform}
                onChange={(e) => setBuildPlatform(e.target.value as PlatformType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">QA Status</label>
              <select
                value={buildQaStatus}
                onChange={(e) => setBuildQaStatus(e.target.value as QAStatusType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {QA_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Build / Artifact URL</label>
            <input
              type="url"
              value={buildUrl}
              onChange={(e) => setBuildUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Release Notes</label>
            <textarea
              value={buildReleaseNotes}
              onChange={(e) => setBuildReleaseNotes(e.target.value)}
              placeholder="What's included in this build..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowBuildModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Upload Build'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Report Bug Modal */}
      <Modal isOpen={showBugModal} onClose={() => setShowBugModal(false)} title="Report Bug">
        <form onSubmit={handleReportBug} className="space-y-4">
          {bugError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {bugError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
                placeholder="Bug title"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Module</label>
              <input
                type="text"
                value={bugModule}
                onChange={(e) => setBugModule(e.target.value)}
                placeholder="e.g. Authentication, Billing"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={bugDesc}
              onChange={(e) => setBugDesc(e.target.value)}
              placeholder="Description of the issue..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Steps to Reproduce</label>
            <textarea
              value={bugSteps}
              onChange={(e) => setBugSteps(e.target.value)}
              placeholder="1. Step one..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected</label>
              <input
                type="text"
                value={bugExpected}
                onChange={(e) => setBugExpected(e.target.value)}
                placeholder="What should happen"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual</label>
              <input
                type="text"
                value={bugActual}
                onChange={(e) => setBugActual(e.target.value)}
                placeholder="What happened"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={bugSeverity}
                onChange={(e) => setBugSeverity(e.target.value as BugSeverity)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as BugSeverity[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={bugPriority}
                onChange={(e) => setBugPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as PriorityLevel[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
              <select
                value={bugAssigneeId}
                onChange={(e) => setBugAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Unassigned</option>
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowBugModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Reporting...' : 'Report Bug'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
