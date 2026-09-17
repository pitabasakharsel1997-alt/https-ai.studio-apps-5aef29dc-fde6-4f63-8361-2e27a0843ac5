import { getGemini } from '../gemini.js';
import type { VideoType, VisualStyle, SupportedLanguage, StyleBlueprint } from '../../src/types.js';

export interface StoryGenerationInput {
  prompt: string;
  videoType: VideoType;
  visualStyle: VisualStyle;
  language: SupportedLanguage;
  durationTargetSec?: number;
  blueprint?: StyleBlueprint;
}

export interface StoryResult {
  title: string;
  logline: string;
  targetAudience: string;
  scriptOutline: Array<{
    beat: string;
    description: string;
    narratorText: string;
    dialogueText: string;
  }>;
}

export class StoryEngine {
  async generateStory(input: StoryGenerationInput): Promise<StoryResult> {
    const ai = getGemini();

    const promptText = `
You are an expert film director and scriptwriter for a professional AI Video Generation platform.
Generate a captivating, original video script and story outline.

User Idea: "${input.prompt}"
Category/Type: ${input.videoType}
Visual Style: ${input.visualStyle}
Target Language: ${input.language}
Target Duration: ~${input.durationTargetSec || 25} seconds (approximately 4 to 6 concise scenes)
Style Blueprint Guidelines:
- Genre: ${input.blueprint?.genre || input.videoType}
- Pacing: ${input.blueprint?.pacing?.opening || 'Hook fast'} -> ${input.blueprint?.pacing?.middle || 'Build story'} -> ${input.blueprint?.pacing?.ending || 'Inspiring conclusion'}
- Story Structure: ${input.blueprint?.storyStructure || 'Engaging 3-act flow'}

IMPORTANT RULES:
1. Provide the script narrative, dialogue, and voiceover in ${input.language} (you may provide English translations if needed, but primary spoken content must be suitable for ${input.language} speaker).
2. The story must be 100% ORIGINAL. No copyrighted characters, brands, or cloned plots.
3. Keep narration natural, punchy, avoiding robotic phrases.

Return ONLY a JSON object with this schema:
{
  "title": "Inspiring Short Title",
  "logline": "1-sentence hook of the story",
  "targetAudience": "Target demographic description",
  "scriptOutline": [
    {
      "beat": "Scene 1: Hook / Introduction",
      "description": "Visual scene context and emotional setup",
      "narratorText": "Spoken voiceover in ${input.language}",
      "dialogueText": "Any character dialogue (or empty if purely narrator)"
    }
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
            temperature: 0.8,
          },
        });

        const raw = response.text?.trim() || '{}';
        const parsed = JSON.parse(raw);
        if (parsed.title && Array.isArray(parsed.scriptOutline)) {
          return {
            title: parsed.title,
            logline: parsed.logline || parsed.title,
            targetAudience: parsed.targetAudience || 'General audience',
            scriptOutline: parsed.scriptOutline,
          };
        }
      } catch (err) {
        console.error('StoryEngine Gemini generation failed, falling back:', err);
      }
    }

    // Fallback script builder tailored by language and video type
    const langSample = getLanguageFallbackScript(input.language, input.prompt, input.videoType);
    return langSample;
  }
}

function getLanguageFallbackScript(language: SupportedLanguage, idea: string, type: VideoType): StoryResult {
  const cleanIdea = idea.trim() || 'A journey of discovery and resilience';
  
  // High-craft fallback outlines per language
  if (language === 'Hindi') {
    return {
      title: 'सपनों की नई उड़ान (New Flight of Dreams)',
      logline: 'एक साधारण शुरुआत से असाधारण मंज़िल तक का प्रेरणादायक सफ़र।',
      targetAudience: 'प्रेरणा और नई शुरुआत की तलाश करने वाले सभी दर्शक',
      scriptOutline: [
        {
          beat: 'Scene 1: आरंभ और चुनौती',
          description: 'सुबह की पहली किरण, शहर की हलचल और किरदार की आँखों में उम्मीद।',
          narratorText: 'हर बड़ी कहानी की शुरुआत एक छोटे से कदम से होती है।',
          dialogueText: '',
        },
        {
          beat: 'Scene 2: संघर्ष का दौर',
          description: 'किरदार कड़ी मेहनत करता हुआ, कठिनाइयों का सामना करता हुआ।',
          narratorText: 'जब रास्ते मुश्किल हों, तभी इरादों की असली परीक्षा होती है।',
          dialogueText: 'मैं रुकूँगा नहीं, चाहे कुछ भी हो जाए।',
        },
        {
          beat: 'Scene 3: नया मोड़ और समाधान',
          description: 'एक नया विचार, नई आशा और आत्मविश्वास का संचार।',
          narratorText: 'धैर्य और लगन से हर अंधेरे के बाद उजाला आता है।',
          dialogueText: '',
        },
        {
          beat: 'Scene 4: सफलता और प्रेरणा',
          description: 'किरदार अपने लक्ष्य को प्राप्त करता हुआ, मुस्कुराता हुआ क्षितिज की ओर देखता है।',
          narratorText: 'विश्वास रखिए, आपकी कहानी भी एक दिन दुनिया को प्रेरित करेगी।',
          dialogueText: '',
        },
      ],
    };
  }

  if (language === 'Bengali') {
    return {
      title: 'নতুন ভোরের স্বপ্ন (Dream of a New Dawn)',
      logline: 'অধ্যবসায় ও আত্মবিশ্বাসের এক অনুপ্রেরণাদায়ী গল্প।',
      targetAudience: 'সকল স্বপ্নদর্শী ও সাধারণ মানুষ',
      scriptOutline: [
        {
          beat: 'Scene 1: শুরু ও প্রত্যয়',
          description: 'একটি সুন্দর সকাল, নদীর তীরে শান্ত পরিবেশ ও নতুন আশার আলো।',
          narratorText: 'প্রতিটি নতুন ভোরের সাথেই জেগে ওঠে নতুন সম্ভাবনার আশা।',
          dialogueText: '',
        },
        {
          beat: 'Scene 2: এগিয়ে চলার প্রেরণা',
          description: 'কঠিন পরিশ্রম ও একাগ্রতার সাথে নিজের লক্ষ্যে অবিচল থাকা।',
          narratorText: 'বাধা আসবেই, কিন্তু সাহসিকতাই বিজয়ের পথ দেখায়।',
          dialogueText: 'আমাদের এই স্বপ্ন সত্যি করতেই হবে।',
        },
        {
          beat: 'Scene 3: বিজয়ের আনন্দ',
          description: 'চূড়ান্ত সাফল্য লাভ ও উজ্জ্বল ভবিষ্যতের সূচনা।',
          narratorText: 'বিশ্বাস ও নিষ্ঠাই মানুষের জীবনের সবচেয়ে বড় শক্তি।',
          dialogueText: '',
        },
      ],
    };
  }

  // Default English / multilingual fallback
  return {
    title: type === 'motivational' ? 'The Spark Within' : `The Legend of ${cleanIdea.slice(0, 30)}`,
    logline: `An evocative visual journey demonstrating perseverance, creativity, and breakthrough.`,
    targetAudience: 'Global creative and curious audience',
    scriptOutline: [
      {
        beat: 'Scene 1: The Spark',
        description: 'Atmospheric opening with golden morning light illuminating the quiet horizon.',
        narratorText: 'Every monumental journey begins with a single, quiet conviction.',
        dialogueText: '',
      },
      {
        beat: 'Scene 2: The Rising Challenge',
        description: 'Dynamic medium shot of the protagonist confronting the obstacle with resolute focus.',
        narratorText: 'When obstacles rise, vision turns doubt into determined action.',
        dialogueText: 'We build the future not by waiting, but by creating.',
      },
      {
        beat: 'Scene 3: The Breakthrough',
        description: 'Vibrant colors burst across the scene as the innovation comes to life.',
        narratorText: 'And in that decisive moment, effort transforms into mastery.',
        dialogueText: '',
      },
      {
        beat: 'Scene 4: The Inspiring Horizon',
        description: 'Sweeping wide panoramic shot showcasing triumph and boundless potential.',
        narratorText: 'Dare to dream boldly, for the horizon belongs to those who dare.',
        dialogueText: '',
      },
    ],
  };
}
