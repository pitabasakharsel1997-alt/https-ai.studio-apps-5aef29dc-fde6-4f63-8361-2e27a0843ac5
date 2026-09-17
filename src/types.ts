export type VideoType =
  | 'cartoon'
  | 'story'
  | 'educational'
  | 'motivational'
  | 'documentary'
  | 'explainer'
  | 'cinematic'
  | 'social-media'
  | 'comedy'
  | 'advertisement';

export type VisualStyle =
  | '2d-cartoon'
  | '3d-cartoon'
  | 'anime-inspired'
  | 'clay-animation'
  | 'pixar-like-3d'
  | 'comic-style'
  | 'cinematic-realistic'
  | 'watercolor'
  | 'storybook'
  | 'minimal-animation';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type SupportedLanguage =
  | 'English'
  | 'Hindi'
  | 'Odia'
  | 'Bengali'
  | 'Tamil'
  | 'Telugu'
  | 'Marathi'
  | 'Gujarati'
  | 'Kannada'
  | 'Malayalam';

export type VoiceGender = 'male' | 'female' | 'character';
export type VoiceEmotion = 'neutral' | 'motivational' | 'dramatic' | 'cheerful' | 'serious' | 'whimsical' | 'suspenseful';

export interface StyleBlueprint {
  genre: string;
  visualStyle: VisualStyle;
  visualDescription: string;
  lightingStyle: string;
  cameraLanguage: {
    movements: string[];
    shotTypes: string[];
    composition: string;
  };
  pacing: {
    opening: string;
    middle: string;
    ending: string;
    overallBpm: number;
  };
  colorMood: string;
  transitionStyle: string;
  storyStructure: string;
  narrationStructure: string;
  editingRhythm: string;
  environmentCharacteristics: string;
  recommendedDurationSec: number;
  aspectRatio: AspectRatio;
  isOriginalSynthesis: boolean;
  referenceSource?: {
    type: 'url' | 'upload' | 'text';
    value: string;
    permittedMetadataSummary?: string;
  };
}

export interface CharacterEntry {
  id: string;
  name: string;
  ageCategory: 'child' | 'teen' | 'young-adult' | 'adult' | 'elder';
  appearance: string;
  hair: string;
  age?: string;
  clothing: string;
  colors: string[];
  bodyProportions: string;
  personality: string;
  voice: {
    gender: VoiceGender;
    pitch: number; // 0.5 to 1.5
    speed: number; // 0.5 to 1.5
    emotion: VoiceEmotion;
    voiceName: string;
  };
  expressions: string[];
  referenceImagePrompt: string;
  referenceImageUrl?: string;
  referenceImages?: {
    front?: string;
    side?: string;
    expressions?: string;
    costume?: string;
  };
  animationCharacteristics: string;
}

export interface CharacterBible {
  projectId: string;
  characters: CharacterEntry[];
  visualConsistencyRule: string;
  negativePromptRules: string[]; // e.g. "NO text, NO logos, NO watermark, NO distorted hands"
}

export type CameraMovement =
  | 'static'
  | 'pan-left'
  | 'pan-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'dolly-in'
  | 'pedestal-up'
  | 'orbit';

export type SceneTransition =
  | 'fade'
  | 'cross-dissolve'
  | 'cut'
  | 'whip-pan'
  | 'zoom-in'
  | 'slide-left'
  | 'fade-to-black'
  | 'zoom-transition'
  | 'match-cut';

export interface SceneItem {
  id: string;
  order: number;
  duration: number; // in seconds, typically 3-8s
  location: string;
  charactersPresent: string[];
  characterAction: string;
  expression: string;
  dialogue: string;
  narration: string;
  camera: {
    shot: string;
    movement: CameraMovement;
    focalLength: string;
  };
  lighting: string;
  environment: string;
  visualPrompt: string; // Guaranteed NO text/subtitles
  imageUrl?: string;
  videoClipUrl?: string;
  animationPrompt: string;
  sfx: {
    type: string;
    timingSec: number;
    volume: number;
  };
  musicState: {
    duckingActive: boolean;
    intensity: 'low' | 'medium' | 'high';
    themeMood: string;
  };
  transition: SceneTransition;
  status: 'QUEUED' | 'GENERATING' | 'READY' | 'FAILED' | 'RETRYING';
  errorMessage?: string;
  retryCount: number;
}

export interface SubtitleItem {
  id: string;
  sceneId: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

export interface QualityControlResult {
  passed: boolean;
  score: number; // 0 to 100
  checks: {
    videoIntegrity: { passed: boolean; message: string };
    audioIntegrity: { passed: boolean; message: string };
    avSync: { passed: boolean; message: string; offsetMs: number };
    frameRate: { passed: boolean; targetFps: number; actualFps: number };
    resolution: { passed: boolean; target: string; actual: string };
    blackFrameDetection: { passed: boolean; blackFramesFound: number };
    frozenFrameDetection: { passed: boolean; frozenRatio: number };
    subtitleTiming: { passed: boolean; overlappingSubtitles: number };
    sceneTransitions: { passed: boolean; seamless: boolean };
    finalMp4Validation: { passed: boolean; containerValid: boolean };
  };
  failedScenes: string[];
  retryHistory: Array<{ timestamp: string; sceneId: string; action: string; result: string }>;
}

export type JobState =
  | 'QUEUED'
  | 'PROCESSING'
  | 'GENERATING_SCENES'
  | 'GENERATING_AUDIO'
  | 'RENDERING'
  | 'QUALITY_CHECK'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING';

export interface GenerationJob {
  id: string;
  projectId: string;
  state: JobState;
  progressPercent: number;
  currentStepMessage: string;
  logs: Array<{ timestamp: string; step: string; message: string; status: 'info' | 'success' | 'warn' | 'error' }>;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  qcResult?: QualityControlResult;
  finalVideoUrl?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  ideaPrompt: string;
  mode: 'auto' | 'advanced';
  videoType: VideoType;
  visualStyle: VisualStyle;
  aspectRatio: AspectRatio;
  language: SupportedLanguage;
  musicMood: string;
  narratorVoice: {
    gender: VoiceGender;
    speed: number;
    pitch: number;
    emotion: VoiceEmotion;
    voiceName: string;
  };
  styleBlueprint: StyleBlueprint;
  characterBible: CharacterBible;
  scenes: SceneItem[];
  subtitles: SubtitleItem[];
  totalDuration: number;
  currentJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFairUseQuota {
  dailyQuotaTotal: number;
  dailyQuotaRemaining: number;
  maxVideoDurationSec: number;
  maxResolution: '720p' | '1080p';
  activeConcurrentJobs: number;
  maxConcurrentJobs: number;
  queuePosition?: number;
  resetAt: string;
}
