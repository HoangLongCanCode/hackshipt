import './cozy.css';
import { cx } from './cx';

export interface ProgressBarProps {
  /** 0..100 (clamped). */
  value: number;
  tone?: 'leaf' | 'gold' | 'coral' | 'sky';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function ProgressBar({ value, tone = 'leaf', size = 'md', label, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={cx('cz-progress', size === 'sm' && 'cz-progress--sm', size === 'lg' && 'cz-progress--lg', tone !== 'leaf' && `cz-progress--${tone}`, className)}
    >
      <div className="cz-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default ProgressBar;
