import React, { useState } from 'react';
import { Film, Lock, ShieldCheck, Download, Smartphone, Sliders, Users, FolderOpen, Settings, LogOut } from 'lucide-react';
import { AuthUser } from '../types.ts';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface HeaderProps {
  user: AuthUser | null;
  activeTab: 'studio' | 'timeline' | 'characters' | 'projects' | 'android' | 'settings';
  setActiveTab: (tab: 'studio' | 'timeline' | 'characters' | 'projects' | 'android' | 'settings') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
}) => {
  const { isInstallable, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#08080d]/95 backdrop-blur-md border-b border-amber-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0a12] rounded-[10px] flex items-center justify-center relative overflow-hidden">
              <Film className="w-5 h-5 text-amber-400" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                GS EDIT AI
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
                DIRECTOR 8K
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 tracking-wide font-mono hidden sm:block">
              CINEMATIC LIVE-ACTION MOVIE GENERATOR
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0f111a] p-1 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Studio Generator
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Timeline Editor
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'characters'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Characters
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Saved Movies
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            Android APK
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Security & Settings
          </button>
        </nav>

        {/* Right Section: PWA Install & Owner Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA / Android Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white text-xs font-bold shadow-md shadow-cyan-900/40 border border-cyan-400/30 transition-all transform active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install Android App</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 hover:text-white text-xs border border-zinc-700"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Install
            </button>
          )}

          {/* Owner Account Status */}
          {user ? (
            <div className="flex items-center gap-2 bg-[#121420] border border-amber-500/30 px-2.5 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-bold text-amber-300 leading-tight flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Owner Authorized
                </p>
                <p className="text-[9px] text-zinc-400 font-mono truncate max-w-[150px]">
                  {user.email}
                </p>
              </div>
              <button
                onClick={onLogout}
                title="Sign out of owner account"
                className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              Owner Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Tab Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-zinc-800/60 bg-[#0a0a10] px-1 py-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'studio' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-zinc-400'
          }`}
        >
          <Film className="w-3 h-3" />
          Studio
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'timeline' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-zinc-400'
          }`}
        >
          <Sliders className="w-3 h-3" />
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'characters' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-zinc-400'
          }`}
        >
          <Users className="w-3 h-3" />
          Cast
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'projects' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-zinc-400'
          }`}
        >
          <FolderOpen className="w-3 h-3" />
          Saved
        </button>
        <button
          onClick={() => setActiveTab('android')}
          className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'android' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-zinc-400'
          }`}
        >
          <Smartphone className="w-3 h-3 text-cyan-400" />
          APK
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'settings' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-zinc-400'
          }`}
        >
          <Settings className="w-3 h-3" />
          Owner
        </button>
      </div>

      {/* iOS PWA Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f111a] border border-amber-500/30 p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Install GS Edit AI on iOS
            </h3>
            <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
              1. Tap the <strong className="text-amber-300">Share</strong> icon in the Safari navigation bar.<br />
              2. Scroll down and tap <strong className="text-amber-300">Add to Home Screen</strong>.<br />
              3. Launch GS Edit AI directly in full-screen cinema mode!
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2 text-xs font-bold text-zinc-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
