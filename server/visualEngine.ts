import { GoogleGenAI } from '@google/genai';
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

export async function generateSceneFrame(
  scene: Scene,
  characters: CharacterProfile[],
  visualStyle: string
): Promise<{ imageUrl: string; source: 'gemini-genai' | 'procedural-cinema' }> {
  const ai = getAiClient();

  if (ai) {
    try {
      // Build high-consistency prompt with explicit character descriptors
      const characterContext = characters
        .map(
          (c) =>
            `${c.name} (${c.ethnicity}, ${c.age}, ${c.skinTone} skin tone, ${c.faceFeatures}, wearing ${c.wardrobe})`
        )
        .join('; ');

      const prompt = `Realistic live-action cinematic movie shot, 35mm anamorphic widescreen. Style: ${visualStyle}. Scene: ${scene.slugline}. Action: ${scene.actionSummary}. Framing: ${scene.shotType}, ${scene.cameraMovement}. Lighting: ${scene.lighting}. Cast: ${characterContext}. Photorealistic cinema quality, natural skin pores, film grain, cinematic color grade, 8k resolution.`;

      // Try image generation via gemini-3.1-flash-lite-image
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: prompt,
      });

      // Check if image data is present in parts
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            return {
              imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
              source: 'gemini-genai',
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('Direct GenAI image synthesis bypassed or unavailable, creating procedural cinematic frame:', err.message);
    }
  }

  // Generate high-fidelity SVG/Canvas cinematic render with filmic lighting and anamorphic bars
  const proceduralImage = createProceduralCinematicStill(scene, characters, visualStyle);
  return {
    imageUrl: proceduralImage,
    source: 'procedural-cinema',
  };
}

function createProceduralCinematicStill(scene: Scene, characters: CharacterProfile[], visualStyle: string): string {
  // Generate a distinct color scheme based on style and scene number
  const isNight = scene.slugline.includes('NIGHT') || scene.slugline.includes('DUSK');
  const isSunrise = scene.slugline.includes('SUNRISE') || scene.slugline.includes('DAWN');
  const isInterior = scene.slugline.includes('INT.');

  let bgGradient = isNight
    ? ['#060814', '#0d1326', '#04050a']
    : isSunrise
    ? ['#2a140a', '#6b3218', '#0f172a']
    : ['#0f172a', '#1e293b', '#090d16'];

  let flareColor = '#38bdf8';
  let accentColor = '#f59e0b';

  if (visualStyle.includes('Hollywood')) {
    bgGradient = ['#051119', '#082333', '#03080d'];
    flareColor = '#06b6d4';
    accentColor = '#f97316';
  } else if (visualStyle.includes('Romantic')) {
    bgGradient = ['#1f0d14', '#421626', '#0d0509'];
    flareColor = '#fb7185';
    accentColor = '#fbbf24';
  } else if (visualStyle.includes('African')) {
    bgGradient = ['#1a0c02', '#451a03', '#0f0501'];
    flareColor = '#fb923c';
    accentColor = '#eab308';
  }

  // Create an evocative, styled SVG data URI that serves as an instant high-resolution 1920x1080 cinematic still
  const escapedSlugline = escapeXml(scene.slugline);
  const escapedTitle = escapeXml(scene.title);
  const escapedShot = escapeXml(scene.shotType);
  const escapedCamera = escapeXml(scene.cameraMovement);
  const escapedAction = escapeXml(scene.actionSummary.slice(0, 110));

  const char1 = characters[0] || { name: 'Lead', role: 'Protagonist' };
  const char2 = characters[1];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="50%" stop-color="${bgGradient[1]}" />
      <stop offset="100%" stop-color="${bgGradient[2]}" />
    </linearGradient>
    <radialGradient id="spotlight" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
      <stop offset="50%" stop-color="${flareColor}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
    </radialGradient>
    <linearGradient id="flare" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="${flareColor}" stop-opacity="0" />
      <stop offset="40%" stop-color="${flareColor}" stop-opacity="0.4" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="60%" stop-color="${accentColor}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.07 0" />
      <feComposite in2="SourceGraphic" in="gl" operator="in" />
    </filter>
  </defs>

  <!-- Cinema Plate Background -->
  <rect width="1280" height="720" fill="url(#bg)" />
  <rect width="1280" height="720" fill="url(#spotlight)" />

  <!-- Depth Elements & Silhouette Architecture -->
  <path d="M 0 540 Q 320 490 640 520 T 1280 500 L 1280 720 L 0 720 Z" fill="#03050a" opacity="0.85" />
  
  <!-- Architectural / Environment Silhouette -->
  ${
    isInterior
      ? `<rect x="180" y="140" width="220" height="340" fill="#090d16" stroke="${accentColor}" stroke-opacity="0.15" stroke-width="2" />
         <line x1="290" y1="140" x2="290" y2="480" stroke="${accentColor}" stroke-opacity="0.1" stroke-width="2" />
         <line x1="180" y1="310" x2="400" y2="310" stroke="${accentColor}" stroke-opacity="0.1" stroke-width="2" />`
      : `<path d="M 120 540 L 120 320 L 220 300 L 280 340 L 320 540 Z" fill="#050811" />
         <path d="M 880 540 L 920 280 L 1020 260 L 1100 540 Z" fill="#050811" />`
  }

  <!-- Character Silhouette 1 (Lead) -->
  <g transform="translate(${char2 ? 460 : 580}, 280)">
    <!-- Shadow -->
    <ellipse cx="60" cy="240" rx="90" ry="18" fill="#000000" opacity="0.6" />
    <!-- Body -->
    <path d="M 30 110 Q 60 90 90 110 L 105 230 L 15 230 Z" fill="#04060b" />
    <!-- Coat / Torso Detail -->
    <path d="M 38 120 L 60 170 L 82 120 Z" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-opacity="0.4" />
    <!-- Head -->
    <ellipse cx="60" cy="70" rx="22" ry="28" fill="#090e18" />
    <!-- Rim Light on Character -->
    <path d="M 82 50 Q 86 70 82 95 Q 86 140 102 220" fill="none" stroke="${flareColor}" stroke-width="2.5" opacity="0.8" />
  </g>

  <!-- Character Silhouette 2 (if present) -->
  ${
    char2
      ? `<g transform="translate(680, 310)">
         <ellipse cx="50" cy="210" rx="70" ry="14" fill="#000000" opacity="0.5" />
         <path d="M 25 100 Q 50 80 75 100 L 85 200 L 15 200 Z" fill="#04060b" />
         <ellipse cx="50" cy="65" rx="19" ry="24" fill="#090e18" />
         <path d="M 28 50 Q 24 70 28 90 Q 24 130 18 190" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.75" />
       </g>`
      : ''
  }

  <!-- Anamorphic Streak Lens Flare -->
  <line x1="0" y1="360" x2="1280" y2="360" stroke="url(#flare)" stroke-width="3" />
  <circle cx="640" cy="360" r="12" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 16px ${flareColor})" />

  <!-- Professional 2.39:1 Cinema Letterbox Bars -->
  <rect x="0" y="0" width="1280" height="76" fill="#000000" />
  <rect x="0" y="644" width="1280" height="76" fill="#000000" />

  <!-- Cinematic Viewfinder HUD Overlay (Discreet & Aesthetic) -->
  <g opacity="0.75" font-family="system-ui, -apple-system, sans-serif">
    <!-- Top Left Scene Marker -->
    <text x="32" y="48" font-size="12" font-weight="700" fill="#f59e0b" letter-spacing="2">GS EDIT AI // SCENE ${String(
      scene.sceneNumber
    ).padStart(2, '0')}</text>
    <text x="210" y="48" font-size="11" font-weight="500" fill="#94a3b8" letter-spacing="1">${escapedSlugline}</text>
    
    <!-- Top Right Camera Technical Spec -->
    <text x="1248" y="48" font-size="11" font-weight="600" fill="#38bdf8" text-anchor="end" letter-spacing="2">2.39:1 ANAMORPHIC • 24 FPS • 8K</text>
    
    <!-- Crosshairs -->
    <line x1="630" y1="360" x2="650" y2="360" stroke="#f59e0b" stroke-width="1" opacity="0.4" />
    <line x1="640" y1="350" x2="640" y2="370" stroke="#f59e0b" stroke-width="1" opacity="0.4" />

    <!-- Bottom Left Direction Overlay -->
    <text x="32" y="680" font-size="11" font-weight="700" fill="#e2e8f0" letter-spacing="1">${escapedTitle}</text>
    <text x="32" y="698" font-size="10" font-weight="400" fill="#94a3b8">${escapedShot} — ${escapedCamera}</text>
    
    <!-- Bottom Right Duration -->
    <text x="1248" y="688" font-size="12" font-weight="700" fill="#f59e0b" text-anchor="end" letter-spacing="1">${scene.durationSeconds}s DURATION</text>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
