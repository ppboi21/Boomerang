import { Volume2, VolumeX } from 'lucide-react';
import { usePrefs } from '../context/PrefsContext';
import { playTone } from '../utils/sound';

export function SoundToggle({ className = '' }) {
  const { sound, update } = usePrefs();
  return (
    <button
      type="button"
      onClick={() => {
        if (!sound) playTone('success');
        update({ sound: !sound });
      }}
      aria-pressed={sound}
      aria-label={sound ? 'Turn sound effects off' : 'Turn sound effects on'}
      title={sound ? 'Sound on' : 'Sound off'}
      className={`grid size-10 place-items-center rounded-xl border transition-colors ${
        sound ? 'border-zap/40 bg-zap/10 text-zap-fg' : 'border-ink-700 text-ink-400 hover:text-ink-100'
      } ${className}`}
    >
      {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}
