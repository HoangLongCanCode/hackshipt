import './cozy.css';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

export type PillTone = 'neutral' | 'gold' | 'leaf' | 'sky' | 'coral' | 'outline';

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  icon?: ReactNode;
}

export function Pill({ tone = 'neutral', icon, className, children, ...rest }: PillProps) {
  return (
    <span className={cx('cz-pill', tone !== 'neutral' && `cz-pill--${tone}`, className)} {...rest}>
      {icon}
      {children}
    </span>
  );
}

export default Pill;
