import { getGemini } from '../gemini.js';
import type { SupportedLanguage, VoiceGender, VoiceEmotion, SceneItem } from '../../src/types.js';

export interface VoiceSynthesizeInput {
  text: string;
  language: SupportedLanguage;
  gender: VoiceGender;
  emotion: VoiceEmotion;
  speed: number;
  pitch: number;
  voiceName?: string;
}

export interface VoiceSynthesizeResult {
  audioUrl?: string;
  durationSec: number;
  wordCount: number;
  synthesizer: 'gemini-tts' | 'neural-speech' | 'web-audio';
  duckingEnvelope: {
    attackSec: number;
    holdSec: number;
    releaseSec: number;
    duckRatio: number; // e.g. 0.25 (music volume lowered to 25%)
  };
}

export class VoiceEngine {
  async synthesizeVoice(input: VoiceSynthesizeInput): Promise<VoiceSynthesizeResult> {
    const ai = getGemini();
    const cleanText = input.text.trim();
    if (!cleanText) {
      return {
        durationSec: 0,
        wordCount: 0,
        synthesizer: 'web-audio',
        duckingEnvelope: { attackSec: 0.2, holdSec: 0, releaseSec: 0.5, duckRatio: 1.0 },
      };
    }

    const words = cleanText.split(/\s+/).length;
    // Standard speaking rate: ~140 words per minute => ~2.3 words/sec, adjusted by speed
    const baseDuration = (words / 2.3) / (input.speed || 1.0);
    const durationSec = Math.max(1.8, Math.round(baseDuration * 10) / 10);

    // Try Gemini TTS if configured
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: `Say with ${input.emotion} tone in ${input.language}: ${cleanText}` }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: input.gender === 'female' ? 'Kore' : 'Puck',
                },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          return {
            audioUrl: `data:audio/mp3;base64,${base64Audio}`,
            durationSec,
            wordCount: words,
            synthesizer: 'gemini-tts',
            duckingEnvelope: {
              attackSec: 0.3,
              holdSec: durationSec,
              releaseSec: 0.6,
              duckRatio: 0.2,
            },
          };
        }
      } catch (err) {
        console.warn('VoiceEngine Gemini TTS not available or error:', err);
      }
    }

    // Default neural speech configuration for browser/node
    return {
      durationSec,
      wordCount: words,
      synthesizer: 'neural-speech',
      duckingEnvelope: {
        attackSec: 0.3,
        holdSec: durationSec,
        releaseSec: 0.6,
        duckRatio: 0.25,
      },
    };
  }
}

export interface MusicTrackPlan {
  genre: string;
  tempoBpm: number;
  mood: string;
  baseVolume: number; // e.g. 0.6
  duckedVolume: number; // e.g. 0.15
  synthPreset: 'orchestral' | 'ambient-synth' | 'lofi-beats' | 'cinematic-pulse' | 'acoustic-warm';
  duckingSegments: Array<{
    startTime: number;
    endTime: number;
    duckRatio: number;
  }>;
}

export class MusicEngine {
  planSoundtrack(scenes: SceneItem[], preferredMood?: string): MusicTrackPlan {
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    const duckingSegments: Array<{ startTime: number; endTime: number; duckRatio: number }> = [];
    let currentTime = 0;

    for (const scene of scenes) {
      if (scene.narration || scene.dialogue) {
        duckingSegments.push({
          startTime: currentTime + 0.2,
          endTime: currentTime + scene.duration - 0.2,
          duckRatio: 0.2,
        });
      }
      currentTime += scene.duration;
    }

    const moodLower = (preferredMood || '').toLowerCase();
    let synthPreset: MusicTrackPlan['synthPreset'] = 'cinematic-pulse';

    if (moodLower.includes('cartoon') || moodLower.includes('playful')) synthPreset = 'lofi-beats';
    else if (moodLower.includes('documentary') || moodLower.includes('educational')) synthPreset = 'acoustic-warm';
    else if (moodLower.includes('ambient') || moodLower.includes('reflective')) synthPreset = 'ambient-synth';
    else if (moodLower.includes('epic') || moodLower.includes('dramatic')) synthPreset = 'orchestral';

    return {
      genre: 'Cinematic Ambient Score',
      tempoBpm: 96,
      mood: preferredMood || 'Inspirational & Cinematic',
      baseVolume: 0.5,
      duckedVolume: 0.15,
      synthPreset,
      duckingSegments,
    };
  }
}

export interface SFXTrackPlan {
  sfxEvents: Array<{
    sceneId: string;
    type: string;
    timestampSec: number;
    volume: number;
    soundName: 'whoosh' | 'cinematic-hit' | 'shimmer' | 'ambient-swell' | 'transition-glide';
  }>;
}

export class SFXEngine {
  planSFX(scenes: SceneItem[]): SFXTrackPlan {
    const sfxEvents: SFXTrackPlan['sfxEvents'] = [];
    let currentTime = 0;

    scenes.forEach((scene, index) => {
      // Scene transition whoosh
      if (index > 0) {
        sfxEvents.push({
          sceneId: scene.id,
          type: 'Transition Whoosh',
          timestampSec: Math.max(0, currentTime - 0.3),
          volume: 0.45,
          soundName: 'whoosh',
        });
      }

      // Hero impact on climax or intro
      if (index === 0) {
        sfxEvents.push({
          sceneId: scene.id,
          type: 'Opening Ambient Atmosphere',
          timestampSec: currentTime + 0.1,
          volume: 0.4,
          soundName: 'ambient-swell',
        });
      } else if (index === scenes.length - 1) {
        sfxEvents.push({
          sceneId: scene.id,
          type: 'Climax Shimmer',
          timestampSec: currentTime + 0.5,
          volume: 0.5,
          soundName: 'shimmer',
        });
      }

      currentTime += scene.duration;
    });

    return { sfxEvents };
  }
}
