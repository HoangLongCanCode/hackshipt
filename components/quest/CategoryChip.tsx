import '../ui/cozy.css';
import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { cx } from '../ui/cx';

export interface CategoryChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  label: string;
  emoji: string;
  /** Category colour, e.g. CATEGORY_META[cat].color. */
  color: string;
  /** Filter state (aria-pressed). Ignored when `staticChip`. */
  selected?: boolean;
  /** Small non-interactive tag for cards. */
  staticChip?: boolean;
}

/**
 * Wire-up: `const m = CATEGORY_META[quest.category];`
 * `<CategoryChip label={m.label} emoji={m.emoji} color={m.color} selected={...} onClick={...} />`
 */
export function CategoryChip({ label, emoji, color, selected, staticChip, className, ...rest }: CategoryChipProps) {
  const style = { '--chip': color } as CSSProperties;
  if (staticChip) {
    return (
      <span className={cx('cz-chip', 'cz-chip--static', className)} style={style}>
        <span aria-hidden>{emoji}</span>
        {label}
      </span>
    );
  }
  return (
    <button type="button" aria-pressed={!!selected} className={cx('cz-chip', className)} style={style} {...rest}>
      <span aria-hidden>{emoji}</span>
      {label}
    </button>
  );
}

export default CategoryChip;
