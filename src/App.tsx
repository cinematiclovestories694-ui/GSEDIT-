import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { MainStudio } from './components/MainStudio.tsx';
import { TimelineEditor } from './components/TimelineEditor.tsx';
import { CharacterRoster } from './components/CharacterRoster.tsx';
import { SavedProjects } from './components/SavedProjects.tsx';
import { AndroidCenter } from './components/AndroidCenter.tsx';
import { OwnerDashboard } from './components/OwnerDashboard.tsx';
import { AuthUser, MovieProject } from './types.ts';
import { api } from './services/api.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'studio' | 'timeline' | 'characters' | 'projects' | 'android' | 'settings'
  >('studio');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isOwnerConfigured, setIsOwnerConfigured] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<MovieProject | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Check auth and initial status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.getAuthStatus();
        setIsOwnerConfigured(res.isOwnerConfigured);
        if (res.isAuthenticated && res.user) {
          setUser(res.user);
          loadLatestProject();
        } else if (!res.isOwnerConfigured) {
          // If first run and owner not configured, prompt setup modal
          setIsAuthModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to check auth status:', err);
      }
    };

    checkAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthModalOpen(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('gs_auth_unauthorized', handleUnauthorized);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('gs_auth_unauthorized', handleUnauthorized);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadLatestProject = async () => {
    try {
      const res = await api.getProjects();
      if (res.projects && res.projects.length > 0) {
        setCurrentProject(res.projects[0]);
      }
    } catch (err) {
      console.error('Failed to load initial project:', err);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setActiveTab('studio');
  };

  const handleAuthSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setIsAuthModalOpen(false);
    loadLatestProject();
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Offline Alert Indicator */}
      {!isOnline && (
        <div className="bg-amber-600/90 text-zinc-950 font-bold text-xs py-1.5 px-4 text-center">
          Offline Mode — PWA service worker active with local cached project data.
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'studio' && (
          <MainStudio
            currentProject={currentProject}
            onProjectUpdate={(p) => setCurrentProject(p)}
            onOpenTimeline={() => setActiveTab('timeline')}
            onOpenCharacters={() => setActiveTab('characters')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            isAuthenticated={!!user}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineEditor
            project={currentProject}
            onProjectUpdate={(p) => setCurrentProject(p)}
            onBackToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterRoster
            project={currentProject}
            onProjectUpdate={(p) => setCurrentProject(p)}
            onBackToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'projects' && (
          <SavedProjects
            onSelectProject={(p) => {
              setCurrentProject(p);
              setActiveTab('studio');
            }}
            onNewMovie={() => {
              setCurrentProject(null);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'android' && <AndroidCenter />}

        {activeTab === 'settings' && (
          <OwnerDashboard
            user={user}
            onLogout={handleLogout}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#050508] py-6 px-4 text-center text-xs text-zinc-500 space-y-1">
        <p className="font-semibold text-zinc-400">
          GS EDIT AI • MASTER CINEMATIC PRODUCTION STUDIO
        </p>
        <p className="text-[11px] font-mono text-zinc-600">
          Owner Portal: cinematiclovestories694@gmail.com • 35mm Anamorphic 2.39:1 Engine • Android Compatible
        </p>
      </footer>

      {/* Owner Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        isOwnerConfigured={isOwnerConfigured}
        onOwnerConfiguredChange={setIsOwnerConfigured}
      />
    </div>
  );
}
