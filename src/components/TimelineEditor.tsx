import React, { useState } from 'react';
import {
  Sliders,
  GripVertical,
  Plus,
  Trash2,
  Clock,
  Camera,
  MessageSquare,
  Music,
  Volume2,
  RefreshCw,
  Film,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
} from 'lucide-react';
import { MovieProject, Scene, SceneDialogue } from '../types.ts';
import { api } from '../services/api.ts';
import { audioEngine } from '../services/audioEngine.ts';

interface TimelineEditorProps {
  project: MovieProject | null;
  onProjectUpdate: (project: MovieProject) => void;
  onBackToStudio: () => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  project,
  onProjectUpdate,
  onBackToStudio,
}) => {
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [isRegeneratingVisual, setIsRegeneratingVisual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Audio mixer state
  const [dialogueVol, setDialogueVol] = useState(project?.audioBalance?.dialogueVolume ?? 0.9);
  const [sfxVol, setSfxVol] = useState(project?.audioBalance?.sfxVolume ?? 0.5);
  const [musicVol, setMusicVol] = useState(project?.audioBalance?.musicVolume ?? 0.4);

  if (!project || !project.scenes || project.scenes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Sliders className="w-12 h-12 text-amber-400 mx-auto opacity-50" />
        <h2 className="text-xl font-bold text-zinc-200">No Active Movie Timeline</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Please submit a story prompt in the Studio Generator to create your scenes and timeline.
        </p>
        <button
          onClick={onBackToStudio}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
        >
          Go to Studio Generator
        </button>
      </div>
    );
  }

  // Recalculate runtime when scenes are modified
  const calculateTotalSeconds = (scenes: Scene[]) => {
    return scenes.reduce((acc, s) => acc + (s.durationSeconds || 15), 0);
  };

  const handleDragStart = (index: number) => {
    setDraggedSceneIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedSceneIndex === null || draggedSceneIndex === targetIndex) return;

    const newScenes = [...project.scenes];
    const [moved] = newScenes.splice(draggedSceneIndex, 1);
    newScenes.splice(targetIndex, 0, moved);

    // Re-index scene numbers
    const reindexed = newScenes.map((s, idx) => ({
      ...s,
      sceneNumber: idx + 1,
    }));

    updateProjectScenes(reindexed);
    setDraggedSceneIndex(null);
  };

  // Move scene left/right button fallback for mobile touch
  const moveScene = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= project.scenes.length) return;
    const newScenes = [...project.scenes];
    const [moved] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, moved);

    const reindexed = newScenes.map((s, idx) => ({
      ...s,
      sceneNumber: idx + 1,
    }));
    updateProjectScenes(reindexed);
  };

  const updateProjectScenes = async (scenes: Scene[]) => {
    const totalSecs = calculateTotalSeconds(scenes);
    const updated: MovieProject = {
      ...project,
      scenes,
      calculatedRuntimeSeconds: totalSecs,
      audioBalance: {
        dialogueVolume: dialogueVol,
        sfxVolume: sfxVol,
        musicVolume: musicVol,
      },
      updatedAt: new Date().toISOString(),
    };
    onProjectUpdate(updated);

    try {
      await api.saveProject(updated);
    } catch (e) {
      console.error('Failed to auto-save project:', e);
    }
  };

  // Update Volumes
  const handleVolumeChange = (type: 'dialogue' | 'sfx' | 'music', val: number) => {
    if (type === 'dialogue') setDialogueVol(val);
    if (type === 'sfx') setSfxVol(val);
    if (type === 'music') setMusicVol(val);

    const newDia = type === 'dialogue' ? val : dialogueVol;
    const newSfx = type === 'sfx' ? val : sfxVol;
    const newMus = type === 'music' ? val : musicVol;

    audioEngine.setVolumes(newDia, newSfx, newMus);

    const updated: MovieProject = {
      ...project,
      audioBalance: {
        dialogueVolume: newDia,
        sfxVolume: newSfx,
        musicVolume: newMus,
      },
      updatedAt: new Date().toISOString(),
    };
    onProjectUpdate(updated);
  };

  // Save Scene Edits
  const handleSaveSceneEdits = async () => {
    if (!editingScene) return;

    const newScenes = project.scenes.map((s) => (s.id === editingScene.id ? editingScene : s));
    await updateProjectScenes(newScenes);
    setEditingScene(null);
  };

  // Regenerate visual still for scene
  const handleRegenerateSceneStill = async () => {
    if (!editingScene) return;
    setIsRegeneratingVisual(true);
    try {
      const res = await api.generateSceneVisual(editingScene, project.characters, project.visualStyle);
      setEditingScene({
        ...editingScene,
        imageUrl: res.imageUrl,
      });
    } catch (err: any) {
      alert(`Visual regeneration error: ${err.message}`);
    } finally {
      setIsRegeneratingVisual(false);
    }
  };

  // Delete Scene
  const handleDeleteScene = async (sceneId: string) => {
    if (project.scenes.length <= 1) {
      alert('The movie must have at least one scene.');
      return;
    }
    const newScenes = project.scenes
      .filter((s) => s.id !== sceneId)
      .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    await updateProjectScenes(newScenes);
    if (editingScene?.id === sceneId) setEditingScene(null);
  };

  // Add Scene
  const handleAddScene = async () => {
    const nextNum = project.scenes.length + 1;
    const newScene: Scene = {
      id: 'scene_' + Date.now(),
      sceneNumber: nextNum,
      title: `Director's Cut Scene ${nextNum}`,
      slugline: 'EXT. CINEMATIC OVERVIEW - DUSK',
      durationSeconds: 20,
      shotType: 'Medium Wide Shot',
      cameraMovement: 'Smooth push-in dolly',
      lighting: 'Golden hour rim lighting',
      actionSummary: 'Characters proceed through the next phase of the mission.',
      visualPrompt: `${project.visualStyle}, Scene ${nextNum}, cinematic live action, 2.39:1 anamorphic.`,
      dialogue: [{ speaker: project.characters[0]?.name || 'Lead', text: 'Let us finish this.', emotion: 'Firm', tone: 'Resolute' }],
      foleySounds: ['Atmospheric wind'],
      musicMood: 'Tense cinematic drone',
      musicIntensity: 6,
      transition: 'dissolve',
    };

    const visual = await api.generateSceneVisual(newScene, project.characters, project.visualStyle);
    newScene.imageUrl = visual.imageUrl;

    const newScenes = [...project.scenes, newScene];
    await updateProjectScenes(newScenes);
  };

  const formatRuntime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0c16] border border-amber-500/30 p-4 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 tracking-wide uppercase">
              DRAG-AND-DROP TIMELINE EDITOR
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Reorder scenes, trim clip durations, customize dialogue, and balance audio stems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121422] border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-zinc-500">TOTAL RUNTIME: </span>
            <strong className="text-amber-400">
              {formatRuntime(project.calculatedRuntimeSeconds)}
            </strong>{' '}
            <span className="text-zinc-500">({project.scenes.length} scenes)</span>
          </div>

          <button
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Scene
          </button>
        </div>
      </div>

      {/* Audio Stems Mixer Panel */}
      <div className="bg-[#0b0c16] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Cinematic Audio Stem Mixer
          </h3>
          <span className="text-[10px] text-zinc-400 font-mono">
            Dialogue priority ducking active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Dialogue Stem */}
          <div className="bg-[#121422] border border-zinc-800 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-amber-300">Dialogue Stem</span>
              <span className="font-mono text-zinc-400">{Math.round(dialogueVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={dialogueVol}
              onChange={(e) => handleVolumeChange('dialogue', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Foley SFX Stem */}
          <div className="bg-[#121422] border border-zinc-800 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-cyan-300">Foley & Ambience</span>
              <span className="font-mono text-zinc-400">{Math.round(sfxVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVol}
              onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Soundtrack Score Stem */}
          <div className="bg-[#121422] border border-zinc-800 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-purple-300">Soundtrack Score</span>
              <span className="font-mono text-zinc-400">{Math.round(musicVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVol}
              onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Film Strip Timeline (Drag and Drop Grid / Reel) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            Story Filmstrip (Drag scene to reorder)
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            Click scene to inspect and direct camera & dialogue
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {project.scenes.map((scene, idx) => (
            <div
              key={scene.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              className={`group bg-[#0b0c16] border rounded-2xl overflow-hidden shadow-xl transition-all cursor-pointer relative ${
                draggedSceneIndex === idx
                  ? 'opacity-40 border-amber-500 scale-95'
                  : 'border-zinc-800/90 hover:border-amber-500/60 hover:shadow-amber-500/10'
              }`}
            >
              {/* Scene Visual Preview */}
              <div
                onClick={() => setEditingScene({ ...scene })}
                className="relative aspect-video bg-black overflow-hidden"
              >
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={scene.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                    Frame Rendering
                  </div>
                )}

                {/* Top Overlay Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-amber-400 border border-amber-500/40">
                    SCENE {scene.sceneNumber}
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {scene.durationSeconds}s
                  </span>
                </div>

                {/* Transition Pill at Bottom Right */}
                <div className="absolute bottom-2 right-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
                    {scene.transition}
                  </span>
                </div>
              </div>

              {/* Scene Card Details */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-zinc-100 line-clamp-1 group-hover:text-amber-300 transition">
                      {scene.title}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-400 line-clamp-1">
                      {scene.slugline}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingScene({ ...scene })}
                    className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition"
                    title="Direct scene"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {scene.actionSummary}
                </p>

                {/* Dialogue preview if any */}
                {scene.dialogue && scene.dialogue.length > 0 && (
                  <div className="bg-[#121422] rounded-lg p-2 text-[10px] text-zinc-300 border border-zinc-800/80 line-clamp-1">
                    <strong className="text-amber-400">{scene.dialogue[0].speaker}:</strong> "
                    {scene.dialogue[0].text}"
                  </div>
                )}

                {/* Reorder and Delete Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveScene(idx, idx - 1);
                      }}
                      disabled={idx === 0}
                      className="p-1 rounded bg-[#151726] text-zinc-400 hover:text-white disabled:opacity-30 transition"
                      title="Move earlier"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveScene(idx, idx + 1);
                      }}
                      disabled={idx === project.scenes.length - 1}
                      className="p-1 rounded bg-[#151726] text-zinc-400 hover:text-white disabled:opacity-30 transition"
                      title="Move later"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono ml-1">
                      Drag to swap
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScene(scene.id);
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Delete scene"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scene Director / Inspector Modal */}
      {editingScene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0a0a14] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-amber-300">
                  SCENE DIRECTOR: SCENE {editingScene.sceneNumber}
                </h3>
              </div>
              <button
                onClick={() => setEditingScene(null)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            {/* Scene Image Plate & Regenerate */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 bg-black">
              {editingScene.imageUrl ? (
                <img
                  src={editingScene.imageUrl}
                  alt={editingScene.title}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <button
                onClick={handleRegenerateSceneStill}
                disabled={isRegeneratingVisual}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-amber-400 border border-amber-500/40 text-xs font-bold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingVisual ? 'animate-spin' : ''}`} />
                {isRegeneratingVisual ? 'Regenerating Plate...' : 'Regenerate Camera Plate'}
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                  Scene Title
                </label>
                <input
                  type="text"
                  value={editingScene.title}
                  onChange={(e) => setEditingScene({ ...editingScene, title: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                  Slugline (Location & Time)
                </label>
                <input
                  type="text"
                  value={editingScene.slugline}
                  onChange={(e) => setEditingScene({ ...editingScene, slugline: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 font-mono text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                  Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={editingScene.durationSeconds}
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      durationSeconds: parseInt(e.target.value) || 15,
                    })
                  }
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 font-mono text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                  Transition To Next Scene
                </label>
                <select
                  value={editingScene.transition}
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      transition: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                >
                  <option value="dissolve">Cross Dissolve (Standard)</option>
                  <option value="fade-black">Fade to Black</option>
                  <option value="whip-pan">Whip Pan (Kinetic Action)</option>
                  <option value="hard-cut">Hard Cut</option>
                  <option value="zoom-blur">Zoom Blur</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                  Framing & Shot Type
                </label>
                <input
                  type="text"
                  value={editingScene.shotType}
                  onChange={(e) => setEditingScene({ ...editingScene, shotType: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                  Camera Movement
                </label>
                <input
                  type="text"
                  value={editingScene.cameraMovement}
                  onChange={(e) =>
                    setEditingScene({ ...editingScene, cameraMovement: e.target.value })
                  }
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Action Summary */}
            <div className="text-xs">
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase mb-1">
                Action Description
              </label>
              <textarea
                rows={2}
                value={editingScene.actionSummary}
                onChange={(e) => setEditingScene({ ...editingScene, actionSummary: e.target.value })}
                className="w-full bg-[#141624] border border-zinc-700 rounded-xl p-3 text-zinc-100 outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Dialogue Lines Editor */}
            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase">
                Scene Dialogue Lines
              </label>
              {editingScene.dialogue.map((diag, dIdx) => (
                <div key={dIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#121422] p-2.5 rounded-xl border border-zinc-800">
                  <input
                    type="text"
                    placeholder="Speaker"
                    value={diag.speaker}
                    onChange={(e) => {
                      const updated = [...editingScene.dialogue];
                      updated[dIdx].speaker = e.target.value;
                      setEditingScene({ ...editingScene, dialogue: updated });
                    }}
                    className="bg-[#181a2c] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dialogue Text"
                    value={diag.text}
                    onChange={(e) => {
                      const updated = [...editingScene.dialogue];
                      updated[dIdx].text = e.target.value;
                      setEditingScene({ ...editingScene, dialogue: updated });
                    }}
                    className="sm:col-span-2 bg-[#181a2c] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-100 outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setEditingScene(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSceneEdits}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 text-xs font-bold uppercase shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
