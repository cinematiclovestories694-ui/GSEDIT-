import React, { useState } from 'react';
import { Users, Plus, Check, Edit3, Trash2, ShieldCheck, Sparkles, User, Palette, Mic } from 'lucide-react';
import { MovieProject, CharacterProfile } from '../types.ts';
import { api } from '../services/api.ts';

interface CharacterRosterProps {
  project: MovieProject | null;
  onProjectUpdate: (project: MovieProject) => void;
  onBackToStudio: () => void;
}

export const CharacterRoster: React.FC<CharacterRosterProps> = ({
  project,
  onProjectUpdate,
  onBackToStudio,
}) => {
  const [editingChar, setEditingChar] = useState<CharacterProfile | null>(null);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Users className="w-12 h-12 text-amber-400 mx-auto opacity-50" />
        <h2 className="text-xl font-bold text-zinc-200">No Cast Generated</h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Please generate a movie first in the Studio Generator to extract character profiles.
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

  const handleSaveCharacter = async () => {
    if (!editingChar) return;

    const existingIdx = project.characters.findIndex((c) => c.id === editingChar.id);
    let updatedChars = [...project.characters];

    if (existingIdx >= 0) {
      updatedChars[existingIdx] = editingChar;
    } else {
      updatedChars.push(editingChar);
    }

    const updatedProject: MovieProject = {
      ...project,
      characters: updatedChars,
      updatedAt: new Date().toISOString(),
    };

    onProjectUpdate(updatedProject);
    setEditingChar(null);

    try {
      await api.saveProject(updatedProject);
    } catch (e) {
      console.error('Failed to save project:', e);
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    const updatedChars = project.characters.filter((c) => c.id !== charId);
    const updatedProject: MovieProject = {
      ...project,
      characters: updatedChars,
      updatedAt: new Date().toISOString(),
    };
    onProjectUpdate(updatedProject);
    if (editingChar?.id === charId) setEditingChar(null);
    try {
      await api.saveProject(updatedProject);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNewCharacter = () => {
    const newChar: CharacterProfile = {
      id: 'char_' + Date.now(),
      name: 'New Cast Member',
      role: 'Supporting Lead',
      age: '30 years old',
      ethnicity: 'Mixed Heritage',
      skinTone: 'Warm olive tan',
      faceFeatures: 'Distinct cheekbones, expressive eyes',
      hair: 'Dark textured hair',
      eyeColor: 'Hazel',
      bodyBuild: 'Athletic, 5ft 10in',
      wardrobe: 'Tailored dark minimalist jacket and trousers',
      accessories: 'Silver wristwatch',
      voiceStyle: 'Deep, clear resonance with steady cadence',
      colorHex: '#38bdf8',
    };
    setEditingChar(newChar);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0c16] border border-amber-500/30 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 tracking-wide uppercase">
              CHARACTER CONSISTENCY ENGINE
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Strict biometric, wardrobe, and vocal anchoring. These reference profiles are conditioned into every camera shot to ensure characters do not drift in appearance or voice across scenes.
          </p>
        </div>

        <button
          onClick={handleAddNewCharacter}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Character
        </button>
      </div>

      {/* Character Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {project.characters.map((char) => (
          <div
            key={char.id}
            className="bg-[#0b0c16] border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-xl transition-all space-y-4 relative overflow-hidden"
          >
            {/* Top Accent Stripe */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: char.colorHex || '#f59e0b' }}
            />

            {/* Profile Avatar & Title */}
            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base text-zinc-950 border border-white/20 shadow-md"
                  style={{ backgroundColor: char.colorHex || '#f59e0b' }}
                >
                  {char.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-100">{char.name}</h3>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase mt-0.5">
                    {char.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingChar({ ...char })}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition"
                  title="Edit character profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteCharacter(char.id)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Remove character"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Biometric Reference Attributes */}
            <div className="space-y-2 text-xs bg-[#121422] p-3 rounded-xl border border-zinc-800/80">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Age:</span>
                  <strong className="text-zinc-200">{char.age}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Ethnicity:</span>
                  <strong className="text-zinc-200">{char.ethnicity}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Skin Tone:</span>
                  <strong className="text-amber-300">{char.skinTone}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Eyes:</span>
                  <strong className="text-zinc-200">{char.eyeColor}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px]">Facial Structure:</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">{char.faceFeatures}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px]">Hairstyle & Color:</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">{char.hair}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px]">Signature Wardrobe:</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">{char.wardrobe}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] flex items-center gap-1">
                  <Mic className="w-3 h-3 text-cyan-400" />
                  Voice Characterization:
                </span>
                <p className="text-[11px] text-cyan-300 mt-0.5">{char.voiceStyle}</p>
              </div>
            </div>

            {/* Prompt Injection Tag */}
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>Conditioned into {project.scenes.length} scene prompts</span>
            </div>
          </div>
        ))}
      </div>

      {/* Character Edit / Create Modal */}
      {editingChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0a0a14] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                Character Consistency Sheet
              </h3>
              <button
                onClick={() => setEditingChar(null)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingChar.name}
                  onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={editingChar.role}
                  onChange={(e) => setEditingChar({ ...editingChar, role: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={editingChar.age}
                  onChange={(e) => setEditingChar({ ...editingChar, age: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Ethnicity
                </label>
                <input
                  type="text"
                  value={editingChar.ethnicity}
                  onChange={(e) => setEditingChar({ ...editingChar, ethnicity: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Skin Tone
                </label>
                <input
                  type="text"
                  value={editingChar.skinTone}
                  onChange={(e) => setEditingChar({ ...editingChar, skinTone: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Eye Color
                </label>
                <input
                  type="text"
                  value={editingChar.eyeColor}
                  onChange={(e) => setEditingChar({ ...editingChar, eyeColor: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Facial Features & Structure
                </label>
                <input
                  type="text"
                  value={editingChar.faceFeatures}
                  onChange={(e) => setEditingChar({ ...editingChar, faceFeatures: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Hairstyle, Cut & Color
                </label>
                <input
                  type="text"
                  value={editingChar.hair}
                  onChange={(e) => setEditingChar({ ...editingChar, hair: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Signature Wardrobe / Clothing
                </label>
                <input
                  type="text"
                  value={editingChar.wardrobe}
                  onChange={(e) => setEditingChar({ ...editingChar, wardrobe: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Voice Timbre & Speaking Style
                </label>
                <input
                  type="text"
                  value={editingChar.voiceStyle}
                  onChange={(e) => setEditingChar({ ...editingChar, voiceStyle: e.target.value })}
                  className="w-full bg-[#141624] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setEditingChar(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCharacter}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-xs font-bold uppercase shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                Save Character
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
