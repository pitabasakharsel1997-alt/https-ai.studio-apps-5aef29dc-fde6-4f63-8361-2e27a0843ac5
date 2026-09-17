import { getGemini } from '../gemini.js';
import type { CharacterBible, CharacterEntry, VisualStyle, SupportedLanguage } from '../../src/types.js';

export interface CharacterGenInput {
  projectId: string;
  storyPrompt: string;
  scriptOutline: Array<{ description: string; narratorText: string; dialogueText: string }>;
  visualStyle: VisualStyle;
  language: SupportedLanguage;
}

export class CharacterEngine {
  async generateCharacterBible(input: CharacterGenInput): Promise<CharacterBible> {
    const ai = getGemini();

    const promptText = `
You are the Lead Character Designer for an animation and live-action studio.
Create a strict "Character Bible" to guarantee consistent appearance across all video scenes.
No random changes to face, clothes, hair, body, colors, or age are allowed.

Story Context: "${input.storyPrompt}"
Visual Style: ${input.visualStyle}
Language / Cultural Setting: ${input.language}
Script Clues: ${JSON.stringify(input.scriptOutline.map(s => s.description + ' ' + s.dialogueText))}

Return ONLY a valid JSON object matching this schema:
{
  "characters": [
    {
      "name": "Character Name",
      "ageCategory": "child | teen | young-adult | adult | elder",
      "appearance": "Detailed physical description (facial structure, skin tone, eye color, distinct features)",
      "hair": "Specific hair style, length, and color (e.g. neatly styled dark wavy hair with subtle taper)",
      "clothing": "Consistent signature outfit worn throughout all scenes (e.g. navy tailored overcoat over charcoal sweater, dark chinos)",
      "colors": ["#1e293b", "#0284c7", "#f8fafc"],
      "bodyProportions": "e.g. Tall, athletic build, upright posture",
      "personality": "Resolute, reflective, compassionate leader",
      "voice": {
        "gender": "male | female | character",
        "pitch": 1.0,
        "speed": 1.0,
        "emotion": "motivational | cheerful | dramatic | serious | whimsical",
        "voiceName": "Character Voice Profile"
      },
      "expressions": ["Determined concentration", "Warm empathetic smile", "Awe-inspired focus"],
      "referenceImagePrompt": "A single studio character reference turnaround sheet, consistent colors and lighting, no background text, photorealistic or stylized according to visualStyle",
      "animationCharacteristics": "Confident purposeful stride, subtle expressive hand gestures, steady eye line"
    }
  ],
  "visualConsistencyRule": "Strictly anchor character facial geometry, uniform garment palette, and specific hair geometry across all scenes",
  "negativePromptRules": [
    "text, letters, words, watermark, logo, subtitles, captions, signature",
    "distorted hands, extra fingers, deformed face, inconsistent clothes color, mutated anatomy"
  ]
}
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

        const raw = response.text?.trim() || '{}';
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.characters) && parsed.characters.length > 0) {
          const chars: CharacterEntry[] = parsed.characters.map((c: any, index: number) => ({
            id: `char-${Date.now()}-${index}`,
            name: c.name || `Protagonist ${index + 1}`,
            ageCategory: c.ageCategory || 'adult',
            appearance: c.appearance || 'Expressive features, warm cinematic lighting on facial contours.',
            hair: c.hair || 'Dark natural hair with clean trim',
            clothing: c.clothing || 'Navy blue tailored jacket with dark inner layer',
            colors: c.colors || ['#0f172a', '#38bdf8', '#e2e8f0'],
            bodyProportions: c.bodyProportions || 'Natural balanced proportions',
            personality: c.personality || 'Determined and inspiring',
            voice: {
              gender: c.voice?.gender || 'male',
              pitch: c.voice?.pitch || 1.0,
              speed: c.voice?.speed || 1.0,
              emotion: c.voice?.emotion || 'motivational',
              voiceName: c.voice?.voiceName || 'Narrator Lead',
            },
            expressions: Array.isArray(c.expressions) ? c.expressions : ['Focused', 'Smiling', 'Reflective'],
            referenceImagePrompt: c.referenceImagePrompt || `Character reference portrait of ${c.name}`,
            referenceImageUrl: generateCharacterReferenceVisual(c.name, input.visualStyle, c.colors?.[0] || '#3b82f6'),
            animationCharacteristics: c.animationCharacteristics || 'Fluid organic motion, expressive subtle gestures',
          }));

          return {
            projectId: input.projectId,
            characters: chars,
            visualConsistencyRule: parsed.visualConsistencyRule || 'Strictly adhere to signature garment palette and facial geometry',
            negativePromptRules: parsed.negativePromptRules || [
              'text, watermark, logos, captions, numbers, symbols',
              'inconsistent clothes, fluctuating hair colors, distorted anatomy',
            ],
          };
        }
      } catch (err) {
        console.error('CharacterEngine Gemini generation error:', err);
      }
    }

    // Default robust character bible
    const defaultChar: CharacterEntry = {
      id: `char-default-${Date.now()}`,
      name: 'Aarav',
      ageCategory: 'adult',
      appearance: 'Warm expressive amber-brown eyes, sculpted friendly jawline, radiant cinematic skin tone',
      hair: 'Short, neatly textured dark hair with subtle natural shine',
      clothing: 'Signature midnight-indigo utility jacket with clean white collared underlayer and graphite trousers',
      colors: ['#1e1b4b', '#6366f1', '#f8fafc'],
      bodyProportions: 'Athletic, balanced, upright posture with grounded presence',
      personality: 'Visionary, determined, empathetic and inspiring',
      voice: {
        gender: 'male',
        pitch: 1.0,
        speed: 1.0,
        emotion: 'motivational',
        voiceName: 'Aarav (Warm Resonance)',
      },
      expressions: ['Focused determination', 'Warm inspiring smile', 'Quiet contemplation'],
      referenceImagePrompt: `Master character turnaround of Aarav, wearing midnight-indigo utility jacket, neutral backdrop, highly detailed, clean render without any text or letters`,
      referenceImageUrl: generateCharacterReferenceVisual('Aarav', input.visualStyle, '#6366f1'),
      animationCharacteristics: 'Confident stride, deliberate expressive gestures, engaging direct eye contact',
    };

    return {
      projectId: input.projectId,
      characters: [defaultChar],
      visualConsistencyRule: 'Maintain consistent indigo utility jacket, facial geometry, and hairstyle across all shots',
      negativePromptRules: [
        'unwanted text, watermarks, logo, fake subtitles, random letters, UI elements',
        'clothes shifting color, changing facial features, irregular body proportions',
      ],
    };
  }
}

function generateCharacterReferenceVisual(name: string, style: VisualStyle, primaryColor: string): string {
  // Generates high-quality SVG data-uri character portrait avatar to ensure instant, reliable visual preview
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e1b4b" />
      </linearGradient>
      <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="100%" stop-color="#4338ca" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="${primaryColor}" flood-opacity="0.3" />
      </filter>
    </defs>
    <rect width="400" height="400" fill="url(#bgGrad)" rx="24" />
    <circle cx="200" cy="150" r="70" fill="url(#avatarGrad)" filter="url(#glow)" />
    <!-- Stylized hair -->
    <path d="M 140 140 Q 200 80 260 140 Q 240 95 200 95 Q 160 95 140 140 Z" fill="#090d16" />
    <!-- Facial contour -->
    <circle cx="200" cy="155" r="50" fill="#fcd34d" opacity="0.9" />
    <!-- Eyes -->
    <circle cx="185" cy="150" r="5" fill="#1e293b" />
    <circle cx="215" cy="150" r="5" fill="#1e293b" />
    <!-- Smile -->
    <path d="M 188 172 Q 200 182 212 172" stroke="#1e293b" stroke-width="3" fill="none" stroke-linecap="round" />
    <!-- Torso / Signature Clothing -->
    <path d="M 120 360 C 120 270 140 250 200 250 C 260 250 280 270 280 360 Z" fill="${primaryColor}" />
    <path d="M 175 250 L 200 290 L 225 250 Z" fill="#ffffff" />
    <!-- Style badge -->
    <rect x="24" y="24" width="160" height="32" rx="16" fill="#000000" fill-opacity="0.6" stroke="#475569" stroke-width="1" />
    <text x="36" y="45" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="600">${style.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
