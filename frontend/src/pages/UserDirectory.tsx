import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  UserCheck,
  UserX,
  Search,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { User, UserRole } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

const ROLES: UserRole[] = ['ADMIN', 'HEAD', 'QA', 'DEVELOPER'];

export const UserDirectory: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('DEVELOPER');
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>('/users');
      setUsers(res);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('DEVELOPER');
    setFormPassword('');
    setFormIsActive(true);
    setFormError('');
    setIsEditMode(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormRole(u.role);
    setFormPassword('');
    setFormIsActive(u.isActive);
    setFormError('');
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (isEditMode && selectedUser) {
        const payload: any = {
          name: formName.trim(),
          role: formRole,
          isActive: formIsActive,
        };
        if (formPassword) payload.password = formPassword;
        await api.patch(`/users/${selectedUser.id}`, payload);
      } else {
        if (!formPassword || formPassword.length < 8) {
          setFormError('Password must be at least 8 characters.');
          setSubmitting(false);
          return;
        }
        await api.post('/users', {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          role: formRole,
          password: formPassword,
        });
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u: User) => {
    if (
      !window.confirm(
        `${u.isActive ? 'Deactivate' : 'Reactivate'} user "${u.name}"?`
      )
    )
      return;
    try {
      await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = ROLES.reduce<Record<string, number>>((acc, role) => {
    acc[role] = users.filter((u) => u.role === role).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">User Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage team members, roles, and access control.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ROLES.map((role) => (
          <div key={role} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{role}</div>
            <div className="text-2xl font-black text-slate-900">{roleCounts[role] || 0}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
        <Search className="w-4 h-4 absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No users found</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className={`flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors ${
                !u.isActive ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{u.name}</span>
                    {!u.isActive && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                  {u.createdAt && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge label={u.role} variant="role" />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md"
                    title="Edit user"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(u)}
                    className={`p-1.5 rounded-md ${
                      u.isActive
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={u.isActive ? 'Deactivate' : 'Reactivate'}
                  >
                    {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={isEditMode ? `Edit ${selectedUser?.name}` : 'Add New User'}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="user@company.com"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isEditMode ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder={isEditMode ? '••••••••' : 'Min. 8 characters'}
              required={!isEditMode}
              minLength={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {isEditMode && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Account Active
              </label>
            </div>
          )}

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
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
