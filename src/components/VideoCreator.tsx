import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import {
  Sparkles,
  Link,
  Upload,
  Type,
  Sliders,
  PlayCircle,
  Video,
  Languages,
  Mic,
  Music,
  CheckCircle2,
  AlertCircle,
  Layers,
  Ratio,
} from 'lucide-react';
import type {
  VideoType,
  VisualStyle,
  AspectRatio,
  SupportedLanguage,
  VoiceGender,
  VoiceEmotion,
  StyleBlueprint,
} from '../types';

interface VideoCreatorProps {
  isGenerating: boolean;
  onCreateVideo: (params: {
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
    referenceType?: 'url' | 'upload' | 'text';
    referenceValue?: string;
  }) => void;
  onAnalyzeReference: (type: 'url' | 'upload' | 'text', value: string) => Promise<StyleBlueprint | null>;
}

export function VideoCreator({ isGenerating, onCreateVideo, onAnalyzeReference }: VideoCreatorProps) {
  const [inputTab, setInputTab] = useState<'text' | 'url' | 'upload'>('text');
  const [ideaText, setIdeaText] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string } | null>(null);
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const [analyzedBlueprint, setAnalyzedBlueprint] = useState<StyleBlueprint | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);

  // Auto vs Advanced Mode
  const [mode, setMode] = useState<'auto' | 'advanced'>('auto');

  // Advanced Configurations
  const [videoType, setVideoType] = useState<VideoType>('cinematic');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('cinematic-realistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [language, setLanguage] = useState<SupportedLanguage>('English');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('male');
  const [voiceEmotion, setVoiceEmotion] = useState<VoiceEmotion>('motivational');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [musicMood, setMusicMood] = useState<string>('Inspirational & Cinematic');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoTypeOptions: { label: string; value: VideoType; desc: string }[] = [
    { label: 'Cinematic', value: 'cinematic', desc: 'Dramatic lighting, depth of field & narrative' },
    { label: 'Cartoon', value: 'cartoon', desc: 'Lively, expressive & colorful character animation' },
    { label: 'Story', value: 'story', desc: 'Engaging narrative plot with emotional beats' },
    { label: 'Motivational', value: 'motivational', desc: 'High energy, uplifting & inspiring message' },
    { label: 'Educational', value: 'educational', desc: 'Clear diagrams, structured informative flow' },
    { label: 'Documentary', value: 'documentary', desc: 'Authentic archival pacing & grounded realism' },
    { label: 'Explainer', value: 'explainer', desc: 'Clean presentation of ideas & solutions' },
    { label: 'Social Media', value: 'social-media', desc: 'Fast hook, vertical dynamic cuts' },
    { label: 'Comedy', value: 'comedy', desc: 'Whimsical timing and comedic expressions' },
    { label: 'Advertisement', value: 'advertisement', desc: 'High-impact product and brand storytelling' },
  ];

  const visualStyleOptions: { label: string; value: VisualStyle; desc: string }[] = [
    { label: 'Cinematic Realistic', value: 'cinematic-realistic', desc: 'Photorealistic textures, volumetric light' },
    { label: '3D Cartoon', value: '3d-cartoon', desc: 'Stylized 3D render with soft bevels' },
    { label: '2D Cartoon', value: '2d-cartoon', desc: 'Classic cel-shaded vibrant character design' },
    { label: 'Anime-Inspired', value: 'anime-inspired', desc: 'Expressive dramatic eyes and bold color rim' },
    { label: 'Clay Animation', value: 'clay-animation', desc: 'Stop-motion tactile clay texture' },
    { label: 'Pixar-like 3D', value: 'pixar-like-3d', desc: 'Rich volumetric materials, warm character faces' },
    { label: 'Comic Style', value: 'comic-style', desc: 'Halftone inks, dynamic line art contours' },
    { label: 'Watercolor', value: 'watercolor', desc: 'Flowing pigment washes and soft paper edges' },
    { label: 'Storybook', value: 'storybook', desc: 'Fairy tale illustrated aesthetic' },
    { label: 'Minimal Animation', value: 'minimal-animation', desc: 'Clean vector silhouettes, elegant negative space' },
  ];

  const languageOptions: SupportedLanguage[] = [
    'English',
    'Hindi',
    'Odia',
    'Bengali',
    'Tamil',
    'Telugu',
    'Marathi',
    'Gujarati',
    'Kannada',
    'Malayalam',
  ];

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedFile({ name: file.name, base64 });
      handleAnalyze('upload', base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (type: 'url' | 'upload' | 'text', val: string, fileName?: string) => {
    if (!val.trim()) return;
    setIsAnalyzingRef(true);
    setAnalysisNotice(null);
    try {
      const bp = await onAnalyzeReference(type, val);
      if (bp) {
        setAnalyzedBlueprint(bp);
        // Auto-populate mode defaults from blueprint
        setVisualStyle(bp.visualStyle);
        setAspectRatio(bp.aspectRatio);
        setVideoType(
          bp.genre.toLowerCase().includes('cartoon') ? 'cartoon' :
          bp.genre.toLowerCase().includes('documentary') ? 'documentary' :
          bp.genre.toLowerCase().includes('motivation') ? 'motivational' : 'cinematic'
        );
      }
    } catch (e: any) {
      setAnalysisNotice(e.message || 'Reference analysis completed with heuristic blueprint');
    } finally {
      setIsAnalyzingRef(false);
    }
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();

    let finalPrompt = ideaText.trim();
    let refType: 'url' | 'upload' | 'text' = 'text';
    let refVal = '';

    if (inputTab === 'url' && referenceUrl.trim()) {
      refType = 'url';
      refVal = referenceUrl.trim();
      if (!finalPrompt) {
        finalPrompt = `Create an original video inspired by the cinematic style and pacing of reference: ${referenceUrl}`;
      }
    } else if (inputTab === 'upload' && uploadedFile) {
      refType = 'upload';
      refVal = uploadedFile.base64;
      if (!finalPrompt) {
        finalPrompt = `Create an original video inspired by uploaded reference asset: ${uploadedFile.name}`;
      }
    }

    if (!finalPrompt) {
      finalPrompt = 'An inspiring visual journey of courage and innovation';
    }

    onCreateVideo({
      ideaPrompt: finalPrompt,
      mode,
      videoType,
      visualStyle,
      aspectRatio,
      language,
      musicMood,
      narratorVoice: {
        gender: voiceGender,
        speed: voiceSpeed,
        pitch: voicePitch,
        emotion: voiceEmotion,
        voiceName: `${voiceGender === 'female' ? 'Kore' : 'Puck'} (${voiceEmotion})`,
      },
      referenceType: refType,
      referenceValue: refVal,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
      <form onSubmit={handleCreateSubmit} className="space-y-6">
        {/* Input Mode Selector Tabs */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Input Reference Source</span>
            </label>

            {/* Auto vs Advanced Mode Pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'auto'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Auto Mode (One-Click)
              </button>
              <button
                type="button"
                onClick={() => setMode('advanced')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'advanced'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Advanced Settings
              </button>
            </div>
          </div>

          {/* Three Input Mode Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-4">
            <button
              type="button"
              onClick={() => setInputTab('text')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                inputTab === 'text'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text Idea</span>
            </button>

            <button
              type="button"
              onClick={() => setInputTab('url')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                inputTab === 'url'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reference URL</span>
            </button>

            <button
              type="button"
              onClick={() => setInputTab('upload')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                inputTab === 'upload'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Upload Media</span>
            </button>
          </div>

          {/* Tab 1: Text Idea */}
          {inputTab === 'text' && (
            <div>
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Describe your video idea, plot, characters, or message (e.g., 'An adventurous young astronomer who discovers a whispering constellation that guides her across ancient desert observatories')..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm resize-none"
              />
              <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400">
                <span>The StoryEngine will automatically structure the script, pacing, and scenes.</span>
                <span>{ideaText.length} chars</span>
              </div>
            </div>
          )}

          {/* Tab 2: Reference URL */}
          {inputTab === 'url' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="Paste YouTube, Instagram Reel, TikTok, or public video link..."
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleAnalyze('url', referenceUrl)}
                  disabled={!referenceUrl.trim() || isAnalyzingRef}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                >
                  {isAnalyzingRef ? 'Analyzing DNA...' : 'Analyze DNA'}
                </button>
              </div>

              {/* Reference Compliance Disclaimer */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs text-cyan-200/90 leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Strict Reference-Video Compliance:</strong>
                  The system does not copy, download, or remix copyrighted footage. Instead, it extracts the visual style, pacing, camera movement, and lighting characteristics to produce a <strong>100% original script, character bible, and video</strong>.
                </div>
              </div>

              {/* Optional user prompt to accompany URL */}
              <input
                type="text"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Optional: Add topic or story focus for the inspired original video..."
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          )}

          {/* Tab 3: Upload Reference */}
          {inputTab === 'upload' && (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-purple-500/80 bg-slate-950/50 hover:bg-purple-950/10 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200">
                  {uploadedFile ? uploadedFile.name : 'Click to select reference video or concept image'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports MP4, WebM, PNG, JPG (analyzed for mood, color grading, and composition)
                </p>
              </div>

              {uploadedFile && (
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-300 font-medium truncate">{uploadedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      setAnalyzedBlueprint(null);
                    }}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analyzed Blueprint Summary Chip */}
        {analyzedBlueprint && (
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Extracted Style Blueprint: {analyzedBlueprint.genre}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[10px]">
                {analyzedBlueprint.visualStyle.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] line-clamp-2">
              <strong>Lighting:</strong> {analyzedBlueprint.lightingStyle} &bull;{' '}
              <strong>Camera:</strong> {analyzedBlueprint.cameraLanguage.movements.join(', ')} &bull;{' '}
              <strong>Pacing:</strong> {analyzedBlueprint.pacing.opening}
            </p>
          </div>
        )}

        {analysisNotice && (
          <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{analysisNotice}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADVANCED MODE SETTINGS (Available in Advanced Mode or collapsed in Auto) */}
        {/* ========================================================================= */}
        {mode === 'advanced' && (
          <div className="space-y-5 pt-4 border-t border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Advanced Pipeline Director Configuration
              </span>
              <span className="text-[11px] text-slate-500">Fine-tune all creative levers</span>
            </div>

            {/* Video Type Grid */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                Video Type / Genre
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {videoTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVideoType(opt.value)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                      videoType === opt.value
                        ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-white">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Grid */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">
                Visual Style (Generic descriptive aesthetic, no artist copying)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {visualStyleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisualStyle(opt.value)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all ${
                      visualStyle === opt.value
                        ? 'bg-purple-950/60 border-purple-500 text-white ring-1 ring-purple-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-white">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Aspect Ratio & Voice Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Language Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-indigo-400" />
                  Target Language (10 Supported)
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aspect Ratio Presets */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Ratio className="w-3.5 h-3.5 text-cyan-400" />
                  Aspect Ratio &amp; Target Platform
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-medium transition-all ${
                      aspectRatio === '16:9'
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="block font-bold">16:9</span>
                    <span className="text-[10px] text-slate-400">YouTube</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-medium transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="block font-bold">9:16</span>
                    <span className="text-[10px] text-slate-400">Shorts / Reels</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('1:1')}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-medium transition-all ${
                      aspectRatio === '1:1'
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="block font-bold">1:1</span>
                    <span className="text-[10px] text-slate-400">Square Feed</span>
                  </button>
                </div>
              </div>

              {/* Voice Emotion & Gender */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  Voice &amp; Emotion Control
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={voiceGender}
                    onChange={(e) => setVoiceGender(e.target.value as VoiceGender)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  >
                    <option value="male">Male Narrator</option>
                    <option value="female">Female Narrator</option>
                    <option value="character">Dynamic Cast</option>
                  </select>
                  <select
                    value={voiceEmotion}
                    onChange={(e) => setVoiceEmotion(e.target.value as VoiceEmotion)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  >
                    <option value="motivational">Motivational</option>
                    <option value="dramatic">Dramatic</option>
                    <option value="cheerful">Cheerful</option>
                    <option value="serious">Serious</option>
                    <option value="whimsical">Whimsical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Speaking speed & pitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Speaking Speed:</span>
                  <span className="font-semibold text-white">{voiceSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Pitch Consistency:</span>
                  <span className="font-semibold text-white">{voicePitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.1"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONE-CLICK LARGE "CREATE VIDEO" BUTTON                                     */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:via-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-lg tracking-wide shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>ORCHESTRATING VIDEO PIPELINE...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-6 h-6 text-white animate-pulse" />
                <span>CREATE VIDEO</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-400 mt-2">
            Auto Mode automatically assigns story structure, character bible, camera shots, voiceover, ducking soundtrack, subtitles, and runs 10-point QC.
          </p>
        </div>
      </form>
    </div>
  );
}
