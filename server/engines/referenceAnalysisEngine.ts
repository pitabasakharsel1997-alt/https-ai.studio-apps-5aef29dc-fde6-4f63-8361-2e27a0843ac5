import { getGemini } from '../gemini.js';
import type { StyleBlueprint, VisualStyle, AspectRatio } from '../../src/types.js';

export interface ReferenceInput {
  type: 'url' | 'upload' | 'text';
  value: string; // URL string, base64 or description
  fileName?: string;
  userPrompt?: string;
  forceInspirationMode?: boolean;
}

export class ReferenceAnalysisEngine {
  /**
   * Analyzes permitted metadata and visual style without copying copyrighted footage.
   */
  async analyze(input: ReferenceInput): Promise<{
    blueprint: StyleBlueprint;
    notice?: string;
    canProcessDirectly: boolean;
  }> {
    const ai = getGemini();

    let permittedMetadata = '';
    let canProcessDirectly = true;
    let notice = '';

    // Handle URL verification & compliance
    if (input.type === 'url') {
      const url = input.value.trim();
      const isKnownService = /(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|vimeo\.com|twitter\.com|x\.com)/i.test(url);
      
      if (!isKnownService && !url.startsWith('http://') && !url.startsWith('https://')) {
        canProcessDirectly = false;
        notice = "This URL cannot be processed directly. Upload content that you own or have permission to use, or provide a description/reference.";
      } else {
        // Permitted metadata extraction (synthesize safe structural pattern from domain & path tags)
        try {
          const parsedUrl = new URL(url);
          permittedMetadata = `Domain: ${parsedUrl.hostname}, Path: ${parsedUrl.pathname}, Query: ${parsedUrl.search}`;
        } catch {
          permittedMetadata = `Reference link: ${url}`;
        }
      }
    }

    // Prepare analysis prompt for Gemini
    const analysisPrompt = `
You are the ReferenceAnalysisEngine for an AI Video Generator platform.
Follow this STRICT COMPLIANCE DIRECTIVE:
DO NOT download, copy, reproduce, or remix copyrighted footage, characters, dialogue, music, or logos.
Analyze the aesthetic style, visual composition, camera language, and pacing to produce a 100% ORIGINAL "Style Blueprint".

Input Type: ${input.type}
Input Content/URL/Metadata: ${input.type === 'url' ? input.value : input.value.slice(0, 1000)}
User Context / Prompt: ${input.userPrompt || 'Create a cinematic masterpiece video inspired by this general format'}
Permitted Metadata: ${permittedMetadata || 'None'}

Return ONLY a valid JSON object strictly matching this schema:
{
  "genre": "Short genre description (e.g. Cinematic motivational story, 3D animated comedy, Documentary explainer)",
  "visualStyle": "one of: 2d-cartoon, 3d-cartoon, anime-inspired, clay-animation, pixar-like-3d, comic-style, cinematic-realistic, watercolor, storybook, minimal-animation",
  "visualDescription": "Detailed generic descriptive style characteristics (no living artist exact names, no copyrighted IPs)",
  "lightingStyle": "Lighting setup (e.g. High contrast cinematic with soft amber rim light, high-key pastel diffuse)",
  "cameraLanguage": {
    "movements": ["Slow push-in", "Medium shot", "Wide establishing aerial", "Smooth tracking"],
    "shotTypes": ["Wide shot", "Medium close-up", "Macro detail"],
    "composition": "Rule of thirds, centered focal subject, generous leading room"
  },
  "pacing": {
    "opening": "Hook fast 0-3s visual intrigue",
    "middle": "Rhythmic storytelling pacing with dynamic cuts",
    "ending": "Emotional resonance, contemplative cadence",
    "overallBpm": 95
  },
  "colorMood": "Teal and warm gold palette with saturated focal elements",
  "transitionStyle": "Clean whip-pans and subtle cross-dissolves",
  "storyStructure": "3-act narrative hook, climax, takeaway call-to-action",
  "narrationStructure": "Voiceover driving visual cadence with strategic pauses",
  "editingRhythm": "Fast tempo cuts on downbeats with gradual deceleration",
  "environmentCharacteristics": "Atmospheric depth, soft atmospheric haze, grounded physical textures",
  "recommendedDurationSec": 24,
  "aspectRatio": "one of: 16:9, 9:16, 1:1"
}
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: analysisPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);

        const blueprint: StyleBlueprint = {
          genre: parsed.genre || 'Cinematic Storytelling',
          visualStyle: (parsed.visualStyle as VisualStyle) || 'cinematic-realistic',
          visualDescription: parsed.visualDescription || 'Rich textured environment with cinematic lighting and volumetric depth.',
          lightingStyle: parsed.lightingStyle || 'Dramatic high contrast with soft rim light',
          cameraLanguage: {
            movements: parsed.cameraLanguage?.movements || ['Slow push-in', 'Medium shot', 'Wide establishing'],
            shotTypes: parsed.cameraLanguage?.shotTypes || ['Wide', 'Medium', 'Close-up'],
            composition: parsed.cameraLanguage?.composition || 'Rule of thirds, balanced negative space',
          },
          pacing: {
            opening: parsed.pacing?.opening || 'Fast dynamic hook',
            middle: parsed.pacing?.middle || 'Story progression with emotional beats',
            ending: parsed.pacing?.ending || 'Memorable crescendo',
            overallBpm: parsed.pacing?.overallBpm || 100,
          },
          colorMood: parsed.colorMood || 'Rich dynamic palette with cinematic tonality',
          transitionStyle: parsed.transitionStyle || 'Seamless cross-dissolves and fluid cuts',
          storyStructure: parsed.storyStructure || 'Engaging 3-act narrative framework',
          narrationStructure: parsed.narrationStructure || 'Authoritative voiceover with emotional inflection',
          editingRhythm: parsed.editingRhythm || 'Dynamic 3-4s scene cadence synced with audio beats',
          environmentCharacteristics: parsed.environmentCharacteristics || 'Grounded realistic atmosphere with layered foreground and background',
          recommendedDurationSec: parsed.recommendedDurationSec || 25,
          aspectRatio: (parsed.aspectRatio as AspectRatio) || (input.value.includes('reel') || input.value.includes('short') ? '9:16' : '16:9'),
          isOriginalSynthesis: true,
          referenceSource: {
            type: input.type,
            value: input.type === 'upload' ? (input.fileName || 'Uploaded Asset') : input.value,
            permittedMetadataSummary: permittedMetadata || 'Derived purely through abstract style analysis',
          },
        };

        return { blueprint, canProcessDirectly, notice: notice || undefined };
      } catch (err) {
        console.error('ReferenceAnalysisEngine Gemini error:', err);
      }
    }

    // Fallback algorithmic blueprint generator
    const isVertical = input.value.toLowerCase().includes('short') || input.value.toLowerCase().includes('reel') || input.value.toLowerCase().includes('tiktok');
    const fallbackBlueprint: StyleBlueprint = {
      genre: 'Cinematic Motivational Story',
      visualStyle: 'cinematic-realistic',
      visualDescription: 'Rich cinematic atmosphere with deep dynamic range, soft natural haze, and photorealistic texturing.',
      lightingStyle: 'High contrast key lighting with soft amber rim illumination',
      cameraLanguage: {
        movements: ['Slow push-in', 'Dynamic lateral pan', 'Steady medium tracking'],
        shotTypes: ['Establishing wide shot', 'Character medium close-up', 'Detail macro'],
        composition: 'Cinematic center-weighted framing with depth of field separation',
      },
      pacing: {
        opening: 'Fast visual hook within 3 seconds',
        middle: 'Balanced narrative rhythm with building intensity',
        ending: 'Emotional crescendo and inspiring resolution',
        overallBpm: 92,
      },
      colorMood: 'Cinematic teal and gold warmth with controlled highlights',
      transitionStyle: 'Smooth dissolves and motion-matched cuts',
      storyStructure: 'Hook -> Conflict / Challenge -> Turning Point -> Inspiring Resolution',
      narrationStructure: 'Measured cadence, conversational yet cinematic timbre',
      editingRhythm: '3.5 to 5 second scene durations matching musical phrases',
      environmentCharacteristics: 'Atmospheric depth, cinematic particulate dust motes, grounded architecture',
      recommendedDurationSec: 20,
      aspectRatio: isVertical ? '9:16' : '16:9',
      isOriginalSynthesis: true,
      referenceSource: {
        type: input.type,
        value: input.type === 'upload' ? (input.fileName || 'Uploaded Asset') : input.value,
        permittedMetadataSummary: 'Abstract style decomposition',
      },
    };

    return { blueprint: fallbackBlueprint, canProcessDirectly, notice: notice || undefined };
  }
}
