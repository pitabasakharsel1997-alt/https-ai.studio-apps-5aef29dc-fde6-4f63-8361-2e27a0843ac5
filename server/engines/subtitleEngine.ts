import type { SceneItem, SubtitleItem } from '../../src/types.js';

export class SubtitleEngine {
  generateSubtitles(scenes: SceneItem[]): SubtitleItem[] {
    const subtitles: SubtitleItem[] = [];
    let currentTime = 0;

    scenes.forEach((scene) => {
      const textToSpeak = (scene.narration || scene.dialogue || '').trim();
      if (textToSpeak) {
        // Split long sentences into readable 4-8 word chunks if necessary
        const words = textToSpeak.split(/\s+/);
        if (words.length <= 9) {
          subtitles.push({
            id: `sub-${scene.id}-1`,
            sceneId: scene.id,
            startTime: currentTime + 0.3,
            endTime: currentTime + scene.duration - 0.3,
            text: textToSpeak,
            speaker: scene.dialogue ? (scene.charactersPresent[0] || 'Character') : 'Narrator',
          });
        } else {
          // Split into two timed cards
          const midpoint = Math.ceil(words.length / 2);
          const firstHalf = words.slice(0, midpoint).join(' ');
          const secondHalf = words.slice(midpoint).join(' ');
          const halfDuration = (scene.duration - 0.6) / 2;

          subtitles.push({
            id: `sub-${scene.id}-1`,
            sceneId: scene.id,
            startTime: currentTime + 0.3,
            endTime: currentTime + 0.3 + halfDuration,
            text: firstHalf,
            speaker: scene.dialogue ? (scene.charactersPresent[0] || 'Character') : 'Narrator',
          });

          subtitles.push({
            id: `sub-${scene.id}-2`,
            sceneId: scene.id,
            startTime: currentTime + 0.3 + halfDuration + 0.1,
            endTime: currentTime + scene.duration - 0.3,
            text: secondHalf,
            speaker: scene.dialogue ? (scene.charactersPresent[0] || 'Character') : 'Narrator',
          });
        }
      }
      currentTime += scene.duration;
    });

    return subtitles;
  }

  generateSRT(subtitles: SubtitleItem[]): string {
    return subtitles
      .map((sub, index) => {
        const formatTime = (sec: number) => {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          const ms = Math.floor((sec % 1) * 1000);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
        };
        return `${index + 1}\n${formatTime(sub.startTime)} --> ${formatTime(sub.endTime)}\n${sub.text}\n`;
      })
      .join('\n');
  }
}
