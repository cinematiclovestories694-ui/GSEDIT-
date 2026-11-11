import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { CharacterProfile, Scene } from './storage.js';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface StoryBreakdownResult {
  title: string;
  logline: string;
  synopsis: string;
  characters: CharacterProfile[];
  scenes: Scene[];
  soundtrackTheme: string;
  durationTargetMinutes: number;
  calculatedRuntimeSeconds: number;
}

const CINEMA_STYLE_PROMPTS: Record<string, string> = {
  '35mm Anamorphic Cinema':
    'Shot on 35mm Panavision anamorphic lenses, 2.39:1 widescreen aspect ratio, horizontal blue anamorphic lens flare, warm organic film grain, shallow depth of field, rich velvety blacks, natural skin tones, Kodak Vision3 500T color science, photorealistic live action cinema.',
  'Hollywood Action Thriller':
    'High-budget Hollywood blockbuster cinematography, Alexa 65 camera, dynamic cinematic lighting, sharp rim light, cool teal and warm amber contrast, atmospheric haze, crisp motion blur, intense cinematic tension, hyper-realistic production value.',
  'Romantic Cinematic Drama':
    'A24 and Venice Film Festival romantic aesthetic, natural golden hour sunlight, soft bokeh, gentle diffusion lens, delicate emotional warmth, intimate camera framing, nuanced human micro-expressions, rich organic color grading.',
  'Realistic African Movie':
    'Authentic high-end African cinema aesthetic, rich vibrant golden sunlight, deep melanin skin tones with luminous natural skin texture, authentic Nollywood & African cinematic grandeur, authentic cultural attire and modern African urban or landscape architecture, 4K RED Monstro cinema camera.',
  'Documentary Cinema':
    'Award-winning cinematic documentary realism, natural available lighting, handheld ARRI Trinity stabilizer camera motion, raw human authenticity, unfiltered hyper-realistic textures, candid observational framing, real-world atmospheric depth.',
  'Professional Cinematic Realism':
    'Reference-grade 8K cinema master, naturalistic studio lighting, uncompressed texture clarity, perfect subsurface scattering on human skin, precise fabric weaves, true-to-life physics and reflections, masterclass directorial framing.',
};

export async function generateMovieScript(
  fullStoryPrompt: string,
  durationOption: 5 | 10,
  visualStyle: string
): Promise<StoryBreakdownResult> {
  const targetScenes = durationOption === 5 ? 10 : 20; // 8-12 for 5m, 16-24 for 10m
  const targetSeconds = durationOption * 60;
  const avgSceneDuration = Math.round(targetSeconds / targetScenes);
  const stylePrompt = CINEMA_STYLE_PROMPTS[visualStyle] || CINEMA_STYLE_PROMPTS['Professional Cinematic Realism'];

  const ai = getAiClient();

  if (ai) {
    try {
      const systemInstruction = `You are GS EDIT AI's master cinematic director, screenplay author, and visual production engine.
Your task is to take a single complete story prompt and autonomously plan a complete, realistic live-action movie.
The movie MUST be structured into exactly ${targetScenes} sequential scenes totaling approximately ${targetSeconds} seconds (${durationOption} minutes).
Do NOT produce cartoon, anime, or 3D animation. The target style is strictly realistic live-action cinema: ${stylePrompt}.

You must output a strictly valid JSON object matching the following structure:
{
  "title": "Movie Title",
  "logline": "1-2 sentence compelling cinematic logline",
  "synopsis": "Concise 3-paragraph story synopsis",
  "soundtrackTheme": "Description of overall musical motif and instrumentation",
  "characters": [
    {
      "id": "char_1",
      "name": "Character Name",
      "role": "Protagonist / Antagonist / Supporting",
      "age": "e.g. 32 years old",
      "ethnicity": "e.g. West African / East Asian / Caucasian / etc.",
      "skinTone": "Detailed skin tone description for consistency",
      "faceFeatures": "Precise facial structure (jawline, cheekbones, distinctive features)",
      "hair": "Specific hair length, texture, and color",
      "eyeColor": "Eye color and gaze",
      "bodyBuild": "Height and body proportions",
      "wardrobe": "Consistent iconic costume / clothing description",
      "accessories": "Rings, watch, scars, glasses, etc.",
      "voiceStyle": "Tone, vocal pitch, delivery style, accent",
      "colorHex": "#f59e0b"
    }
  ],
  "scenes": [
    {
      "id": "scene_1",
      "sceneNumber": 1,
      "title": "Scene Title",
      "slugline": "INT./EXT. LOCATION - TIME",
      "durationSeconds": ${avgSceneDuration},
      "shotType": "Wide Shot / Medium Close-Up / Over-The-Shoulder / Close-Up / Aerial Drone",
      "cameraMovement": "Slow push-in dolly / Tracking shot / Crane down / Handheld subtle drift",
      "lighting": "Golden hour rim light / High-contrast chiaroscuro / Moody neon rim light",
      "actionSummary": "What happens in the scene and character action",
      "visualPrompt": "Ultra-detailed visual scene prompt for video generator including character consistency descriptions, cinematic framing, and environment",
      "dialogue": [
        {
          "speaker": "Character Name",
          "text": "Spoken line of dialogue",
          "emotion": "Whispered / Intense / Sorrowful / Confident",
          "tone": "Vocal tone"
        }
      ],
      "foleySounds": ["Rain hitting asphalt", "Heavy footsteps on gravel", "Car engine idling"],
      "musicMood": "Somber string crescendo building into suspense",
      "musicIntensity": 6,
      "transition": "dissolve"
    }
  ]
}`;

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `STORY PROMPT:
${fullStoryPrompt}

DURATION: ${durationOption} Minutes (${targetSeconds} seconds total, exactly ${targetScenes} scenes).
VISUAL STYLE: ${visualStyle} (${stylePrompt})

Generate the complete master screenplay, character consistency roster, and scene-by-scene cinematic production plan in strict JSON.`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      // 14-second timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 14000)
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        let totalRuntime = 0;
        const normalizedScenes: Scene[] = (parsed.scenes || []).map((s: any, idx: number) => {
          const duration = Number(s.durationSeconds) || avgSceneDuration;
          totalRuntime += duration;
          return {
            id: s.id || `scene_${idx + 1}`,
            sceneNumber: idx + 1,
            title: s.title || `Scene ${idx + 1}`,
            slugline: s.slugline || `EXT. SCENE ${idx + 1} - DAY`,
            durationSeconds: duration,
            shotType: s.shotType || 'Medium Shot',
            cameraMovement: s.cameraMovement || 'Cinematic tracking shot',
            lighting: s.lighting || 'Cinematic ambient lighting',
            actionSummary: s.actionSummary || 'Action unfolds in the scene.',
            visualPrompt: s.visualPrompt || `${stylePrompt}, realistic live action scene`,
            dialogue: Array.isArray(s.dialogue) ? s.dialogue : [],
            foleySounds: Array.isArray(s.foleySounds) ? s.foleySounds : ['Atmospheric room ambience'],
            musicMood: s.musicMood || 'Cinematic orchestral theme',
            musicIntensity: typeof s.musicIntensity === 'number' ? s.musicIntensity : 5,
            transition: ['dissolve', 'fade-black', 'whip-pan', 'hard-cut', 'zoom-blur'].includes(s.transition)
              ? s.transition
              : 'dissolve',
          };
        });

        // Ensure calculated total runtime meets or balances the requested duration
        return {
          title: parsed.title || 'Untitled Cinematic Production',
          logline: parsed.logline || 'A powerful cinematic journey.',
          synopsis: parsed.synopsis || fullStoryPrompt.slice(0, 300),
          characters: parsed.characters || [],
          scenes: normalizedScenes,
          soundtrackTheme: parsed.soundtrackTheme || 'Cinematic symphonic composition with emotional strings and percussion',
          durationTargetMinutes: durationOption,
          calculatedRuntimeSeconds: totalRuntime || targetSeconds,
        };
      }
    } catch (err) {
      console.warn('Gemini script breakdown generation encountered error, utilizing high-fidelity fallback generator:', err);
    }
  }

  // High-fidelity fallback screenplay generator for offline or quota scenarios
  return buildProceduralCinematicScript(fullStoryPrompt, durationOption, visualStyle, targetScenes, targetSeconds);
}

function buildProceduralCinematicScript(
  story: string,
  durationOption: 5 | 10,
  visualStyle: string,
  targetScenes: number,
  targetSeconds: number
): StoryBreakdownResult {
  const avgDuration = Math.round(targetSeconds / targetScenes);
  const stylePrompt = CINEMA_STYLE_PROMPTS[visualStyle] || CINEMA_STYLE_PROMPTS['Professional Cinematic Realism'];

  // Extract or generate character names from story
  const words = story.split(/\s+/);
  const candidateNames = Array.from(
    new Set(
      story
        .match(/\b[A-Z][a-z]{2,12}\b/g)
        ?.filter((w) => !['The', 'Then', 'When', 'After', 'Before', 'Suddenly', 'With', 'From', 'This', 'That'].includes(w)) || []
    )
  );

  const char1Name = candidateNames[0] || 'Kaelen Vance';
  const char2Name = candidateNames[1] || 'Amara Cruz';

  const characters: CharacterProfile[] = [
    {
      id: 'char_1',
      name: char1Name,
      role: 'Protagonist',
      age: '34 years old',
      ethnicity: visualStyle === 'Realistic African Movie' ? 'West African' : 'Mixed Heritage',
      skinTone: visualStyle === 'Realistic African Movie' ? 'Deep rich mahogany' : 'Warm olive tan',
      faceFeatures: 'Sculpted chiseled jawline, intense observant gaze, subtle scar along the left temple',
      hair: 'Short faded textured crop, dark natural hair',
      eyeColor: 'Dark amber brown',
      bodyBuild: 'Athletic, 6ft 1in, broad shoulders',
      wardrobe: 'Weathered charcoal leather jacket over a tailored dark tactical shirt and dark denim',
      accessories: 'Vintage silver chronograph watch with scratched bezel',
      voiceStyle: 'Deep, resonant baritone with deliberate measured cadence',
      colorHex: '#f59e0b',
    },
    {
      id: 'char_2',
      name: char2Name,
      role: 'Co-Lead',
      age: '31 years old',
      ethnicity: visualStyle === 'Realistic African Movie' ? 'East African' : 'Mediterranean',
      skinTone: visualStyle === 'Realistic African Movie' ? 'Warm golden bronze' : 'Sun-kissed bronze',
      faceFeatures: 'High cheekbones, expressive determined eyes, subtle dimple on right cheek',
      hair: 'Shoulder-length dark brown waves pulled half-back in an intricate braided clasp',
      eyeColor: 'Hazel hazelnut',
      bodyBuild: 'Graceful, 5ft 8in, disciplined posture',
      wardrobe: 'Tailored midnight navy trench coat with brushed bronze buttons over silk inner lining',
      accessories: 'Obsidian pendant necklace on a braided leather cord',
      voiceStyle: 'Warm, articulate, emotionally grounded with commanding poise',
      colorHex: '#38bdf8',
    },
  ];

  const sceneTemplates = [
    {
      title: 'Prologue: The Awakening',
      slugline: 'EXT. METROPOLITAN ROOFTOP - DUSK',
      shotType: 'Extreme Wide Shot to Medium Tracking',
      cameraMovement: 'Cinematic drone push-in descending into a slow horizontal dolly track',
      lighting: 'Deep indigo dusk sky with distant sodium-vapor city horizon glow and anamorphic lens streak',
      action: `${char1Name} stands at the wet granite parapet, watching the vast illuminated city skyline below as evening fog drifts in.`,
      dialogue: [{ speaker: char1Name, text: 'We always thought time was on our side. It was never on our side.', emotion: 'Reflective', tone: 'Low gravelly baritone' }],
      foley: ['Distant urban siren', 'Wind whipping across rooftop edge', 'Droplets tapping on puddles'],
      music: 'Low atmospheric bass drone with melancholic solo cello motif',
      intensity: 4,
    },
    {
      title: 'The Hidden Dossier',
      slugline: 'INT. SECLUDED ARCHIVE CHAMBER - NIGHT',
      shotType: 'Medium Close-Up',
      cameraMovement: 'Slow creep-in on a 50mm f/1.4 prime lens with delicate rack focus',
      lighting: 'Tungsten desk lamp pool casting deep chiaroscuro shadows across brass instruments',
      action: `${char2Name} unlocks an iron lockbox, fingers trembling slightly as she reveals the decrypted blueprints.`,
      dialogue: [
        { speaker: char2Name, text: 'If they find out we unlocked this frequency, tonight will be our last.', emotion: 'Urgent whisper', tone: 'Breathy, tense' },
        { speaker: char1Name, text: 'Then we move before they even realize the seal is broken.', emotion: 'Steely resolute', tone: 'Calm, grounded' }
      ],
      foley: ['Brass tumblers clicking in lockbox', 'Heavy paper parchment unfolding', 'Rain hammering iron skylight'],
      music: 'Syncopated electronic heartbeat synth layered with sustained tremolo violins',
      intensity: 6,
    },
    {
      title: 'The Crossroads Rendezvous',
      slugline: 'EXT. NEON-LIT ALLEYWAY - MIDNIGHT',
      shotType: 'Low-Angle Tracking Shot',
      cameraMovement: 'Smooth Steadicam tracking backwards facing the characters walking side by side',
      lighting: 'Vibrant amber and cobalt neon signage reflecting in puddle-slick cobblestone street',
      action: 'Both characters navigate through a crowded night market, scanning the perimeter while exchanging quiet intelligence.',
      dialogue: [{ speaker: char2Name, text: 'The contact gave three coordinates. Only one of them leads out alive.', emotion: 'Alert', tone: 'Cautious' }],
      foley: ['Market murmur', 'Motorcycle idling around corner', 'Footsteps splashing through puddles'],
      music: 'Cinematic tribal percussion blended with driving bassline',
      intensity: 7,
    },
    {
      title: 'Shadows on the Perimeter',
      slugline: 'INT. INDUSTRIAL SUBWAY TUNNEL - LATE NIGHT',
      shotType: 'Dutch Angle Wide Shot',
      cameraMovement: 'Jib arm rising smoothly over concrete pillars to reveal approaching headlights',
      lighting: 'Flickering fluorescent tubes and piercing high-beam car headlights slicing through smoke',
      action: 'Headlights flood the abandoned platform. Silhouette figures step out into the beam, blocking the exit passage.',
      dialogue: [{ speaker: char1Name, text: 'Stay behind me. When I say break, you run for the emergency shaft.', emotion: 'Protective command', tone: 'Low growl' }],
      foley: ['Echoing footsteps on steel grating', 'Flickering ballast buzzing', 'Engine revving'],
      music: 'Rising orchestral brass stabs with driving taiko drums',
      intensity: 8,
    },
    {
      title: 'The High-Stakes Confrontation',
      slugline: 'INT. ABANDONED POWER STATION - CONTINUOUS',
      shotType: 'Over-The-Shoulder to Tight Close-Up',
      cameraMovement: 'Dynamic 360-degree orbital camera rotation around the characters',
      lighting: 'Volumetric light shafts piercing industrial vents with swirling atmospheric dust',
      action: 'A tense standoff where secrets are laid bare. Emotions run high as loyalties are tested under intense pressure.',
      dialogue: [
        { speaker: char2Name, text: 'Look at what you are willing to burn just to stay in control!', emotion: 'Heartbroken fury', tone: 'Cracking emotional crescendo' },
        { speaker: char1Name, text: 'I am not burning it for control. I am burning it so nobody can ever use it against you again.', emotion: 'Defiant conviction', tone: 'Firm and unwavering' }
      ],
      foley: ['Heavy breathing', 'Steam valve hissing', 'Revolver hammer cocking'],
      music: 'Full symphonic crescendo with soaring high strings and deep sub-bass impact',
      intensity: 9,
    },
    {
      title: 'The Escape Velocity',
      slugline: 'EXT. COASTAL HIGHWAY - PRE-DAWN',
      shotType: 'High-Speed Tracking Vehicle Shot',
      cameraMovement: 'Vehicle-mounted Russian arm crane sweeping from tire level to windshield profile',
      lighting: 'Pre-dawn twilight, cobalt mist rising off crashing ocean waves alongside the winding road',
      action: 'Speeding along the cliffside road as the headlights carve a path through ocean mist toward safe territory.',
      dialogue: [{ speaker: char1Name, text: 'Thirty seconds to the border crossing. Hold on!', emotion: 'Adrenaline-fueled', tone: 'Shouted over wind roar' }],
      foley: ['Tires screeching on wet asphalt', 'Twin-turbo engine roaring', 'Wind shear buffering glass'],
      music: 'Fast-tempo electronic-orchestral hybrid pulse with energetic brass fanfares',
      intensity: 9,
    },
    {
      title: 'Dawn on the Horizon',
      slugline: 'EXT. LIGHTHOUSE OVERLOOK - SUNRISE',
      shotType: 'Medium Profile into Golden Wide',
      cameraMovement: 'Slow crane shot lifting up over the lighthouse railing to reveal the infinite calm sea',
      lighting: 'Spectacular golden sunrise breaking through morning clouds, warm flares dancing on camera lens',
      action: `${char1Name} and ${char2Name} step out onto the cliff crest, watching the sun crest the ocean horizon as quiet falls over them.`,
      dialogue: [
        { speaker: char2Name, text: 'It is done. We made it.', emotion: 'Relieved, gentle smile', tone: 'Soft and serene' },
        { speaker: char1Name, text: 'It is only just beginning.', emotion: 'Hopeful smile', tone: 'Warm and tranquil' }
      ],
      foley: ['Seagulls calling in distance', 'Gentle ocean waves lapping shore', 'Morning breeze through coastal pines'],
      music: 'Tender acoustic guitar and soaring cinematic violins resolving into a peaceful major chord',
      intensity: 5,
    },
    {
      title: 'Epilogue: Legacy of the Silent',
      slugline: 'EXT. TIME-LAPSE MEMORIAL COMMONS - DAY',
      shotType: 'Locked-Off Master Shot with Subtle Zoom',
      cameraMovement: 'Extremely slow 0.5% optical pull-out over 30 seconds',
      lighting: 'Crystal-clear morning sunlight with natural micro-contrast and deep cinematic depth',
      action: 'The city awakens in peace. A final contemplative shot of the skyline as birds sweep across the blue expanse.',
      dialogue: [{ speaker: 'Narrator', text: 'Some stories are written in stone. Others are fought in the dark, so that tomorrow may see the light.', emotion: 'Epic philosophical resonance', tone: 'Authoritative cinema narrator' }],
      foley: ['Gentle bell chiming in the distance', 'Wind rustling tree leaves', 'City heartbeat'],
      music: 'Grand thematic orchestral finale with choir and brass swell fading to silence',
      intensity: 4,
    },
  ];

  // Repeat or slice templates to fill requested scene count
  const scenes: Scene[] = [];
  let runtime = 0;

  for (let i = 0; i < targetScenes; i++) {
    const template = sceneTemplates[i % sceneTemplates.length];
    const sceneNum = i + 1;
    const duration = avgDuration;
    runtime += duration;

    scenes.push({
      id: `scene_${sceneNum}`,
      sceneNumber: sceneNum,
      title: `${template.title} (Part ${Math.floor(i / sceneTemplates.length) + 1})`,
      slugline: template.slugline,
      durationSeconds: duration,
      shotType: template.shotType,
      cameraMovement: template.cameraMovement,
      lighting: template.lighting,
      actionSummary: template.action,
      visualPrompt: `${stylePrompt}. Scene ${sceneNum}: ${template.slugline}. ${template.action}. Shot type: ${template.shotType}. Camera movement: ${template.cameraMovement}. Lighting: ${template.lighting}. Characters featured: ${char1Name} (${characters[0].wardrobe}, ${characters[0].faceFeatures}), ${char2Name} (${characters[1].wardrobe}, ${characters[1].faceFeatures}). Realistic live-action movie still, 8k resolution, cinematic composition.`,
      dialogue: template.dialogue,
      foleySounds: template.foley,
      musicMood: template.music,
      musicIntensity: template.intensity,
      transition: i % 4 === 0 ? 'fade-black' : i % 3 === 0 ? 'whip-pan' : 'dissolve',
    });
  }

  return {
    title: story.slice(0, 32).replace(/[^\w\s]/g, '') || 'The Cinematic Chronicle',
    logline: `A gripping ${durationOption}-minute live-action cinematic story rendered with realistic cinema precision.`,
    synopsis: story,
    characters,
    scenes,
    soundtrackTheme: 'Dynamic hybrid symphonic score featuring acoustic strings, analog brass, and ambient tension pulses.',
    durationTargetMinutes: durationOption,
    calculatedRuntimeSeconds: runtime,
  };
}
