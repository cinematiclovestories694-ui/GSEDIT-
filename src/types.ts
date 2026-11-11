export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  age: string;
  ethnicity: string;
  skinTone: string;
  faceFeatures: string;
  hair: string;
  eyeColor: string;
  bodyBuild: string;
  wardrobe: string;
  accessories: string;
  voiceStyle: string;
  colorHex?: string;
}

export interface SceneDialogue {
  speaker: string;
  text: string;
  emotion: string;
  tone: string;
}

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  slugline: string;
  durationSeconds: number;
  shotType: string;
  cameraMovement: string;
  lighting: string;
  actionSummary: string;
  visualPrompt: string;
  imageUrl?: string;
  dialogue: SceneDialogue[];
  foleySounds: string[];
  musicMood: string;
  musicIntensity: number; // 1-10
  transition: 'dissolve' | 'fade-black' | 'whip-pan' | 'hard-cut' | 'zoom-blur';
}

export interface MovieProject {
  id: string;
  title: string;
  logline: string;
  fullPrompt: string;
  durationTargetMinutes: number; // 5 or 10
  calculatedRuntimeSeconds: number;
  visualStyle: string;
  characters: CharacterProfile[];
  scenes: Scene[];
  soundtrackTheme: string;
  audioBalance: {
    dialogueVolume: number;
    sfxVolume: number;
    musicVolume: number;
  };
  status: 'draft' | 'planning' | 'generated' | 'rendering' | 'completed';
  mp4Url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  email: string;
  name: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
}

export interface AuthStatusResponse {
  authorizedEmail: string;
  isOwnerConfigured: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export interface AuditLog {
  id: string;
  email: string;
  action: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  ip?: string;
}

export interface SystemStatus {
  geminiConfigured: boolean;
  geminiModel: string;
  ownerEmail: string;
  ownerConfigured: boolean;
  totalProjects: number;
  storageStatus: string;
  androidPwaReady: boolean;
  mp4Engine: string;
  uptime: number;
}
