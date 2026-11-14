import './cozy.css';
import type { CSSProperties } from 'react';
import { cx } from './cx';

export interface AvatarProps {
  emoji: string;
  /** Pixel size, default 44. */
  size?: number;
  title?: string;
  className?: string;
}

export function Avatar({ emoji, size = 44, title, className }: AvatarProps) {
  return (
    <span
      className={cx('cz-avatar', className)}
      style={{ '--size': `${size}px` } as CSSProperties}
      title={title}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {emoji}
    </span>
  );
}

export interface AvatarStackProps {
  items: Array<{ id: string; emoji: string; name?: string }>;
  size?: number;
  max?: number;
}

/** Overlapping party avatars with a "+N" overflow bubble. */
export function AvatarStack({ items, size = 32, max = 4 }: AvatarStackProps) {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <span className="cz-avatar-stack" style={{ '--size': `${size}px` } as CSSProperties}>
      {shown.map((m) => (
        <Avatar key={m.id} emoji={m.emoji} size={size} title={m.name} />
      ))}
      {extra > 0 && (
        <span className="cz-avatar" style={{ '--size': `${size}px`, fontSize: size * 0.38, fontWeight: 700 } as CSSProperties}>
          +{extra}
        </span>
      )}
    </span>
  );
}

export default Avatar;
