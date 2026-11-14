/**
 * Loading bar with the avocado walking along it, carrying the Shipt bag.
 * No hooks, so it works as a Suspense fallback / `loading.tsx` in server components too.
 *
 *   <AvocadoLoader />                              loops by itself (use when you don't know progress)
 *   <AvocadoLoader progress={42} label="Packing quests" />   0-100, the avocado walks to the fill tip
 *   <AvocadoLoader fullScreen />                    covers the viewport (page-level loading)
 *
 * For a ready-made "short splash page" see <AvocadoSplash/>.
 */
import './mascot.css';
import { Avocado } from './Avocado';

export interface AvocadoLoaderProps {
  /** 0-100. Omit for an automatic looping animation. */
  progress?: number;
  label?: string;
  /** Small heading above the avocado, e.g. the app name. Pass `null` to hide. Default "RPG Birmingham". */
  title?: string | null;
  /** Cover the whole viewport with a cream backdrop. */
  fullScreen?: boolean;
  /** Used by <AvocadoSplash/> to fade the overlay out. */
  fading?: boolean;
  className?: string;
}

export function AvocadoLoader({ progress, label = 'Packing your quests', title = 'RPG Birmingham', fullScreen, fading, className }: AvocadoLoaderProps) {
  const auto = progress === undefined;
  const pct = auto ? 0 : Math.max(0, Math.min(100, progress));
  return (
    <div
      className={['avo-loader', fullScreen && 'avo-loader--full', auto && 'avo-loader--auto', fading && 'avo-loader--fade', className].filter(Boolean).join(' ')}
      role="progressbar"
      aria-busy={pct < 100}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={auto ? undefined : Math.round(pct)}
    >
      {title && <p className="avo-loader__title">{title}</p>}
      <div className="avo-loader__stage">
        <div className="avo-loader__walker" style={auto ? undefined : { left: `${pct}%`, transition: 'left 0.12s linear' }}>
          <Avocado walking size={96} />
        </div>
        <div className="avo-loader__track">
          <div className="avo-loader__fill" style={auto ? undefined : { width: `${pct}%`, transition: 'width 0.12s linear' }} />
        </div>
      </div>
      <div className="avo-loader__meta">
        <span className="avo-loader__dots">{label}</span>
        {!auto && <span className="avo-loader__pct">{Math.round(pct)}%</span>}
      </div>
    </div>
  );
}

export default AvocadoLoader;
