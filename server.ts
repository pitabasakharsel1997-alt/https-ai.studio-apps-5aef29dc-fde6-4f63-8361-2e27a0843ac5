import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import { jobStore } from './server/jobStore.js';
import { ReferenceAnalysisEngine } from './server/engines/referenceAnalysisEngine.js';
import { StoryEngine } from './server/engines/storyEngine.js';
import { CharacterEngine } from './server/engines/characterEngine.js';
import { SceneEngine } from './server/engines/sceneEngine.js';
import { ImageEngine } from './server/engines/imageEngine.js';
import { VoiceEngine, MusicEngine, SFXEngine } from './server/engines/audioEngines.js';
import { SubtitleEngine } from './server/engines/subtitleEngine.js';
import { VideoQualityControlEngine } from './server/engines/qcEngine.js';
import { RenderEngine } from './server/engines/renderEngine.js';
import type { VideoProject, VideoType, VisualStyle, AspectRatio, SupportedLanguage, VoiceGender, VoiceEmotion } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Instantiate AI Engines
const referenceAnalysisEngine = new ReferenceAnalysisEngine();
const storyEngine = new StoryEngine();
const characterEngine = new CharacterEngine();
const sceneEngine = new SceneEngine();
const imageEngine = new ImageEngine();
const voiceEngine = new VoiceEngine();
const musicEngine = new MusicEngine();
const sfxEngine = new SFXEngine();
const subtitleEngine = new SubtitleEngine();
const qcEngine = new VideoQualityControlEngine();
const renderEngine = new RenderEngine();

// ==========================================
// 1. FAIR-USE QUOTA & HEALTH
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/quota', (req, res) => {
  res.json(jobStore.getQuota());
});

// ==========================================
// 2. REFERENCE ANALYSIS ENGINE
// ==========================================
app.post('/api/reference/analyze', async (req, res) => {
  try {
    const { type, value, fileName, userPrompt } = req.body;
    if (!value) {
      return res.status(400).json({ error: 'Value (URL, text, or file data) is required' });
    }

    const result = await referenceAnalysisEngine.analyze({
      type: type || 'text',
      value,
      fileName,
      userPrompt,
    });

    res.json(result);
  } catch (err: any) {
    console.error('API /api/reference/analyze error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// ==========================================
// 3. STORY / SCRIPT GENERATION
// ==========================================
app.post('/api/story/generate', async (req, res) => {
  try {
    const { prompt, videoType, visualStyle, language, blueprint } = req.body;
    const story = await storyEngine.generateStory({
      prompt: prompt || 'An inspirational journey',
      videoType: videoType || 'cinematic',
      visualStyle: visualStyle || 'cinematic-realistic',
      language: language || 'English',
      blueprint,
    });
    res.json(story);
  } catch (err: any) {
    console.error('API /api/story/generate error:', err);
    res.status(500).json({ error: err.message || 'Story generation failed' });
  }
});

// ==========================================
// 4. CHARACTER BIBLE GENERATION
// ==========================================
app.post('/api/characters/generate', async (req, res) => {
  try {
    const { projectId, storyPrompt, scriptOutline, visualStyle, language } = req.body;
    const bible = await characterEngine.generateCharacterBible({
      projectId: projectId || `proj-${Date.now()}`,
      storyPrompt: storyPrompt || 'Inspiring narrative',
      scriptOutline: scriptOutline || [],
      visualStyle: visualStyle || 'cinematic-realistic',
      language: language || 'English',
    });
    res.json(bible);
  } catch (err: any) {
    console.error('API /api/characters/generate error:', err);
    res.status(500).json({ error: err.message || 'Character generation failed' });
  }
});

// ==========================================
// 5. SCENE ENGINE
// ==========================================
app.post('/api/scenes/generate', async (req, res) => {
  try {
    const { scriptOutline, characterBible, styleBlueprint, visualStyle } = req.body;
    const scenes = await sceneEngine.planScenes({
      scriptOutline: scriptOutline || [],
      characterBible,
      styleBlueprint,
      visualStyle: visualStyle || 'cinematic-realistic',
    });
    res.json(scenes);
  } catch (err: any) {
    console.error('API /api/scenes/generate error:', err);
    res.status(500).json({ error: err.message || 'Scene planning failed' });
  }
});

// ==========================================
// 6. IMAGE ENGINE (Strictly NO unwanted text)
// ==========================================
app.post('/api/images/generate', async (req, res) => {
  try {
    const { sceneId, visualPrompt, visualStyle, aspectRatio, location, characterBible } = req.body;
    const imageUrl = await imageEngine.generateSceneImage({
      sceneId: sceneId || 'scene-temp',
      visualPrompt: visualPrompt || 'Cinematic landscape, volumetric golden lighting',
      visualStyle: visualStyle || 'cinematic-realistic',
      aspectRatio: aspectRatio || '16:9',
      location: location || 'Open atmosphere',
      characterBible,
    });
    res.json({ imageUrl });
  } catch (err: any) {
    console.error('API /api/images/generate error:', err);
    res.status(500).json({ error: err.message || 'Image generation failed' });
  }
});

// ==========================================
// 7. VIDEO ENGINE (Animation / Clip synthesis)
// ==========================================
app.post('/api/video/generate', async (req, res) => {
  try {
    const { sceneId, animationPrompt, cameraMovement, imageUrl } = req.body;
    res.json({
      sceneId,
      status: 'READY',
      motionProfile: {
        cameraMovement: cameraMovement || 'zoom-in',
        animationPrompt: animationPrompt || 'Gentle organic motion with dynamic depth',
        durationSec: 4.5,
      },
      clipUrl: imageUrl,
    });
  } catch (err: any) {
    console.error('API /api/video/generate error:', err);
    res.status(500).json({ error: err.message || 'Video generation failed' });
  }
});

// ==========================================
// 8. VOICE ENGINE
// ==========================================
app.post('/api/voice/generate', async (req, res) => {
  try {
    const { text, language, gender, emotion, speed, pitch, voiceName } = req.body;
    const result = await voiceEngine.synthesizeVoice({
      text: text || '',
      language: language || 'English',
      gender: gender || 'male',
      emotion: emotion || 'motivational',
      speed: speed || 1.0,
      pitch: pitch || 1.0,
      voiceName,
    });
    res.json(result);
  } catch (err: any) {
    console.error('API /api/voice/generate error:', err);
    res.status(500).json({ error: err.message || 'Voice generation failed' });
  }
});

// ==========================================
// 9. AUDIO ENGINE (Music & SFX)
// ==========================================
app.post('/api/audio/generate', async (req, res) => {
  try {
    const { scenes, mood } = req.body;
    const musicPlan = musicEngine.planSoundtrack(scenes || [], mood);
    const sfxPlan = sfxEngine.planSFX(scenes || []);
    res.json({ musicPlan, sfxPlan });
  } catch (err: any) {
    console.error('API /api/audio/generate error:', err);
    res.status(500).json({ error: err.message || 'Audio generation failed' });
  }
});

// ==========================================
// 10. PROJECTS CRUD & CREATION PIPELINE
// ==========================================
app.get('/api/projects', (req, res) => {
  res.json(jobStore.getAllProjects());
});

app.get('/api/projects/:id', (req, res) => {
  const project = jobStore.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

app.post('/api/projects', async (req, res) => {
  try {
    const {
      title,
      ideaPrompt,
      mode,
      videoType,
      visualStyle,
      aspectRatio,
      language,
      musicMood,
      narratorVoice,
      blueprint,
    } = req.body;

    const projectId = `proj-${Date.now()}`;
    const project: VideoProject = {
      id: projectId,
      title: title || 'Original AI Video',
      ideaPrompt: ideaPrompt || 'A cinematic inspirational story',
      mode: mode || 'auto',
      videoType: (videoType as VideoType) || 'cinematic',
      visualStyle: (visualStyle as VisualStyle) || 'cinematic-realistic',
      aspectRatio: (aspectRatio as AspectRatio) || '16:9',
      language: (language as SupportedLanguage) || 'English',
      musicMood: musicMood || 'Inspirational & Cinematic',
      narratorVoice: narratorVoice || {
        gender: 'male',
        speed: 1.0,
        pitch: 1.0,
        emotion: 'motivational',
        voiceName: 'Warm Lead Narrator',
      },
      styleBlueprint: blueprint || {
        genre: videoType || 'Cinematic Storytelling',
        visualStyle: visualStyle || 'cinematic-realistic',
        visualDescription: 'Rich cinematic depth with volumetric atmospheric lighting',
        lightingStyle: 'High contrast key with amber rim light',
        cameraLanguage: {
          movements: ['Slow push-in', 'Medium tracking', 'Wide aerial'],
          shotTypes: ['Wide shot', 'Medium close-up', 'Hero angle'],
          composition: 'Balanced rule of thirds with generous negative space',
        },
        pacing: {
          opening: 'Hook within 3s',
          middle: 'Rhythmic story escalation',
          ending: 'Inspiring crescendo',
          overallBpm: 96,
        },
        colorMood: 'Rich teal and gold cinematic warmth',
        transitionStyle: 'Smooth cross-dissolves and match cuts',
        storyStructure: '3-act narrative progression',
        narrationStructure: 'Measured cadence, impactful pauses',
        editingRhythm: '3.5 - 5s dynamic scene timing',
        environmentCharacteristics: 'Layered atmospheric depth with subtle particles',
        recommendedDurationSec: 24,
        aspectRatio: aspectRatio || '16:9',
        isOriginalSynthesis: true,
      },
      characterBible: {
        projectId,
        characters: [],
        visualConsistencyRule: 'Enforce uniform facial geometry and signature clothing palette',
        negativePromptRules: ['text, letters, words, logo, watermark, fake subtitles'],
      },
      scenes: [],
      subtitles: [],
      totalDuration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    jobStore.saveProject(project);
    res.status(201).json(project);
  } catch (err: any) {
    console.error('API /api/projects error:', err);
    res.status(500).json({ error: err.message || 'Project creation failed' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const deleted = jobStore.deleteProject(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Project not found' });
  res.json({ success: true, message: 'Project deleted' });
});

// Update project scenes/subtitles after interactive editing
app.put('/api/projects/:id', (req, res) => {
  const existing = jobStore.getProject(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const updated: VideoProject = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  jobStore.saveProject(updated);
  res.json(updated);
});

// ==========================================
// 11. RENDER & ASYNC JOB PIPELINE
// ==========================================
app.post('/api/render', async (req, res) => {
  try {
    const { projectId } = req.body;
    let project = jobStore.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Fair-use quota verification
    const quota = jobStore.getQuota();
    if (quota.dailyQuotaRemaining <= 0) {
      return res.status(429).json({
        error: 'Daily generation quota reached. Quota resets at ' + quota.resetAt,
      });
    }

    // Decrement quota and create job
    jobStore.decrementQuota();
    const job = jobStore.createJob(project.id);
    project.currentJobId = job.id;
    jobStore.saveProject(project);

    // Launch asynchronous worker execution (non-blocking)
    renderEngine.executePipeline(job.id, project).catch((err) => {
      console.error(`Background job ${job.id} failed:`, err);
    });

    res.status(202).json({
      jobId: job.id,
      state: job.state,
      message: 'Video pipeline dispatched to background worker queue',
    });
  } catch (err: any) {
    console.error('API /api/render error:', err);
    res.status(500).json({ error: err.message || 'Render request failed' });
  }
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobStore.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// ==========================================
// 12. SCENE RETRY & REGENERATION (Automatic Editor)
// ==========================================
app.post('/api/scenes/:id/retry', async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = jobStore.getProject(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const sceneIdx = project.scenes.findIndex(s => s.id === req.params.id);
    if (sceneIdx === -1) return res.status(404).json({ error: 'Scene not found' });

    project.scenes[sceneIdx] = qcEngine.retryScene(project.scenes[sceneIdx]);
    const newVisual = await imageEngine.generateSceneImage({
      sceneId: project.scenes[sceneIdx].id,
      visualPrompt: project.scenes[sceneIdx].visualPrompt,
      visualStyle: project.visualStyle,
      aspectRatio: project.aspectRatio,
      location: project.scenes[sceneIdx].location,
      characterBible: project.characterBible,
    });
    project.scenes[sceneIdx].imageUrl = newVisual;
    jobStore.saveProject(project);

    res.json({ success: true, scene: project.scenes[sceneIdx] });
  } catch (err: any) {
    console.error('API /api/scenes/:id/retry error:', err);
    res.status(500).json({ error: err.message || 'Scene retry failed' });
  }
});

app.post('/api/scenes/:id/regenerate', async (req, res) => {
  try {
    const { projectId, promptOverride, durationOverride } = req.body;
    const project = jobStore.getProject(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const sceneIdx = project.scenes.findIndex(s => s.id === req.params.id);
    if (sceneIdx === -1) return res.status(404).json({ error: 'Scene not found' });

    const targetScene = project.scenes[sceneIdx];
    if (promptOverride) targetScene.visualPrompt = promptOverride;
    if (durationOverride) targetScene.duration = Number(durationOverride);

    const newVisual = await imageEngine.generateSceneImage({
      sceneId: targetScene.id,
      visualPrompt: targetScene.visualPrompt,
      visualStyle: project.visualStyle,
      aspectRatio: project.aspectRatio,
      location: targetScene.location,
      characterBible: project.characterBible,
    });
    targetScene.imageUrl = newVisual;
    targetScene.status = 'READY';

    // Refresh subtitles
    project.subtitles = subtitleEngine.generateSubtitles(project.scenes);
    project.totalDuration = project.scenes.reduce((acc, s) => acc + s.duration, 0);

    jobStore.saveProject(project);
    res.json({ success: true, scene: targetScene, subtitles: project.subtitles });
  } catch (err: any) {
    console.error('API /api/scenes/:id/regenerate error:', err);
    res.status(500).json({ error: err.message || 'Scene regeneration failed' });
  }
});

// ==========================================
// 13. VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Video Generator Server running at http://localhost:${PORT}`);
  });
}

startServer();
