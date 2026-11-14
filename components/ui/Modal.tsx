'use client';

import './cozy.css';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './cx';
import { Confetti } from './Confetti';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Shown in the coloured header strip. Omit for a header-less modal. */
  title?: string;
  /** Header strip colour. peach = alerts/confirm, leaf/gold = rewards, sky = info. */
  tone?: 'peach' | 'leaf' | 'gold' | 'sky';
  /** Show a confetti burst (celebrations). */
  confetti?: boolean;
  /** Hide the X button and ignore backdrop/Escape (e.g. while a request is pending). */
  dismissible?: boolean;
  className?: string;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  tone = 'peach',
  confetti,
  dismissible = true,
  className,
  children,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, dismissible, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="cz-overlay"
      onMouseDown={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cx('cz-modal', className)}
      >
        {title && (
          <div id={titleId} className={cx('cz-modal__head', tone !== 'peach' && `cz-modal__head--${tone}`)}>
            {title}
          </div>
        )}
        {dismissible && (
          <button type="button" className="cz-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={3} />
          </button>
        )}
        {confetti && <Confetti />}
        <div className="cz-modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
