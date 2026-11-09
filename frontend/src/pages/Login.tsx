import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'Password123!');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 p-8 text-center text-white">
          <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Project & QA Hub</h2>
          <p className="text-sky-200/80 text-xs mt-1">Internal Collaboration & Quality Assurance Platform</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Fast Demo Accounts (Pre-configured)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@qahubbdemo.local')}
                className="p-2.5 text-left border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 rounded-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </div>
                <span className="text-[10px] text-slate-500 block truncate">admin@qahubbdemo.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('head@qahubbdemo.local')}
                className="p-2.5 text-left border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 rounded-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Head / PM</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </div>
                <span className="text-[10px] text-slate-500 block truncate">head@qahubbdemo.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('qa@qahubbdemo.local')}
                className="p-2.5 text-left border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 rounded-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">QA Lead</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </div>
                <span className="text-[10px] text-slate-500 block truncate">qa@qahubbdemo.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('dev@qahubbdemo.local')}
                className="p-2.5 text-left border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 rounded-lg transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Developer</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                </div>
                <span className="text-[10px] text-slate-500 block truncate">dev@qahubbdemo.local</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
