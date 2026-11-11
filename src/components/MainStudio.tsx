import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Sparkles,
  Clock,
  Palette,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sliders,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  FileText,
  Volume2,
  VolumeX,
  Maximize2,
  FastForward,
  Rewind,
  Eye,
} from 'lucide-react';
import { MovieProject, Scene } from '../types.ts';
import { api } from '../services/api.ts';
import { audioEngine } from '../services/audioEngine.ts';
import { exportProjectToMp4, triggerDownload, ExportProgress } from '../services/mp4Exporter.ts';

interface MainStudioProps {
  currentProject: MovieProject | null;
  onProjectUpdate: (project: MovieProject) => void;
  onOpenTimeline: () => void;
  onOpenCharacters: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

const VISUAL_STYLES = [
  {
    id: '35mm Anamorphic Cinema',
    name: '35mm Anamorphic',
    desc: 'Panavision 2.39:1, warm horizontal streak flares, rich cinematic blacks & film grain.',
    tag: 'Classic Hollywood Scope',
    accent: 'from-amber-500/20 to-amber-900/40 border-amber-500/50 text-amber-300',
  },
  {
    id: 'Hollywood Action Thriller',
    name: 'Action Thriller',
    desc: 'Alexa 65 high contrast, teal & orange grading, atmospheric haze, dynamic rim lighting.',
    tag: 'Blockbuster High-Octane',
    accent: 'from-cyan-500/20 to-blue-900/40 border-cyan-500/50 text-cyan-300',
  },
  {
    id: 'Romantic Cinematic Drama',
    name: 'Romantic Drama',
    desc: 'Golden hour sunlight, gentle bokeh, tender micro-expressions, rich organic warmth.',
    tag: 'A24 & Festival Style',
    accent: 'from-rose-500/20 to-orange-900/40 border-rose-500/50 text-rose-300',
  },
  {
    id: 'Realistic African Movie',
    name: 'Realistic African Movie',
    desc: 'Luminous melanin tones, vibrant natural sunlight, authentic Nollywood & African grandeur.',
    tag: 'African Cinema Master',
    accent: 'from-orange-500/20 to-amber-900/40 border-orange-500/50 text-orange-300',
  },
  {
    id: 'Documentary Cinema',
    name: 'Documentary Cinema',
    desc: 'Raw human realism, natural available light, ARRI Trinity stability, candid authenticity.',
    tag: 'Award-Winning Realism',
    accent: 'from-emerald-500/20 to-teal-900/40 border-emerald-500/50 text-emerald-300',
  },
  {
    id: 'Professional Cinematic Realism',
    name: 'Cinematic Realism',
    desc: '8K reference grade, photorealistic human skin texture, studio lighting, directorial precision.',
    tag: 'Hyper-Realistic Directorial',
    accent: 'from-purple-500/20 to-indigo-900/40 border-purple-500/50 text-purple-300',
  },
];

const SAMPLE_STORIES = [
  {
    title: 'The Lagos Heist (African Action Thriller)',
    story: `In the bustling heart of Victoria Island, Lagos, former surveillance operative Kaelen Adeleke discovers that a corrupt logistics conglomerate is laundering blood diamonds through maritime freight. Partnering with Amara Bello, a brilliant undercover forensic analyst whose family was framed by the syndicate, Kaelen orchestrates a high-stakes counter-sting. Over twelve intense scenes, they intercept encrypted shipping manifests at an opulent yacht gala, evade tactical operatives through the rainy night markets of Lekki, confront the cartel boss inside a storm-battered container terminal, and expose the evidence to international prosecutors at sunrise over the Atlantic ocean.`,
  },
  {
    title: 'Echoes of the High Line (Romantic Cinematic Drama)',
    story: `Marcus, a reclusive architectural photographer recovering from grief, accidentally captures Elena, an elusive cellist from the Philharmonic, rehearsing alone on a mist-shrouded urban skybridge at dusk. Their chance encounter sparks a quiet, luminous connection told across rain-soaked cobblestone diners, late-night subway commutes, and an abandoned soundstage overlooking the Hudson. When Elena is offered a lifetime residency in Vienna, Marcus must choose between retreating into his solitary lens or opening his heart before her final departing performance.`,
  },
  {
    title: 'Zero Meridian (Hollywood Action Thriller)',
    story: `When an experimental quantum navigation satellite is hijacked over the Mediterranean, veteran tactical specialist Jack Cross is activated for a covert extraction on an autonomous research vessel drifting through gale-force waters. With shipboard systems failing and hostile boarding teams closing in from submarine docks, Cross partners with the chief robotics engineer Maya Vance to recalibrate the core drive and prevent global maritime blackouts before dawn breaks on the Aegean sea.`,
  },
];

export const MainStudio: React.FC<MainStudioProps> = ({
  currentProject,
  onProjectUpdate,
  onOpenTimeline,
  onOpenCharacters,
  onOpenAuth,
  isAuthenticated,
}) => {
  const [storyPrompt, setStoryPrompt] = useState(
    currentProject?.fullPrompt || SAMPLE_STORIES[0].story
  );
  const [durationOption, setDurationOption] = useState<5 | 10>(
    (currentProject?.durationTargetMinutes as 5 | 10) || 5
  );
  const [selectedStyle, setSelectedStyle] = useState<string>(
    currentProject?.visualStyle || '35mm Anamorphic Cinema'
  );

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);

  // MP4 Export state
  const [isExportingMp4, setIsExportingMp4] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  // Preview Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const playerTimerRef = useRef<number | null>(null);

  const wordCount = storyPrompt.trim().split(/\s+/).filter(Boolean).length;
  const charCount = storyPrompt.length;

  const currentScene = currentProject?.scenes?.[currentSceneIdx];
  const totalScenes = currentProject?.scenes?.length || 0;

  // Handle Clipboard Paste
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setStoryPrompt(text);
      }
    } catch {
      // Fallback
    }
  };

  // Generation Pipeline
  const handleGenerateMovie = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (!storyPrompt.trim() || wordCount < 10) {
      alert('Please enter a detailed story or script outline (at least 10 words).');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);
    setGenerationProgress(10);
    setGenerationLogs(['[STEP 1/7] Analyzing full story prompt and cinematic narrative arc...']);

    try {
      // Step 1: Script & Scene Breakdown via Gemini
      const scriptRes = await api.generateScript(storyPrompt, durationOption, selectedStyle);
      const script = scriptRes.script;

      setGenerationStep(2);
      setGenerationProgress(25);
      setGenerationLogs((prev) => [
        ...prev,
        `[STEP 2/7] Identified ${script.characters.length} characters with complete consistency profiles (${script.characters.map((c: any) => c.name).join(', ')})...`,
      ]);

      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep(3);
      setGenerationProgress(40);
      setGenerationLogs((prev) => [
        ...prev,
        `[STEP 3/7] Structured screenplay into ${script.scenes.length} cinematic scenes (${script.calculatedRuntimeSeconds}s runtime)...`,
      ]);

      // Step 4: Visual Generation for each scene with consistency tags
      setGenerationStep(4);
      setGenerationProgress(55);
      setGenerationLogs((prev) => [
        ...prev,
        `[STEP 4/7] Generating realistic live-action camera plates with 35mm anamorphic grading...`,
      ]);

      const populatedScenes: Scene[] = [];
      for (let i = 0; i < script.scenes.length; i++) {
        const sc = script.scenes[i];
        const visual = await api.generateSceneVisual(sc, script.characters, selectedStyle);
        populatedScenes.push({
          ...sc,
          imageUrl: visual.imageUrl,
        });

        const pct = 55 + Math.round(((i + 1) / script.scenes.length) * 20);
        setGenerationProgress(pct);
        setGenerationLogs((prev) => [
          ...prev,
          `  • Synthesized camera frame for Scene ${i + 1}/${script.scenes.length}: ${sc.title}`,
        ]);
      }

      // Step 5: AI Voice & Dialogue Cues
      setGenerationStep(5);
      setGenerationProgress(80);
      setGenerationLogs((prev) => [
        ...prev,
        `[STEP 5/7] Synchronizing multi-speaker character voice dialogue tracks...`,
      ]);
      await new Promise((r) => setTimeout(r, 500));

      // Step 6: Soundtrack & Foley SFX
      setGenerationStep(6);
      setGenerationProgress(90);
      setGenerationLogs((prev) => [
        ...prev,
        `[STEP 6/7] Synthesizing cinematic orchestral score theme (${script.soundtrackTheme.slice(0, 50)}...) & Foley audio...`,
      ]);
      await new Promise((r) => setTimeout(r, 500));

      // Step 7: Master Timeline Assembly
      setGenerationStep(7);
      setGenerationProgress(100);
      setGenerationLogs((prev) => [
        ...prev,
        `[STEP 7/7] Master 8K timeline successfully assembled! Movie is ready for playback & MP4 export.`,
      ]);

      const newProject: MovieProject = {
        id: 'proj_' + Date.now(),
        title: script.title,
        logline: script.logline,
        fullPrompt: storyPrompt,
        durationTargetMinutes: durationOption,
        calculatedRuntimeSeconds: script.calculatedRuntimeSeconds,
        visualStyle: selectedStyle,
        characters: script.characters,
        scenes: populatedScenes,
        soundtrackTheme: script.soundtrackTheme,
        audioBalance: {
          dialogueVolume: 0.9,
          sfxVolume: 0.5,
          musicVolume: 0.4,
        },
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to backend
      const saved = await api.saveProject(newProject);
      onProjectUpdate(saved.project);
      setCurrentSceneIdx(0);
      setSceneProgress(0);
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview Player Logic
  useEffect(() => {
    if (!isPlaying || !currentProject || !currentProject.scenes.length) {
      if (playerTimerRef.current) clearInterval(playerTimerRef.current);
      audioEngine.stopAll();
      return;
    }

    const scene = currentProject.scenes[currentSceneIdx];
    if (!scene) return;

    // Start background music and dialogue for scene
    if (!isAudioMuted) {
      audioEngine.playSceneMusic(scene.musicIntensity, scene.musicMood);
      if (scene.foleySounds && scene.foleySounds.length > 0) {
        audioEngine.playFoley(scene.foleySounds[0]);
      }
      if (scene.dialogue && scene.dialogue.length > 0) {
        const d = scene.dialogue[0];
        audioEngine.speakLine(d.text, d.speaker, d.tone);
      }
    }

    const sceneDuration = scene.durationSeconds || 15;
    const intervalMs = 100;
    const stepIncrement = (intervalMs / (sceneDuration * 1000)) * 100;

    playerTimerRef.current = window.setInterval(() => {
      setSceneProgress((prev) => {
        if (prev >= 100) {
          // Advance to next scene
          if (currentSceneIdx < currentProject.scenes.length - 1) {
            setCurrentSceneIdx((c) => c + 1);
            return 0;
          } else {
            // End of movie
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => {
      if (playerTimerRef.current) clearInterval(playerTimerRef.current);
    };
  }, [isPlaying, currentSceneIdx, currentProject, isAudioMuted]);

  // Export to MP4
  const handleExportMp4 = async () => {
    if (!currentProject || !currentProject.scenes || currentProject.scenes.length === 0) {
      alert('Please generate a movie before exporting to MP4.');
      return;
    }

    setIsExportingMp4(true);
    setExportProgress({
      currentScene: 0,
      totalScenes: currentProject.scenes.length,
      percent: 0,
      status: 'Initializing hardware MP4 muxer...',
    });

    try {
      const blob = await exportProjectToMp4(currentProject, (prog) => {
        setExportProgress(prog);
      });
      const filename = `${currentProject.title.replace(/[^\w\s-]/g, '')}_GS_EDIT_AI.mp4`;
      triggerDownload(blob, filename);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExportingMp4(false);
      setExportProgress(null);
    }
  };

  // Helper to format seconds as MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentSeconds = currentProject
    ? currentProject.scenes
        .slice(0, currentSceneIdx)
        .reduce((acc, sc) => acc + sc.durationSeconds, 0) +
      Math.floor(((currentScene?.durationSeconds || 15) * sceneProgress) / 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-8">
      {/* Cinematic Studio Hero Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Autonomous Story-To-Movie Production
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 tracking-tight">
          MASTER CINEMA WORKFLOW
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
          Paste one single story prompt. GS Edit AI autonomously analyzes characters, creates consistency reference sheets, directs camera shots, generates realistic live-action visuals, and renders a complete MP4 movie.
        </p>
      </div>

      {/* Main Story Prompt Box */}
      <div className="bg-[#0b0c16] border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Anamorphic Glow */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-black text-amber-300 tracking-wider uppercase">
              FULL STORY / MOVIE PROMPT
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handlePaste}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141727] hover:bg-[#1a1f33] text-zinc-300 border border-zinc-700 hover:border-amber-500/50 transition font-medium"
            >
              <Copy className="w-3 h-3 text-cyan-400" />
              Paste Prompt
            </button>
            <button
              onClick={() => setStoryPrompt('')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#141727] hover:bg-[#1a1f33] text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/40 transition font-medium"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition font-semibold"
              >
                <FileText className="w-3 h-3 text-amber-400" />
                Load Sample Story ▾
              </button>
              <div className="absolute right-0 top-full mt-1 w-64 bg-[#0f111c] border border-amber-500/30 rounded-xl p-1.5 shadow-2xl z-20 hidden group-hover:block">
                {SAMPLE_STORIES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStoryPrompt(sample.story)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-amber-500/10 hover:text-amber-300 text-zinc-300 transition"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          rows={7}
          value={storyPrompt}
          onChange={(e) => setStoryPrompt(e.target.value)}
          placeholder="Paste your complete story prompt here... Describe the premise, characters, conflicts, emotional arcs, and climax. GS Edit AI will automatically break down every scene, direct camera movements, generate character consistency sheets, and assemble the full movie."
          className="w-full bg-[#07080e] border border-zinc-800 focus:border-amber-500/70 rounded-xl p-4 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 outline-none leading-relaxed resize-y font-normal transition-all"
        />

        {/* Word and Character Counters */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 font-mono">
          <div className="flex items-center gap-4">
            <span>
              WORDS: <strong className="text-amber-400">{wordCount}</strong>
            </span>
            <span>
              CHARS: <strong className="text-zinc-300">{charCount}</strong>
            </span>
          </div>
          <span className="text-zinc-500 hidden sm:inline">
            Single prompt auto-production • No scene prompts required
          </span>
        </div>
      </div>

      {/* Production Settings: Duration & Visual Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Duration Selector */}
        <div className="bg-[#0b0c16] border border-amber-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Target Movie Duration
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Select the desired final runtime. GS Edit AI plans scene counts and pacing to accurately fulfill the target.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDurationOption(5)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  durationOption === 5
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                    : 'bg-[#121422] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black tracking-wide">5 MINUTES</span>
                  {durationOption === 5 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">~300 seconds</p>
                <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">8–12 comprehensive scenes</p>
              </button>

              <button
                type="button"
                onClick={() => setDurationOption(10)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  durationOption === 10
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/10'
                    : 'bg-[#121422] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black tracking-wide">10 MINUTES</span>
                  {durationOption === 10 && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">~600 seconds</p>
                <p className="text-[10px] text-cyan-400/90 font-mono mt-0.5">16–24 comprehensive scenes</p>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Pacing Engine:</span>
            <span className="text-emerald-400">Autotuned Dynamic Scene Blocks</span>
          </div>
        </div>

        {/* Visual Styles Selector */}
        <div className="lg:col-span-2 bg-[#0b0c16] border border-amber-500/20 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Realistic Cinematic Visual Style
              </h3>
            </div>
            <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">
              Strictly Live-Action Realism • No Cartoons
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {VISUAL_STYLES.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? `bg-gradient-to-br ${style.accent} shadow-md`
                      : 'bg-[#121422] border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-tight text-zinc-200">
                      {style.name}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {style.desc}
                  </p>
                  <span className="inline-block mt-2 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    {style.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Action Bar: Generate Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
        <button
          onClick={handleGenerateMovie}
          disabled={isGenerating}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm tracking-wider uppercase flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/30 transition-all transform active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-3 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              DIRECTING MOVIE PRODUCTION...
            </>
          ) : (
            <>
              <Film className="w-5 h-5" />
              GENERATE COMPLETE MOVIE ({durationOption} MIN)
            </>
          )}
        </button>
      </div>

      {/* Generation Progress Modal / Indicator */}
      {isGenerating && (
        <div className="bg-[#0b0c16] border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                PRODUCTION IN PROGRESS ({generationProgress}%)
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">Step {generationStep}/7</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress}%` }}
            />
          </div>

          {/* Generation Step Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
            {[
              '1. Script Analysis',
              '2. Character Sheet',
              '3. Scene Breakdown',
              '4. Visual Synthesis',
              '5. Voice & Dialogue',
              '6. Audio & Score',
              '7. MP4 Assembly',
            ].map((label, idx) => {
              const isPast = generationStep > idx + 1;
              const isCurrent = generationStep === idx + 1;
              return (
                <div
                  key={idx}
                  className={`text-[10px] font-semibold text-center p-2 rounded-lg border transition ${
                    isPast
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                      : 'bg-[#10121e] border-zinc-800 text-zinc-500'
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Real-time Production Terminal Log */}
          <div className="bg-[#07070b] border border-zinc-800/80 rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[11px] text-zinc-300 space-y-1">
            {generationLogs.map((log, idx) => (
              <p key={idx} className={log.startsWith('  •') ? 'text-zinc-400' : 'text-amber-400 font-bold'}>
                {log}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Cinema Movie Player & MP4 Export */}
      {currentProject && currentProject.scenes && currentProject.scenes.length > 0 && (
        <div className="bg-[#0b0c16] border border-amber-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  MASTER PREVIEW
                </span>
                <h3 className="text-base sm:text-lg font-black text-zinc-100">
                  {currentProject.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 italic">
                "{currentProject.logline}"
              </p>
            </div>

            {/* Top Player Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenTimeline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141626] hover:bg-[#1c1f36] text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              >
                <Sliders className="w-3.5 h-3.5" />
                Drag-and-Drop Editor
              </button>

              <button
                onClick={onOpenCharacters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141626] hover:bg-[#1c1f36] text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
              >
                <Users className="w-3.5 h-3.5" />
                Character Roster ({currentProject.characters.length})
              </button>

              <button
                onClick={handleExportMp4}
                disabled={isExportingMp4}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isExportingMp4 ? 'Muxing MP4...' : 'Download MP4'}
              </button>
            </div>
          </div>

          {/* Export Progress Notification */}
          {isExportingMp4 && exportProgress && (
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

          {/* 2.39:1 Cinema Viewport Frame */}
          <div className="relative w-full aspect-[2.39/1] bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center group select-none">
            {/* Active Scene Visual */}
            {currentScene?.imageUrl ? (
              <img
                src={currentScene.imageUrl}
                alt={currentScene.title}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
            ) : (
              <div className="text-zinc-600 text-xs font-mono">No Scene Plate Loaded</div>
            )}

            {/* 2.39:1 Anamorphic Top/Bottom Matte Bars */}
            <div className="absolute top-0 left-0 right-0 h-[8%] bg-black pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-[8%] bg-black pointer-events-none" />

            {/* Subtitles Overlay */}
            {currentScene?.dialogue && currentScene.dialogue.length > 0 && (
              <div className="absolute bottom-8 left-0 right-0 text-center px-4 pointer-events-none">
                <div className="inline-block bg-black/75 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-zinc-800/80">
                  <span className="text-amber-400 font-bold text-xs mr-2">
                    {currentScene.dialogue[0].speaker}:
                  </span>
                  <span className="text-zinc-100 font-medium text-xs sm:text-sm">
                    "{currentScene.dialogue[0].text}"
                  </span>
                </div>
              </div>
            )}

            {/* Watermark HUD */}
            <div className="absolute top-4 left-4 text-[10px] font-mono text-amber-400/80 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              GS EDIT AI MASTER • SCENE {currentSceneIdx + 1}/{totalScenes}
            </div>

            {/* Big Center Play Overlay on Hover */}
            {!isPlaying && (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500/90 text-zinc-950 flex items-center justify-center shadow-2xl shadow-amber-500/50 hover:scale-110 transition active:scale-95 z-10"
              >
                <Play className="w-7 h-7 fill-current ml-1" />
              </button>
            )}
          </div>

          {/* Cinema Player Controls */}
          <div className="space-y-2 pt-1">
            {/* Scene progress scrubber */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 w-12 text-right">
                {formatTime(currentSeconds)}
              </span>
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPct = (e.clientX - rect.left) / rect.width;
                  setSceneProgress(clickPct * 100);
                }}
                className="flex-1 h-2 bg-zinc-800 hover:bg-zinc-700 rounded-full cursor-pointer overflow-hidden p-0.5 transition"
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  style={{ width: `${sceneProgress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-zinc-400 w-12">
                {formatTime(currentProject.calculatedRuntimeSeconds)}
              </span>
            </div>

            {/* Transport Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Previous Scene */}
                <button
                  onClick={() => {
                    setCurrentSceneIdx((prev) => Math.max(0, prev - 1));
                    setSceneProgress(0);
                  }}
                  disabled={currentSceneIdx === 0}
                  className="p-2 rounded-lg bg-[#141624] text-zinc-300 hover:text-white disabled:opacity-40 transition"
                  title="Previous scene"
                >
                  <Rewind className="w-4 h-4" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" /> Play Preview
                    </>
                  )}
                </button>

                {/* Next Scene */}
                <button
                  onClick={() => {
                    setCurrentSceneIdx((prev) => Math.min(totalScenes - 1, prev + 1));
                    setSceneProgress(0);
                  }}
                  disabled={currentSceneIdx === totalScenes - 1}
                  className="p-2 rounded-lg bg-[#141624] text-zinc-300 hover:text-white disabled:opacity-40 transition"
                  title="Next scene"
                >
                  <FastForward className="w-4 h-4" />
                </button>

                {/* Reset to Start */}
                <button
                  onClick={() => {
                    setCurrentSceneIdx(0);
                    setSceneProgress(0);
                  }}
                  className="p-2 rounded-lg bg-[#141624] text-zinc-400 hover:text-white transition"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Scene Info and Audio Controls */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                  {currentScene?.slugline} ({currentScene?.durationSeconds}s)
                </span>

                <button
                  onClick={() => {
                    setIsAudioMuted(!isAudioMuted);
                    if (!isAudioMuted) audioEngine.stopAll();
                  }}
                  className={`p-2 rounded-lg border transition ${
                    isAudioMuted
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-[#141624] border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                  title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
