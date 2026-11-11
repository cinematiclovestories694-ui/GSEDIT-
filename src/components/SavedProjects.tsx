import React, { useState, useEffect } from 'react';
import { FolderOpen, Film, Clock, Download, Trash2, Play, Plus, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { MovieProject } from '../types.ts';
import { api } from '../services/api.ts';
import { exportProjectToMp4, triggerDownload, ExportProgress } from '../services/mp4Exporter.ts';

interface SavedProjectsProps {
  onSelectProject: (project: MovieProject) => void;
  onNewMovie: () => void;
}

export const SavedProjects: React.FC<SavedProjectsProps> = ({
  onSelectProject,
  onNewMovie,
}) => {
  const [projects, setProjects] = useState<MovieProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.getProjects();
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved movie project?')) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleExport = async (proj: MovieProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportingId(proj.id);
    setExportProgress({
      currentScene: 0,
      totalScenes: proj.scenes.length,
      percent: 0,
      status: 'Preparing movie assembly...',
    });

    try {
      const blob = await exportProjectToMp4(proj, (prog) => {
        setExportProgress(prog);
      });
      const filename = `${proj.title.replace(/[^\w\s-]/g, '')}_GS_EDIT_AI.mp4`;
      triggerDownload(blob, filename);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportingId(null);
      setExportProgress(null);
    }
  };

  const formatRuntime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0c16] border border-amber-500/30 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 tracking-wide uppercase">
              SAVED MOVIES & PRODUCTION HISTORY
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Access, direct, and re-download previously generated cinematic movies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            className="p-2 rounded-xl bg-[#141624] text-zinc-400 hover:text-white border border-zinc-800 transition"
            title="Refresh projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onNewMovie}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Generate New Movie
          </button>
        </div>
      </div>

      {/* Export progress banner if active */}
      {exportingId && exportProgress && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-2">
              <Film className="w-4 h-4 animate-spin text-amber-400" />
              {exportProgress.status}
            </span>
            <span className="font-mono text-zinc-300">{exportProgress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all duration-200"
              style={{ width: `${exportProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Loading saved cinematic movies...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
          <Film className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-zinc-300">No Saved Movies Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You haven't generated any movies yet. Paste a story prompt in the Studio Generator to direct your first film.
          </p>
          <button
            onClick={onNewMovie}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold"
          >
            Generate First Movie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const firstScene = proj.scenes?.[0];
            const isCurrentlyExporting = exportingId === proj.id;

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className="group bg-[#0b0c16] border border-zinc-800 hover:border-amber-500/60 rounded-2xl overflow-hidden shadow-xl transition-all cursor-pointer relative flex flex-col justify-between"
              >
                {/* Poster Still */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  {firstScene?.imageUrl ? (
                    <img
                      src={firstScene.imageUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                      No Poster Image
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-amber-400 border border-amber-500/40">
                      {proj.durationTargetMinutes} MIN TARGET
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRuntime(proj.calculatedRuntimeSeconds)}
                    </span>
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-zinc-100 group-hover:text-amber-300 transition line-clamp-1">
                      {proj.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {proj.logline || proj.fullPrompt}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{proj.visualStyle}</span>
                      <span>{proj.scenes.length} Scenes</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={(e) => handleExport(proj, e)}
                        disabled={isCurrentlyExporting}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141626] hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        {isCurrentlyExporting ? 'Exporting...' : 'Download MP4'}
                      </button>

                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
