import './cozy.css';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'leaf' | 'sky' | 'gold' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button (use while a mutation is pending). */
  loading?: boolean;
  block?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: '',
  secondary: 'cz-btn--secondary',
  leaf: 'cz-btn--leaf',
  sky: 'cz-btn--sky',
  gold: 'cz-btn--gold',
  danger: 'cz-btn--danger',
  ghost: 'cz-btn--ghost',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, icon, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'cz-btn',
        VARIANT_CLASS[variant],
        size === 'sm' && 'cz-btn--sm',
        size === 'lg' && 'cz-btn--lg',
        block && 'cz-btn--block',
        className,
      )}
      {...rest}
    >
      {loading ? <span className="cz-btn__spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export default Button;
