import './cozy.css';
import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Hero cards get the tan outline, bigger shadow and (optionally) the stitched edge. */
  hero?: boolean;
  /** Dashed stitched inner edge. Use sparingly: hero surfaces only. */
  stitch?: boolean;
  tint?: boolean;
  flat?: boolean;
  /** Adds hover lift + press squish. Pair with onClick / role="button". */
  interactive?: boolean;
  /** Subtle paper grain texture. */
  grain?: boolean;
  padded?: boolean;
}

export function Card({
  hero,
  stitch,
  tint,
  flat,
  interactive,
  grain,
  padded = true,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        'cz-paper',
        hero && 'cz-paper--hero',
        stitch && 'cz-stitch',
        tint && 'cz-paper--tint',
        flat && 'cz-paper--flat',
        interactive && 'cz-paper--interactive',
        grain && 'cz-grain',
        padded && 'p-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
