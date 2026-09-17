import { useState } from 'react';
import {
  Film,
  Sparkles,
  Camera,
  Clock,
  Volume2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Edit3,
  Check,
  X,
  Layers,
  Eye,
} from 'lucide-react';
import type { SceneItem, VideoProject, CameraMovement, SceneTransition } from '../types';

interface TimelineEditorProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onUpdateScene: (sceneId: string, updates: Partial<SceneItem>) => void;
  onRegenerateScene: (sceneId: string, promptOverride?: string) => Promise<void>;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
  onMoveScene: (index: number, direction: 'left' | 'right') => void;
}

export function TimelineEditor({
  project,
  activeSceneIndex,
  onSelectScene,
  onUpdateScene,
  onRegenerateScene,
  onAddScene,
  onDeleteScene,
  onMoveScene,
}: TimelineEditorProps) {
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editNarration, setEditNarration] = useState('');
  const [editDuration, setEditDuration] = useState<number>(4);
  const [isRegeneratingId, setIsRegeneratingId] = useState<string | null>(null);

  const startEdit = (scene: SceneItem) => {
    setEditingSceneId(scene.id);
    setEditPrompt(scene.visualPrompt);
    setEditNarration(scene.narration || scene.dialogue || '');
    setEditDuration(scene.duration);
  };

  const saveEdit = (sceneId: string) => {
    onUpdateScene(sceneId, {
      visualPrompt: editPrompt,
      narration: editNarration,
      duration: editDuration,
    });
    setEditingSceneId(null);
  };

  const handleRegenerate = async (sceneId: string) => {
    setIsRegeneratingId(sceneId);
    try {
      await onRegenerateScene(sceneId, editPrompt || undefined);
    } finally {
      setIsRegeneratingId(null);
    }
  };

  const cameraOptions: CameraMovement[] = [
    'zoom-in',
    'zoom-out',
    'pan-left',
    'pan-right',
    'dolly-in',
    'pedestal-up',
    'orbit',
    'static',
  ];

  const transitionOptions: SceneTransition[] = [
    'cross-dissolve',
    'cut',
    'fade-to-black',
    'whip-pan',
    'zoom-transition',
    'match-cut',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-sm text-white">
            Scene-by-Scene Timeline &amp; Director Editor
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
            {project.scenes.length} Scenes &bull; Total {project.scenes.reduce((s, c) => s + c.duration, 0).toFixed(1)}s
          </span>
        </div>

        <button
          type="button"
          onClick={onAddScene}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Scene Beat</span>
        </button>
      </div>

      {/* Horizontal Scrollable Scene Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
        {project.scenes.map((scene, idx) => {
          const isSelected = idx === activeSceneIndex;
          const isEditing = editingSceneId === scene.id;
          const isBusy = isRegeneratingId === scene.id;

          return (
            <div
              key={scene.id}
              className={`shrink-0 w-72 rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'bg-slate-950 border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Scene Card Header */}
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/80 text-white text-[10px] font-extrabold flex items-center justify-center">
                    0{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[110px]">
                    {scene.location || `Scene ${idx + 1}`}
                  </span>
                </div>

                {/* Move & Delete Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveScene(idx, 'left')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded"
                    title="Move Left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === project.scenes.length - 1}
                    onClick={() => onMoveScene(idx, 'right')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded"
                    title="Move Right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteScene(scene.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Visual Thumbnail Area */}
              <div
                className="relative aspect-video bg-black overflow-hidden cursor-pointer group"
                onClick={() => onSelectScene(idx)}
              >
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={`Scene ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 text-xs">
                    Rendering Visual...
                  </div>
                )}

                {/* Floating Preview Select Badge */}
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/20 flex items-center justify-center transition-colors">
                  <span className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-black/80 rounded text-[10px] font-semibold text-white transition-opacity">
                    Preview Frame
                  </span>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-mono text-slate-300">
                  {scene.duration.toFixed(1)}s
                </div>
              </div>

              {/* Scene Content & Edit Area */}
              <div className="p-3 space-y-2.5 text-xs flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                        Visual Prompt
                      </label>
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        rows={2}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                        Narration / Dialogue
                      </label>
                      <textarea
                        value={editNarration}
                        onChange={(e) => setEditNarration(e.target.value)}
                        rows={2}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white resize-none"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Duration:</span>
                        <span className="font-bold text-white">{editDuration.toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="2.5"
                        max="10"
                        step="0.5"
                        value={editDuration}
                        onChange={(e) => setEditDuration(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => saveEdit(scene.id)}
                        className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[11px] flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSceneId(null)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Narration Preview */}
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 mb-0.5">
                        <Volume2 className="w-3 h-3" />
                        <span>Narration</span>
                      </div>
                      <p className="text-slate-300 line-clamp-2 text-[11px] italic">
                        "{scene.narration || scene.dialogue || 'Instrumental beat'}"
                      </p>
                    </div>

                    {/* Camera & Transition Selectors */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Camera Move</label>
                        <select
                          value={scene.camera.movement}
                          onChange={(e) =>
                            onUpdateScene(scene.id, {
                              camera: { ...scene.camera, movement: e.target.value as CameraMovement },
                            })
                          }
                          className="w-full p-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-200"
                        >
                          {cameraOptions.map((cam) => (
                            <option key={cam} value={cam}>
                              {cam}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Transition</label>
                        <select
                          value={scene.transition}
                          onChange={(e) =>
                            onUpdateScene(scene.id, { transition: e.target.value as SceneTransition })
                          }
                          className="w-full p-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-200"
                        >
                          {transitionOptions.map((tr) => (
                            <option key={tr} value={tr}>
                              {tr}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="p-2.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(scene)}
                  className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Script</span>
                </button>

                {/* Regenerate Single Scene Isolated Retry */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleRegenerate(scene.id)}
                  className="py-1 px-2.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Regenerate this scene's visual without altering the rest of the video"
                >
                  <RefreshCw className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
                  <span>{isBusy ? 'Regen...' : 'Regen Scene'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
