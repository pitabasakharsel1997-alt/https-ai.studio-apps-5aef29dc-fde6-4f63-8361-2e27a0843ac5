import { getGemini } from '../gemini.js';
import type { SceneItem, CharacterBible, StyleBlueprint, VisualStyle, SceneTransition } from '../../src/types.js';

export interface ScenePlanningInput {
  scriptOutline: Array<{ beat: string; description: string; narratorText: string; dialogueText: string }>;
  characterBible: CharacterBible;
  styleBlueprint: StyleBlueprint;
  visualStyle: VisualStyle;
  targetDurationSec?: number;
}

export class SceneEngine {
  async planScenes(input: ScenePlanningInput): Promise<SceneItem[]> {
    const ai = getGemini();

    const charSummary = input.characterBible.characters.map(c => 
      `${c.name} (${c.appearance}, clothes: ${c.clothing})`
    ).join('; ');

    const promptText = `
You are the Lead Cinematographer & Scene Director for an AI Video Generator platform.
Deconstruct the script outline into individual cinematic scenes.

Script Outline: ${JSON.stringify(input.scriptOutline)}
Characters in Bible: ${charSummary}
Visual Style: ${input.visualStyle}
Style Blueprint:
- Lighting: ${input.styleBlueprint.lightingStyle}
- Camera Language: ${JSON.stringify(input.styleBlueprint.cameraLanguage)}
- Transition Style: ${input.styleBlueprint.transitionStyle}
- Editing Rhythm: ${input.styleBlueprint.editingRhythm}

CRITICAL RULES:
1. Each scene must be between 3.5 and 6 seconds in duration.
2. Character clothing and appearance must strictly stay identical to the Character Bible.
3. STRICT NEGATIVE CONSTRAINT FOR VISUAL PROMPTS:
   Visual prompts must describe pure environment, character, and action.
   NEVER include text, words, captions, subtitles, logos, or watermarks in the visual prompt!
4. Transitions: fade, cross-dissolve, cut, whip-pan, zoom-in, slide-left.

Return ONLY a valid JSON array of scene objects matching:
[
  {
    "order": 1,
    "duration": 4.5,
    "location": "Modern sunlit workshop / urban rooftop / open landscape",
    "charactersPresent": ["Character Name"],
    "characterAction": "Gazing thoughtfully at the glowing horizon, turning slowly toward the camera",
    "expression": "Quiet determination with a subtle confident smile",
    "dialogue": "Short spoken line or empty",
    "narration": "Voiceover line for this scene",
    "camera": {
      "shot": "Medium close-up",
      "movement": "zoom-in",
      "focalLength": "50mm f/1.8 shallow depth of field"
    },
    "lighting": "Golden hour rim light casting soft amber glow across shoulders",
    "environment": "Atmospheric dust motes floating in warm light beams, soft bokeh background",
    "visualPrompt": "Cinematic visual description, no text, no letters, no logos, highly detailed ${input.visualStyle}",
    "animationPrompt": "Subtle hair movement in gentle breeze, slow camera push-in, expressive blinking",
    "sfx": {
      "type": "Subtle ambient wind and warm synth swell",
      "timingSec": 0.5,
      "volume": 0.4
    },
    "musicState": {
      "duckingActive": true,
      "intensity": "medium",
      "themeMood": "Inspirational uplifting cinematic"
    },
    "transition": "cross-dissolve"
  }
]
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const raw = response.text?.trim() || '[]';
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any, idx: number) => sanitizeSceneItem(s, idx, input.visualStyle));
        }
      } catch (err) {
        console.error('SceneEngine Gemini error:', err);
      }
    }

    // Fallback algorithmic scene generator from script outline
    return input.scriptOutline.map((beat, idx) => {
      const charName = input.characterBible.characters[0]?.name || 'Protagonist';
      const transitions: SceneTransition[] = ['fade', 'cross-dissolve', 'whip-pan', 'cut'];
      const cameraMoves = ['zoom-in', 'pan-left', 'dolly-in', 'static'] as const;

      return {
        id: `scene-${Date.now()}-${idx + 1}`,
        order: idx + 1,
        duration: 4.5,
        location: idx === 0 ? 'Quiet dawn skyline' : idx === 1 ? 'Dynamic creative workspace' : 'Triumphant panoramic vista',
        charactersPresent: [charName],
        characterAction: idx === 0 ? `${charName} pauses to reflect upon the horizon` : `${charName} strides forward with conviction`,
        expression: idx === 0 ? 'Contemplative and focused' : 'Confident and triumphant',
        dialogue: beat.dialogueText || '',
        narration: beat.narratorText || '',
        camera: {
          shot: idx === 0 ? 'Wide establishing' : idx === 1 ? 'Medium shot' : 'Close-up hero framing',
          movement: cameraMoves[idx % cameraMoves.length],
          focalLength: '50mm cinematic prime',
        },
        lighting: 'Volumetric golden hour with soft amber rim illumination',
        environment: 'Atmospheric particles, soft cinematic depth of field blur',
        visualPrompt: `Master shot of ${charName} in ${input.visualStyle} style, wearing signature tailored attire, in atmospheric setting, pristine lighting, clean visual composition, absolutely no text, no watermark, no captions`,
        animationPrompt: `Subtle natural camera motion, gentle hair breeze, steady breathing and focused eye contact`,
        sfx: {
          type: idx === 0 ? 'Ambient dawn breeze' : idx === 1 ? 'Subtle clockwork click' : 'Cinematic bass boom',
          timingSec: 0.2,
          volume: 0.4,
        },
        musicState: {
          duckingActive: Boolean(beat.narratorText || beat.dialogueText),
          intensity: idx === input.scriptOutline.length - 1 ? 'high' : 'medium',
          themeMood: 'Uplifting cinematic resonance',
        },
        transition: transitions[idx % transitions.length],
        status: 'READY',
        retryCount: 0,
      };
    });
  }
}

function sanitizeSceneItem(s: any, idx: number, visualStyle: VisualStyle): SceneItem {
  const cleanPrompt = (s.visualPrompt || `Cinematic scene in ${visualStyle} style`)
    .replace(/text|words|letters|subtitles|captions|logo|watermark/gi, '')
    .trim();

  return {
    id: `scene-${Date.now()}-${idx + 1}`,
    order: idx + 1,
    duration: Math.max(3, Math.min(8, Number(s.duration) || 4.5)),
    location: s.location || 'Cinematic environment',
    charactersPresent: Array.isArray(s.charactersPresent) ? s.charactersPresent : ['Protagonist'],
    characterAction: s.characterAction || 'Reflective motion towards the camera',
    expression: s.expression || 'Focused and determined',
    dialogue: s.dialogue || '',
    narration: s.narration || '',
    camera: {
      shot: s.camera?.shot || 'Medium close-up',
      movement: s.camera?.movement || 'zoom-in',
      focalLength: s.camera?.focalLength || '50mm prime',
    },
    lighting: s.lighting || 'Cinematic high-contrast key with soft rim light',
    environment: s.environment || 'Layered depth with volumetric haze',
    visualPrompt: cleanPrompt,
    animationPrompt: s.animationPrompt || 'Gentle camera movement with natural micro-expressions',
    sfx: {
      type: s.sfx?.type || 'Subtle whoosh and ambient swell',
      timingSec: Number(s.sfx?.timingSec) || 0.5,
      volume: Number(s.sfx?.volume) || 0.4,
    },
    musicState: {
      duckingActive: s.musicState?.duckingActive ?? true,
      intensity: s.musicState?.intensity || 'medium',
      themeMood: s.musicState?.themeMood || 'Cinematic emotional',
    },
    transition: (s.transition as SceneTransition) || 'cross-dissolve',
    status: 'READY',
    retryCount: 0,
  };
}
