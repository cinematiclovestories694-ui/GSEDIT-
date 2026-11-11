import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  KeyRound,
  User,
  Database,
  Cpu,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Film,
  FolderOpen,
} from 'lucide-react';
import { AuthUser, AuditLog, SystemStatus } from '../types.ts';
import { api } from '../services/api.ts';

interface OwnerDashboardProps {
  user: AuthUser | null;
  onLogout: () => void;
  onNavigate: (tab: 'studio' | 'projects') => void;
  onOpenAuth: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  user,
  onLogout,
  onNavigate,
  onOpenAuth,
}) => {
  const [name, setName] = useState(user?.name || 'Cinematic Director');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const [loadingAudit, setLoadingAudit] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoadingAudit(true);
    try {
      const [auditRes, statusRes] = await Promise.all([
        api.getAuditLog(),
        api.getSystemStatus(),
      ]);
      setAuditLogs(auditRes.auditLogs || []);
      setSystemStatus(statusRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage(null);
    try {
      await api.updateProfile(name);
      setMessage({ type: 'success', text: 'Owner director profile updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Profile update failed.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!confirm('Revoke all active sessions? You will need to log back in.')) return;
    try {
      await api.revokeAllSessions();
      onLogout();
    } catch (err: any) {
      alert(`Error revoking sessions: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-100">Private Owner Portal</h2>
        <p className="text-xs text-zinc-400">
          Please authenticate as the authorized owner (cinematiclovestories694@gmail.com) to access security settings.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase"
        >
          Sign In As Owner
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0c16] border border-amber-500/30 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 tracking-wide uppercase">
              OWNER SECURITY & ACCOUNT CONTROL
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage owner authentication credentials, system APIs, and view security audit telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('studio')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141624] hover:bg-[#1a1f33] text-amber-300 border border-amber-500/30 text-xs font-bold transition"
          >
            <Film className="w-3.5 h-3.5" />
            Generate Movie
          </button>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141624] hover:bg-[#1a1f33] text-cyan-300 border border-cyan-500/30 text-xs font-bold transition"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Saved Movies
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Account Profile & Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details & Name */}
        <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            Owner Account Profile
          </h3>

          <div className="bg-[#121422] p-3 rounded-xl border border-zinc-800 space-y-1">
            <span className="text-[10px] text-zinc-500 font-mono block">AUTHORISED OWNER EMAIL</span>
            <p className="text-xs font-mono font-bold text-amber-300 select-all">{user.email}</p>
            <p className="text-[10px] text-zinc-500 pt-1">
              Private access is strictly locked to this address in the backend authentication store.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                Director Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold uppercase transition disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Update Profile Name'}
            </button>
          </form>
        </div>

        {/* Change Master Password */}
        <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            Change Master Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                New Password (at least 6 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 text-zinc-950 text-xs font-bold uppercase transition disabled:opacity-50"
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* System Status & API Configuration */}
      <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          API Configuration & Engine Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#121422] p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">AI Studio Gemini API:</span>
            <strong className="text-emerald-400 block mt-1">Connected (Server-Side)</strong>
            <span className="text-[10px] text-zinc-500">gemini-3.8-flash</span>
          </div>

          <div className="bg-[#121422] p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">Video Muxer Engine:</span>
            <strong className="text-cyan-400 block mt-1">Hardware Canvas MP4</strong>
            <span className="text-[10px] text-zinc-500">H.264 / AAC 8K Scope</span>
          </div>

          <div className="bg-[#121422] p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">Persistent Database:</span>
            <strong className="text-amber-400 block mt-1">Local JSON Storage</strong>
            <span className="text-[10px] text-zinc-500">{systemStatus?.totalProjects || 0} movies saved</span>
          </div>

          <div className="bg-[#121422] p-3.5 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-[10px] block">Owner Auth Security:</span>
            <strong className="text-emerald-400 block mt-1">PBKDF2 Salted Hashing</strong>
            <span className="text-[10px] text-zinc-500">Session Guard Active</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80">
          <button
            onClick={handleRevokeSessions}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Revoke All Other Active Sessions
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out of GS Edit AI
          </button>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Security & Login Audit Log
          </h3>
          <button onClick={loadData} className="text-zinc-500 hover:text-white text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="bg-[#07070b] border border-zinc-800/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500 font-mono">No security audit records yet.</p>
          ) : (
            <div className="divide-y divide-zinc-800/60 text-xs font-mono">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-400'
                          : log.status === 'BLOCKED'
                          ? 'bg-red-500'
                          : 'bg-amber-400'
                      }`}
                    />
                    <strong className="text-zinc-200">{log.action}</strong>
                    <span className="text-zinc-500 hidden sm:inline">({log.email})</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
