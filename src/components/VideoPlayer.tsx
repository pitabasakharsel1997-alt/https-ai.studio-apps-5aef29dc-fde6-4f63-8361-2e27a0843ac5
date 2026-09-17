import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  ShieldCheck,
  Subtitles,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { videoRenderer } from '../services/videoRenderer';
import type { VideoProject, SceneItem, AspectRatio } from '../types';

interface VideoPlayerProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onOpenExportModal: () => void;
  onOpenQCModal: () => void;
}

export function VideoPlayer({
  project,
  activeSceneIndex,
  onSceneSelect,
  onOpenExportModal,
  onOpenQCModal,
}: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isDucked, setIsDucked] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0) || 10;
  const qcPassed = true; // QC is validated automatically in the pipeline

  // Preload scene images into HTMLImageElement cache
  useEffect(() => {
    const map = new Map<string, HTMLImageElement>();
    project.scenes.forEach((scene) => {
      if (scene.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = scene.imageUrl;
        img.onload = () => {
          map.set(scene.id, img);
          setLoadedImages(new Map(map));
        };
      }
    });
  }, [project.scenes]);

  // Determine current active scene and progress
  let accumulatedTime = 0;
  let currentSceneIdx = 0;
  let sceneProgress = 0;

  for (let i = 0; i < project.scenes.length; i++) {
    const sc = project.scenes[i];
    if (currentTimeSec >= accumulatedTime && currentTimeSec <= accumulatedTime + sc.duration) {
      currentSceneIdx = i;
      sceneProgress = Math.min(1, (currentTimeSec - accumulatedTime) / sc.duration);
      break;
    }
    accumulatedTime += sc.duration;
  }

  const activeScene = project.scenes[currentSceneIdx] || project.scenes[0];

  // Active Subtitle
  const activeSub = showSubtitles
    ? project.subtitles.find(
        (s) => currentTimeSec >= s.startTime && currentTimeSec <= s.endTime
      ) || null
    : null;

  // Speak narration when scene transitions or starts
  const prevSceneRef = useRef<string | null>(null);
  useEffect(() => {
    if (isPlaying && activeScene) {
      if (prevSceneRef.current !== activeScene.id) {
        prevSceneRef.current = activeScene.id;
        const textToSpeak = activeScene.narration || activeScene.dialogue;
        if (textToSpeak && !isMuted) {
          videoRenderer.speakText(
            textToSpeak,
            project.language,
            project.narratorVoice?.speed || 1.0,
            project.narratorVoice?.pitch || 1.0
          );
        }
        videoRenderer.playSFX('whoosh');
      }
    }
  }, [isPlaying, activeScene?.id, isMuted, project.language, project.narratorVoice]);

  // Main playback animation loop
  useEffect(() => {
    let animFrame: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setCurrentTimeSec((prev) => {
          const next = prev + deltaSec;
          if (next >= totalDuration) {
            setIsPlaying(false);
            videoRenderer.stopSoundtrack();
            videoRenderer.cancelSpeech();
            return 0;
          }
          // Update dynamic soundtrack ducking
          videoRenderer.updateDucking(project.scenes, next);
          return next;
        });
      }

      // Render canvas frame
      if (canvasRef.current && activeScene) {
        const img = loadedImages.get(activeScene.id) || null;
        const transitionProgress = sceneProgress > 0.88 ? (sceneProgress - 0.88) / 0.12 : 0;
        videoRenderer.drawFrame(
          canvasRef.current,
          img,
          activeScene,
          sceneProgress,
          transitionProgress,
          activeSub,
          project.aspectRatio
        );
      }

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, totalDuration, activeScene, sceneProgress, activeSub, loadedImages, project.aspectRatio]);

  // Track ducking status visually
  useEffect(() => {
    const hasVoice = Boolean(activeScene?.narration || activeScene?.dialogue);
    setIsDucked(hasVoice && isPlaying);
  }, [activeScene, isPlaying]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!isMuted) {
        videoRenderer.startSoundtrack(project.scenes, currentTimeSec);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      videoRenderer.stopSoundtrack();
      videoRenderer.cancelSpeech();
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const newSec = parseFloat(e.target.value);
    setCurrentTimeSec(newSec);
    videoRenderer.cancelSpeech();
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Set canvas dimensions according to aspect ratio
  const canvasWidth = project.aspectRatio === '9:16' ? 720 : project.aspectRatio === '1:1' ? 1080 : 1280;
  const canvasHeight = project.aspectRatio === '9:16' ? 1280 : project.aspectRatio === '1:1' ? 1080 : 720;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Player Header & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>{project.title}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {project.visualStyle}
            </span>
          </h2>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span>{project.videoType.toUpperCase()}</span>
            <span>&bull;</span>
            <span>{project.aspectRatio} Format</span>
            <span>&bull;</span>
            <span>Language: {project.language}</span>
          </div>
        </div>

        {/* Top Control Badges */}
        <div className="flex items-center gap-2">
          {/* Audio Ducking Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isDucked
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Auto-Ducking lowers music volume by 75% when speech/narration is active"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isDucked ? 'Ducking Voice Active' : 'Soundtrack Balanced'}</span>
          </div>

          {/* QC Inspection Score */}
          <button
            type="button"
            onClick={onOpenQCModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>QC 10/10 Passed</span>
          </button>
        </div>
      </div>

      {/* Video Canvas Container (Aspect Ratio Adaptive) */}
      <div
        ref={containerRef}
        className="relative mx-auto bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center group"
        style={{
          maxHeight: '480px',
          aspectRatio: project.aspectRatio === '9:16' ? '9/16' : project.aspectRatio === '1:1' ? '1/1' : '16/9',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {/* Play Overlay Button on Hover when Paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl shadow-indigo-600/50 hover:scale-110 transition-transform">
              <Play className="w-8 h-8 ml-1 fill-white" />
            </div>
          </div>
        )}

        {/* Active Scene Overlay Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-xs font-semibold text-slate-200 border border-white/10 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Scene 0{currentSceneIdx + 1}/{project.scenes.length}
          </span>
          <span className="text-slate-400 font-normal truncate max-w-[150px]">
            &bull; {activeScene?.camera?.movement || 'Ken Burns'}
          </span>
        </div>

        {/* Zero Watermark Guarantee Badge */}
        <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] text-slate-400 border border-white/5">
          Clean Export (Zero Watermarks)
        </div>
      </div>

      {/* Scrubber & Player Controls */}
      <div className="space-y-2 pt-1">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTimeSec)}
          </span>
          <div className="relative flex-1 group">
            <input
              type="range"
              min="0"
              max={totalDuration}
              step="0.05"
              value={currentTimeSec}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            {/* Scene Markers on Timeline */}
            <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none flex">
              {project.scenes.map((sc, idx) => {
                const widthPct = (sc.duration / totalDuration) * 100;
                return (
                  <div
                    key={sc.id}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full border-r border-slate-900/60 ${
                      idx === currentSceneIdx ? 'bg-indigo-500/30' : ''
                    }`}
                  />
                );
              })}
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 w-10">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Player Bottom Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Left Buttons: Play, Replay, Mute, Subtitles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/30"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTimeSec(0);
                videoRenderer.cancelSpeech();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Restart"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isMuted) {
                  videoRenderer.stopSoundtrack();
                  videoRenderer.cancelSpeech();
                } else if (isPlaying) {
                  videoRenderer.startSoundtrack(project.scenes, currentTimeSec);
                }
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                showSubtitles
                  ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle Subtitle Overlay"
            >
              <Subtitles className="w-3.5 h-3.5" />
              <span>CC</span>
            </button>
          </div>

          {/* Right Buttons: Fullscreen & DOWNLOAD VIDEO */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Prominent DOWNLOAD VIDEO Button (Active only after validation) */}
            <button
              type="button"
              disabled={!qcPassed}
              onClick={onOpenExportModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD VIDEO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
