import { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { VideoCreator } from './components/VideoCreator';
import { PipelineProgress } from './components/PipelineProgress';
import { VideoPlayer } from './components/VideoPlayer';
import { TimelineEditor } from './components/TimelineEditor';
import { CharacterBibleModal } from './components/CharacterBibleModal';
import { QualityControlModal } from './components/QualityControlModal';
import { ExportModal } from './components/ExportModal';

import type {
  VideoProject,
  GenerationJob,
  UserFairUseQuota,
  SceneItem,
  StyleBlueprint,
  VideoType,
  VisualStyle,
  AspectRatio,
  SupportedLanguage,
  VoiceGender,
  VoiceEmotion,
} from './types';

export function App() {
  const [project, setProject] = useState<VideoProject | null>(null);
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [quota, setQuota] = useState<UserFairUseQuota | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);

  // Modals
  const [isCharacterBibleOpen, setIsCharacterBibleOpen] = useState(false);
  const [isQCOpen, setIsQCOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch quota & initial project
  useEffect(() => {
    fetch('/api/quota')
      .then((res) => res.json())
      .then((data) => setQuota(data))
      .catch((err) => console.warn('Failed to load quota:', err));

    fetch('/api/projects')
      .then((res) => res.json())
      .then((projects: VideoProject[]) => {
        if (projects && projects.length > 0) {
          setProject(projects[0]);
        } else {
          // Initialize sample project
          createInitialSampleProject();
        }
      })
      .catch(() => {
        createInitialSampleProject();
      });
  }, []);

  const createInitialSampleProject = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'The Stargazer of Nubia',
          ideaPrompt: 'An adventurous young astronomer who discovers a whispering constellation that guides her across ancient desert observatories',
          mode: 'auto',
          videoType: 'cinematic',
          visualStyle: 'cinematic-realistic',
          aspectRatio: '16:9',
          language: 'English',
        }),
      });
      const newProj = await res.json();
      setProject(newProj);
      // Auto-trigger initial render
      handleStartRender(newProj.id);
    } catch (e) {
      console.warn('Initial project bootstrap error:', e);
    }
  };

  // Poll for background job updates
  useEffect(() => {
    if (!currentJob || currentJob.state === 'COMPLETED' || currentJob.state === 'FAILED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${currentJob.id}`);
        if (!res.ok) return;
        const updatedJob: GenerationJob = await res.json();
        setCurrentJob(updatedJob);

        if (updatedJob.state === 'COMPLETED') {
          setIsGenerating(false);
          // Refresh project
          const pRes = await fetch(`/api/projects/${updatedJob.projectId}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            setProject(pData);
          }
          // Refresh quota
          fetch('/api/quota').then((r) => r.json()).then(setQuota);
        } else if (updatedJob.state === 'FAILED') {
          setIsGenerating(false);
        }
      } catch (err) {
        console.warn('Error polling job:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [currentJob]);

  const handleStartRender = async (projectId: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Render initiation failed');
        setIsGenerating(false);
        return;
      }
      const data = await res.json();
      setCurrentJob({
        id: data.jobId,
        projectId,
        state: data.state || 'QUEUED',
        progressPercent: 5,
        currentStepMessage: 'Allocated to worker queue...',
        logs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Failed to trigger render:', err);
      setIsGenerating(false);
    }
  };

  const handleCreateVideo = async (params: {
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
  }) => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const newProj: VideoProject = await res.json();
      setProject(newProj);
      await handleStartRender(newProj.id);
    } catch (e: any) {
      console.error('Create video error:', e);
      setIsGenerating(false);
    }
  };

  const handleAnalyzeReference = async (
    type: 'url' | 'upload' | 'text',
    value: string
  ): Promise<StyleBlueprint | null> => {
    const res = await fetch('/api/reference/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze reference URL');
    }
    return res.json();
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<SceneItem>) => {
    if (!project) return;
    const updatedScenes = project.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s));
    const updatedProject = {
      ...project,
      scenes: updatedScenes,
      totalDuration: updatedScenes.reduce((acc, s) => acc + s.duration, 0),
    };
    setProject(updatedProject);
    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    });
  };

  const handleRegenerateScene = async (sceneId: string, promptOverride?: string) => {
    if (!project) return;
    try {
      const res = await fetch(`/api/scenes/${sceneId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          promptOverride,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedScenes = project.scenes.map((s) => (s.id === sceneId ? data.scene : s));
        setProject({ ...project, scenes: updatedScenes, subtitles: data.subtitles || project.subtitles });
      }
    } catch (e) {
      console.error('Failed to regenerate scene:', e);
    }
  };

  const handleAddScene = () => {
    if (!project) return;
    const newIdx = project.scenes.length + 1;
    const newScene: SceneItem = {
      id: `scene-${Date.now()}`,
      order: newIdx,
      location: 'Atmospheric Setting',
      visualPrompt: 'A breathtaking cinematic environment bathed in dynamic golden volumetric light, strictly no text',
      narration: 'And in that moment of discovery, the world opened anew.',
      dialogue: '',
      characterAction: 'Contemplating horizon',
      expression: 'Inspired wonder',
      environment: 'Expansive natural panorama',
      animationPrompt: 'Gentle particle drift with volumetric illumination',
      duration: 4.5,
      camera: {
        shot: 'Hero angle',
        movement: 'zoom-in',
        focalLength: '50mm',
      },
      lighting: 'Volumetric golden hour glow',
      sfx: {
        type: 'Atmospheric Swell',
        timingSec: 0.5,
        volume: 0.4,
      },
      musicState: {
        duckingActive: true,
        intensity: 'medium',
        themeMood: project.musicMood || 'Inspirational',
      },
      status: 'READY',
      retryCount: 0,
      charactersPresent: project.characterBible?.characters.map((c) => c.name) || [],
      transition: 'cross-dissolve',
    };

    const updatedScenes = [...project.scenes, newScene];
    const updatedProject = {
      ...project,
      scenes: updatedScenes,
      totalDuration: updatedScenes.reduce((acc, s) => acc + s.duration, 0),
    };
    setProject(updatedProject);
    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    });
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!project || project.scenes.length <= 1) return;
    const updatedScenes = project.scenes.filter((s) => s.id !== sceneId);
    const updatedProject = {
      ...project,
      scenes: updatedScenes,
      totalDuration: updatedScenes.reduce((acc, s) => acc + s.duration, 0),
    };
    setProject(updatedProject);
    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    });
  };

  const handleMoveScene = (index: number, direction: 'left' | 'right') => {
    if (!project) return;
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= project.scenes.length) return;

    const list = [...project.scenes];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const updatedProject = { ...project, scenes: list };
    setProject(updatedProject);
    fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        quota={quota}
        onOpenCharacterBible={() => setIsCharacterBibleOpen(true)}
        onOpenQCModal={() => setIsQCOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Creator Studio Card */}
        <VideoCreator
          isGenerating={isGenerating}
          onCreateVideo={handleCreateVideo}
          onAnalyzeReference={handleAnalyzeReference}
        />

        {/* Real-time Job Progress Indicator */}
        {currentJob && currentJob.state !== 'COMPLETED' && (
          <PipelineProgress
            job={currentJob}
            onRetry={() => project && handleStartRender(project.id)}
          />
        )}

        {/* Video Player & Editor (When project scenes are loaded) */}
        {project && project.scenes.length > 0 && (
          <div className="space-y-6">
            <VideoPlayer
              project={project}
              activeSceneIndex={activeSceneIndex}
              onSceneSelect={setActiveSceneIndex}
              onOpenExportModal={() => setIsExportOpen(true)}
              onOpenQCModal={() => setIsQCOpen(true)}
            />

            <TimelineEditor
              project={project}
              activeSceneIndex={activeSceneIndex}
              onSelectScene={setActiveSceneIndex}
              onUpdateScene={handleUpdateScene}
              onRegenerateScene={handleRegenerateScene}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
              onMoveScene={handleMoveScene}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Video Studio &bull; Micro-Engine Pipeline Architecture</span>
          <span className="text-slate-600">
            Compliant Reference Analysis &bull; Zero Copyright Duplication &bull; Clean H.264 Export
          </span>
        </div>
      </footer>

      {/* Modals */}
      {project && (
        <>
          <CharacterBibleModal
            isOpen={isCharacterBibleOpen}
            onClose={() => setIsCharacterBibleOpen(false)}
            bible={project.characterBible}
            onUpdateBible={(updated) => {
              setProject({ ...project, characterBible: updated });
              fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...project, characterBible: updated }),
              });
            }}
          />

          <QualityControlModal
            isOpen={isQCOpen}
            onClose={() => setIsQCOpen(false)}
            qcResult={currentJob?.qcResult || null}
          />

          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            project={project}
          />
        </>
      )}
    </div>
  );
}

export default App;
