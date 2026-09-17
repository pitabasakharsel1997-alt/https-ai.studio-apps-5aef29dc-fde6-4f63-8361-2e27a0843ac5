import { useState } from 'react';
import { X, Download, ShieldCheck, Film, Sparkles, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { videoRenderer } from '../services/videoRenderer';
import { SubtitleEngine } from '../../server/engines/subtitleEngine';
import type { VideoProject } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
}

export function ExportModal({ isOpen, onClose, project }: ExportModalProps) {
  if (!isOpen) return null;

  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState('');

  const subtitleEngine = new SubtitleEngine();

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressPercent(0);
    setProgressMessage('Initializing canvas renderer and media encoder...');
    setDownloadUrl(null);

    try {
      const blob = await videoRenderer.renderAndExportMP4(
        project.scenes,
        project.subtitles,
        project.aspectRatio,
        resolution,
        (currentFrame, totalFrames, percent, stage) => {
          setProgressPercent(percent);
          setProgressMessage(stage);
        }
      );

      const url = URL.createObjectURL(blob);
      const safeTitle = (project.title || 'ai-video')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      const filename = `${safeTitle}-${resolution}-${project.aspectRatio.replace(':', 'x')}.mp4`;

      setDownloadUrl(url);
      setDownloadFilename(filename);
      setProgressPercent(100);
      setProgressMessage('MP4 encoding complete! Video ready to save.');
    } catch (err: any) {
      console.error('Export error:', err);
      setProgressMessage('Encoding failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSRT = () => {
    const srtText = subtitleEngine.generateSRT(project.subtitles);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-subtitles.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Video</h2>
              <p className="text-xs text-slate-400">
                Pristine master video file with zero watermarks
              </p>
            </div>
          </div>

          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Resolution Options */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Master Resolution
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setResolution('1080p')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  resolution === '1080p'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">1080p Full HD</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {project.aspectRatio === '9:16' ? '1080 x 1920' : project.aspectRatio === '1:1' ? '1080 x 1080' : '1920 x 1080'} &bull; Crisp Master
                </div>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setResolution('720p')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  resolution === '720p'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-white">720p Fast Render</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {project.aspectRatio === '9:16' ? '720 x 1280' : project.aspectRatio === '1:1' ? '720 x 720' : '1280 x 720'} &bull; Smaller Size
                </div>
              </button>
            </div>
          </div>

          {/* Clean Quality & No Watermark Assurance */}
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Broadcast Quality Guarantee</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              &bull; <strong>NO Watermarks:</strong> Clean commercial release ready for YouTube, Instagram, or TikTok.<br />
              &bull; <strong>Clean Subtitles:</strong> Rendered in post-production with high contrast typography.<br />
              &bull; <strong>A/V Ducking:</strong> Soundtrack volume cleanly balanced against character voiceover.
            </p>
          </div>

          {/* Export Progress Bar */}
          {isExporting && (
            <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>{progressMessage}</span>
                </span>
                <span className="font-mono text-indigo-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Completed State */}
          {downloadUrl && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Video Render Complete!</h4>
                <p className="text-xs text-slate-300 mt-0.5">Click below to download your master file.</p>
              </div>
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>SAVE MP4 VIDEO ({resolution})</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadSRT}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download Subtitles (.SRT)</span>
          </button>

          {!downloadUrl ? (
            <button
              type="button"
              disabled={isExporting}
              onClick={handleStartExport}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase shadow-md transition-all flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ENCODING...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>START EXPORT</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
