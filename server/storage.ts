import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface OwnerAccount {
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
}

export interface AuthSession {
  token: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ip?: string;
}

export interface VerificationCode {
  code: string;
  email: string;
  purpose: 'login' | 'reset-password';
  expiresAt: number;
}

export interface AuditLog {
  id: string;
  email: string;
  action: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  ip?: string;
}

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

interface DatabaseSchema {
  owner: OwnerAccount | null;
  sessions: AuthSession[];
  verificationCodes: VerificationCode[];
  auditLogs: AuditLog[];
  projects: MovieProject[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'gs_edit_db.json');

export const AUTHORIZED_OWNER_EMAIL = 'cinematiclovestories694@gmail.com';

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

class StorageEngine {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, resetting to defaults:', err);
        this.data = this.getDefaults();
        this.save();
      }
    } else {
      this.data = this.getDefaults();
      this.save();
    }
  }

  private getDefaults(): DatabaseSchema {
    return {
      owner: null, // Uninitialized until first setup by owner
      sessions: [],
      verificationCodes: [],
      auditLogs: [],
      projects: [],
    };
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  public getOwner(): OwnerAccount | null {
    return this.data.owner;
  }

  public isOwnerConfigured(): boolean {
    return !!(this.data.owner && this.data.owner.passwordHash);
  }

  public initializeOwner(password: string, name: string = 'Cinematic Director'): { success: boolean; message: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    this.data.owner = {
      email: AUTHORIZED_OWNER_EMAIL,
      passwordHash,
      salt,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      twoFactorEnabled: true,
    };

    this.addAuditLog(AUTHORIZED_OWNER_EMAIL, 'OWNER_ACCOUNT_INITIALIZED', 'SUCCESS');
    this.save();
    return { success: true, message: 'Owner account successfully secured and initialized.' };
  }

  public updateOwnerPassword(newPassword: string): boolean {
    if (!this.data.owner) return false;
    const salt = crypto.randomBytes(16).toString('hex');
    this.data.owner.salt = salt;
    this.data.owner.passwordHash = hashPassword(newPassword, salt);
    this.data.owner.updatedAt = new Date().toISOString();
    this.addAuditLog(AUTHORIZED_OWNER_EMAIL, 'PASSWORD_UPDATED', 'SUCCESS');
    this.save();
    return true;
  }

  public updateOwnerProfile(name: string): boolean {
    if (!this.data.owner) return false;
    this.data.owner.name = name;
    this.data.owner.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public verifyPassword(password: string): boolean {
    if (!this.data.owner) return false;
    const computed = hashPassword(password, this.data.owner.salt);
    return computed === this.data.owner.passwordHash;
  }

  public createVerificationCode(email: string, purpose: 'login' | 'reset-password'): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Expiration 15 minutes
    const expiresAt = Date.now() + 15 * 60 * 1000;
    
    // Purge previous codes for this email and purpose
    this.data.verificationCodes = this.data.verificationCodes.filter(
      (c) => !(c.email === email && c.purpose === purpose)
    );

    this.data.verificationCodes.push({ code, email, purpose, expiresAt });
    this.save();
    return code;
  }

  public verifyAndConsumeCode(email: string, code: string, purpose: 'login' | 'reset-password'): boolean {
    const now = Date.now();
    const index = this.data.verificationCodes.findIndex(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.code === code && c.purpose === purpose && c.expiresAt > now
    );

    if (index !== -1) {
      this.data.verificationCodes.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  public createSession(email: string, userAgent?: string, ip?: string): AuthSession {
    const token = 'gs_' + crypto.randomBytes(32).toString('hex');
    const now = new Date();
    // 30 days valid
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const session: AuthSession = {
      token,
      email,
      createdAt: now.toISOString(),
      expiresAt,
      userAgent,
      ip,
    };

    this.data.sessions.push(session);
    if (this.data.owner && this.data.owner.email === email) {
      this.data.owner.lastLogin = now.toISOString();
    }
    this.save();
    return session;
  }

  public validateSession(token: string): AuthSession | null {
    if (!token) return null;
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      this.revokeSession(token);
      return null;
    }
    return session;
  }

  public revokeSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  public revokeAllSessions(): void {
    this.data.sessions = [];
    this.save();
  }

  public getActiveSessions(): AuthSession[] {
    const now = new Date();
    return this.data.sessions.filter((s) => new Date(s.expiresAt) > now);
  }

  public addAuditLog(email: string, action: string, status: 'SUCCESS' | 'FAILED' | 'BLOCKED', ip?: string): void {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      email,
      action,
      timestamp: new Date().toISOString(),
      status,
      ip,
    };
    this.data.auditLogs.unshift(log);
    // Keep last 100 logs
    if (this.data.auditLogs.length > 100) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 100);
    }
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // Project operations
  public getProjects(): MovieProject[] {
    return this.data.projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getProject(id: string): MovieProject | null {
    return this.data.projects.find((p) => p.id === id) || null;
  }

  public saveProject(project: MovieProject): MovieProject {
    const existingIndex = this.data.projects.findIndex((p) => p.id === project.id);
    project.updatedAt = new Date().toISOString();
    if (existingIndex >= 0) {
      this.data.projects[existingIndex] = project;
    } else {
      if (!project.createdAt) {
        project.createdAt = new Date().toISOString();
      }
      this.data.projects.push(project);
    }
    this.save();
    return project;
  }

  public deleteProject(id: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    if (this.data.projects.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

export const db = new StorageEngine();
