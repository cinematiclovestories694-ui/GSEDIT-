import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, ArrowRight, RefreshCw, Mail, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.ts';
import { AuthUser } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  isOwnerConfigured: boolean;
  onOwnerConfiguredChange: (configured: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isOwnerConfigured,
  onOwnerConfiguredChange,
}) => {
  const [authMode, setAuthMode] = useState<'password' | 'code' | 'init' | 'reset'>(
    isOwnerConfigured ? 'password' : 'init'
  );

  const ownerEmail = 'cinematiclovestories694@gmail.com';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [directorName, setDirectorName] = useState('Cinematic Director');
  const [otpCode, setOtpCode] = useState('');
  const [activeVerificationCode, setActiveVerificationCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Initialize Master Password on first launch
  const handleInitOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.initOwner(password, directorName);
      onOwnerConfiguredChange(true);
      setSuccessMessage('Owner credentials securely initialized!');
      setTimeout(() => {
        onSuccess({
          email: ownerEmail,
          name: directorName,
          lastLogin: new Date().toISOString(),
          twoFactorEnabled: true,
        });
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  // Sign In with Master Password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(password);
      setSuccessMessage('Owner authenticated successfully.');
      setTimeout(() => {
        onSuccess({
          email: ownerEmail,
          name: 'Cinematic Director',
          lastLogin: new Date().toISOString(),
        });
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid password.');
    } finally {
      setLoading(false);
    }
  };

  // Request 6-digit OTP code
  const handleRequestCode = async (purpose: 'login' | 'reset-password') => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.requestCode(purpose);
      if (res.verificationCode) {
        setActiveVerificationCode(res.verificationCode);
        setOtpCode(res.verificationCode); // Auto-fill for owner convenience
      }
      setSuccessMessage(`Secure 6-digit code dispatched to ${ownerEmail}.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Code to Log In
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode || otpCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyCode(otpCode, 'login');
      setSuccessMessage('Verification code confirmed! Access granted.');
      setTimeout(() => {
        onSuccess({
          email: ownerEmail,
          name: 'Cinematic Director',
          lastLogin: new Date().toISOString(),
        });
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password via OTP Code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!otpCode || otpCode.length < 6) {
      setErrorMessage('Please enter the verification code.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(otpCode, password);
      setSuccessMessage('Password successfully updated! Logging in...');
      setTimeout(() => {
        onSuccess({
          email: ownerEmail,
          name: 'Cinematic Director',
          lastLogin: new Date().toISOString(),
        });
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#0a0a12] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Top Flare */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-amber-500 to-orange-500" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 tracking-wide">
            GS EDIT AI OWNER PORTAL
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Private Administrator Access Control
          </p>
        </div>

        {/* Authorized Owner Email Banner */}
        <div className="bg-[#121422] border border-amber-500/20 rounded-xl p-3 mb-5 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-amber-300">
              AUTHORIZED OWNER ACCOUNT
            </p>
            <p className="text-xs font-mono text-zinc-300 select-all">
              {ownerEmail}
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Only this email is authorized to access GS Edit AI studio and projects.
            </p>
          </div>
        </div>

        {/* Error and Success Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE: Initial Setup */}
        {authMode === 'init' && (
          <form onSubmit={handleInitOwner} className="space-y-4">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                Owner Director Name
              </span>
              <input
                type="text"
                value={directorName}
                onChange={(e) => setDirectorName(e.target.value)}
                className="w-full bg-[#151726] border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
                required
              />
            </div>

            <div className="text-left">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                Create Master Password
              </span>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#151726] border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
                required
              />
            </div>

            <div className="text-left">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                Confirm Master Password
              </span>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#151726] border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Initialize Owner Security
            </button>
          </form>
        )}

        {/* MODE: Password Sign In */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                  Owner Password
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset');
                    handleRequestCode('reset-password');
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                placeholder="Enter master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#151726] border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Unlock GS Edit AI
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#0a0a12] px-2 text-zinc-500">Or use instant verification</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthMode('code');
                handleRequestCode('login');
              }}
              className="w-full py-2 rounded-xl bg-[#151726] hover:bg-[#1c1f33] text-zinc-300 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              Sign In via 6-Digit Verification Code
            </button>
          </form>
        )}

        {/* MODE: 6-Digit OTP Sign In */}
        {authMode === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                Enter 6-Digit Verification Code
              </span>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#151726] border border-zinc-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-zinc-100 outline-none transition"
                autoFocus
                required
              />
              {activeVerificationCode && (
                <div className="mt-2 p-2 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-center">
                  <p className="text-[10px] text-zinc-400">Current Security Dispatch Code:</p>
                  <p className="text-sm font-mono font-bold text-cyan-300 tracking-widest">
                    {activeVerificationCode}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Verify Code & Access Studio
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => handleRequestCode('login')}
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend Code
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Use Password Instead
              </button>
            </div>
          </form>
        )}

        {/* MODE: Password Reset */}
        {authMode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-left">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                6-Digit Reset Code
              </span>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit reset code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#151726] border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-center text-base font-mono tracking-widest text-zinc-100 outline-none transition"
                required
              />
              {activeVerificationCode && (
                <p className="text-[10px] text-cyan-400 text-center mt-1 font-mono">
                  Active Dispatch Code: {activeVerificationCode}
                </p>
              )}
            </div>

            <div className="text-left">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                New Master Password
              </span>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#151726] border border-zinc-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Set New Password & Enter
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className="text-xs text-zinc-400 hover:text-zinc-200 block mx-auto pt-1"
            >
              Cancel & Return to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
