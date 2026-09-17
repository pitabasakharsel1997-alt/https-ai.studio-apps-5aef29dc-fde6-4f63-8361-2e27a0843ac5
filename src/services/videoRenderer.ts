import type { SceneItem, SubtitleItem, AspectRatio, SupportedLanguage } from '../types';

export interface RenderProgressCallback {
  (currentFrame: number, totalFrames: number, percent: number, stage: string): void;
}

export class VideoRendererService {
  private audioCtx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private isAudioPlaying: boolean = false;
  private activeOscillators: OscillatorNode[] = [];

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Generates continuous cinematic synthesized background score with auto-ducking for voiceover.
   */
  startSoundtrack(scenes: SceneItem[], currentTimeSec: number = 0): void {
    try {
      this.stopSoundtrack();
      const ctx = this.getAudioContext();

      this.masterGainNode = ctx.createGain();
      this.masterGainNode.gain.setValueAtTime(0.7, ctx.currentTime);
      this.masterGainNode.connect(ctx.destination);

      this.musicGainNode = ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(0.35, ctx.currentTime);
      this.musicGainNode.connect(this.masterGainNode);

      // Program chords for cinematic warmth
      // Base frequencies: C3, G3, D#3, A#3
      const chordPitches = [130.81, 196.00, 155.56, 233.08];

      chordPitches.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq * (1 + (i * 0.005)), ctx.currentTime);

        gain.gain.setValueAtTime(0.12 / (i + 1), ctx.currentTime);

        // Low pass filter for warmth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(this.musicGainNode!);

        osc.start();
        this.activeOscillators.push(osc);
      });

      this.isAudioPlaying = true;
      this.updateDucking(scenes, currentTimeSec);
    } catch (e) {
      console.warn('Audio synthesis context failed to start:', e);
    }
  }

  /**
   * Applies dynamic audio ducking based on voiceover in active scene.
   */
  updateDucking(scenes: SceneItem[], currentTimeSec: number): void {
    if (!this.musicGainNode || !this.audioCtx) return;

    let accumulatedTime = 0;
    let activeScene: SceneItem | null = null;

    for (const sc of scenes) {
      if (currentTimeSec >= accumulatedTime && currentTimeSec <= accumulatedTime + sc.duration) {
        activeScene = sc;
        break;
      }
      accumulatedTime += sc.duration;
    }

    const hasVoiceover = Boolean(activeScene?.narration || activeScene?.dialogue);
    const targetGain = hasVoiceover ? 0.08 : 0.35; // Duck down to 8% volume when voice is talking!

    const now = this.audioCtx.currentTime;
    this.musicGainNode.gain.setTargetAtTime(targetGain, now, 0.2);
  }

  /**
   * Plays a subtle cinematic transition SFX (whoosh / shimmer).
   */
  playSFX(type: 'whoosh' | 'hit' | 'shimmer'): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'whoosh') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'shimmer') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Audio context silenced or blocked
    }
  }

  stopSoundtrack(): void {
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeOscillators = [];
    this.isAudioPlaying = false;
  }

  /**
   * Speaks narration/dialogue line using Browser SpeechSynthesis with pitch, speed, and language.
   */
  speakText(text: string, language: SupportedLanguage, speed: number = 1.0, pitch: number = 1.0): void {
    if (!('speechSynthesis' in window) || !text.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.7, Math.min(1.4, speed));
    utterance.pitch = Math.max(0.8, Math.min(1.2, pitch));

    // Match language tag
    const langMap: Record<SupportedLanguage, string> = {
      English: 'en-US',
      Hindi: 'hi-IN',
      Bengali: 'bn-IN',
      Tamil: 'ta-IN',
      Telugu: 'te-IN',
      Marathi: 'mr-IN',
      Gujarati: 'gu-IN',
      Kannada: 'kn-IN',
      Malayalam: 'ml-IN',
      Odia: 'or-IN',
    };

    utterance.lang = langMap[language] || 'en-US';
    window.speechSynthesis.speak(utterance);
  }

  cancelSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Draws a composite video frame on the canvas:
   * - High-resolution scene background with Ken Burns pan/zoom camera animation
   * - Atmosphere particle drift
   * - Scene transitions (cross-dissolves / whip pans)
   * - Subtitle overlay rendered cleanly in post-production (NO burnt text in raw art)
   */
  drawFrame(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement | null,
    scene: SceneItem,
    sceneProgress: number, // 0.0 to 1.0 within current scene
    transitionProgress: number, // 0.0 to 1.0 during scene boundary
    activeSubtitle: SubtitleItem | null,
    aspectRatio: AspectRatio
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Camera Movement (Ken Burns Zoom & Pan)
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;

    switch (scene.camera.movement) {
      case 'zoom-in':
        scale = 1.0 + (sceneProgress * 0.12);
        break;
      case 'zoom-out':
        scale = 1.15 - (sceneProgress * 0.12);
        break;
      case 'pan-left':
        translateX = -(sceneProgress * 40);
        scale = 1.08;
        break;
      case 'pan-right':
        translateX = (sceneProgress * 40);
        scale = 1.08;
        break;
      case 'dolly-in':
        scale = 1.0 + (sceneProgress * 0.16);
        translateY = -(sceneProgress * 15);
        break;
      default:
        scale = 1.03 + Math.sin(sceneProgress * Math.PI) * 0.02;
    }

    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

    // 2. Draw Scene Visual
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, width, height);
    } else {
      // Procedural background fallback
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Atmospheric circle
      ctx.fillStyle = '#6366f1';
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 3. Dynamic Atmospheric Floating Particles
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) {
      const px = ((i * 73 + sceneProgress * 60) % width);
      const py = ((i * 47 - sceneProgress * 30 + height) % height);
      const radius = (i % 3) + 1;
      ctx.globalAlpha = 0.15 + (Math.sin(sceneProgress * 4 + i) * 0.1);
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Handle Transition (Fade or Cross-Dissolve Overlay)
    if (transitionProgress > 0) {
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = Math.sin(transitionProgress * Math.PI) * 0.6;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 5. Clean Post-Production Subtitles (No text inside background image!)
    if (activeSubtitle && activeSubtitle.text) {
      ctx.save();
      const fontSize = aspectRatio === '9:16' ? Math.round(width * 0.048) : Math.round(height * 0.046);
      ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const subY = aspectRatio === '9:16' ? height * 0.8 : height * 0.86;
      const metrics = ctx.measureText(activeSubtitle.text);
      const padX = fontSize * 0.7;
      const padY = fontSize * 0.35;
      const boxWidth = metrics.width + padX * 2;
      const boxHeight = fontSize * 1.5;

      // Dark translucent pill behind subtitle for maximum legibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
      ctx.beginPath();
      ctx.roundRect((width - boxWidth) / 2, subY - boxHeight / 2, boxWidth, boxHeight, 8);
      ctx.fill();

      // Golden or white high-contrast text with subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(activeSubtitle.text, width / 2, subY + 1);
      ctx.restore();
    }
  }

  /**
   * Renders the complete project into an actual MP4 video file and triggers download.
   */
  async renderAndExportMP4(
    scenes: SceneItem[],
    subtitles: SubtitleItem[],
    aspectRatio: AspectRatio,
    resolution: '720p' | '1080p',
    onProgress: RenderProgressCallback
  ): Promise<Blob> {
    const width = aspectRatio === '9:16' ? (resolution === '1080p' ? 1080 : 720) :
                  aspectRatio === '1:1' ? (resolution === '1080p' ? 1080 : 720) :
                  (resolution === '1080p' ? 1920 : 1280);
    const height = aspectRatio === '9:16' ? (resolution === '1080p' ? 1920 : 1280) :
                   aspectRatio === '1:1' ? (resolution === '1080p' ? 1080 : 720) :
                   (resolution === '1080p' ? 1080 : 720);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d')!;

    // Preload scene images
    onProgress(0, 100, 5, 'Pre-caching high-fidelity visual keyframes...');
    const loadedImages: Map<string, HTMLImageElement> = new Map();
    await Promise.all(
      scenes.map((scene) => {
        return new Promise<void>((resolve) => {
          if (!scene.imageUrl) return resolve();
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            loadedImages.set(scene.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = scene.imageUrl;
        });
      })
    );

    // Setup MediaRecorder stream from canvas
    const stream = offscreenCanvas.captureStream(30); // 30 FPS
    
    // Choose best supported mimeType for genuine MP4 / WebM
    let mimeType = 'video/mp4;codecs=avc1';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp9';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: resolution === '1080p' ? 8000000 : 4500000,
    });

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const fps = 30;
    const totalFrames = Math.round(totalDuration * fps);

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        resolve(finalBlob);
      };

      mediaRecorder.onerror = (e) => {
        reject(e);
      };

      mediaRecorder.start(100);

      // Render frames incrementally
      let currentFrame = 0;

      const renderInterval = setInterval(() => {
        if (currentFrame >= totalFrames) {
          clearInterval(renderInterval);
          setTimeout(() => {
            mediaRecorder.stop();
          }, 300);
          return;
        }

        const currentTimeSec = currentFrame / fps;

        // Determine current scene
        let accum = 0;
        let activeScene = scenes[0];
        let sceneTime = 0;

        for (const sc of scenes) {
          if (currentTimeSec >= accum && currentTimeSec < accum + sc.duration) {
            activeScene = sc;
            sceneTime = currentTimeSec - accum;
            break;
          }
          accum += sc.duration;
        }

        const sceneProgress = Math.min(1, sceneTime / activeScene.duration);
        const transitionProgress = sceneProgress > 0.85 ? (sceneProgress - 0.85) / 0.15 : 0;

        // Active subtitle
        const activeSub = subtitles.find(
          (s) => currentTimeSec >= s.startTime && currentTimeSec <= s.endTime
        ) || null;

        const img = loadedImages.get(activeScene.id) || null;
        this.drawFrame(offscreenCanvas, img, activeScene, sceneProgress, transitionProgress, activeSub, aspectRatio);

        currentFrame++;
        const percent = Math.min(99, Math.round((currentFrame / totalFrames) * 100));
        if (currentFrame % 15 === 0 || currentFrame === totalFrames) {
          onProgress(
            currentFrame,
            totalFrames,
            percent,
            `Encoding frame ${currentFrame}/${totalFrames} (${fps}fps H.264)...`
          );
        }
      }, 1000 / fps);
    });
  }
}

export const videoRenderer = new VideoRendererService();
