import './cozy.css';
import type { CSSProperties } from 'react';
import { cx } from './cx';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  /** Full pill/circle rounding. */
  round?: boolean;
  className?: string;
}

/** Shimmering placeholder. Always give it a fixed height to avoid layout shift. */
export function Skeleton({ width = '100%', height = 16, round, className }: SkeletonProps) {
  const style: CSSProperties = { width, height, borderRadius: round ? 999 : undefined };
  return <div aria-hidden className={cx('cz-skel', className)} style={style} />;
}

/** Ready-made card-shaped skeleton for lists. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cx('cz-paper', 'p-4', className)} aria-busy>
      <div className="flex items-center gap-3">
        <Skeleton width={44} height={44} round />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton className="mt-4" height={12} />
      <Skeleton className="mt-2" width="80%" height={12} />
    </div>
  );
}

export default Skeleton;
