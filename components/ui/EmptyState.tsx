import './cozy.css';
import type { ReactNode } from 'react';
import { cx } from './cx';

export interface EmptyStateProps {
  emoji?: string;
  title: string;
  message?: string;
  /** Usually a <Button>, e.g. "Try again" for error states. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ emoji = '🌱', title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cx('cz-empty', className)}>
      <div className="cz-empty__art" aria-hidden>
        {emoji}
      </div>
      <h3 className="cz-display text-xl mt-2">{title}</h3>
      {message && <p className="cz-muted text-sm max-w-[28ch]">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
