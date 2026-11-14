import '../ui/cozy.css';
import { cx } from '../ui/cx';

/**
 * BRAND_TODO: replace with the KSR / product logo + brand colours when the assets exist.
 * Until then: friendly chunky text wordmark, "RPG Birmingham".
 */
export function Wordmark({ className, stacked }: { className?: string; stacked?: boolean }) {
  return (
    <span className={cx('cz-display inline-flex items-baseline gap-1.5 leading-none', stacked && 'flex-col items-center gap-0', className)}>
      <span style={{ color: 'var(--cz-coral)', fontWeight: 700 }}>RPG</span>
      <span style={{ color: 'var(--cz-leaf-deep)', fontWeight: 700 }}>Birmingham</span>
    </span>
  );
}

export default Wordmark;
