'use client';

/**
 * Paper-style pill switch for the quest "avocado drives to the destination" animation.
 * Position it yourself:  <AnimationToggle className="fixed right-3 top-[120px] z-20" />
 */
import './mascot.css';
import { useAnimationPref } from './useAnimationPref';

export function AnimationToggle({ className, label = 'Ride animation' }: { className?: string; label?: string }) {
  const [on, setOn] = useAnimationPref();
  return (
    <button
      type="button"
      className={`avo-toggle ${className ?? ''}`}
      aria-pressed={on}
      onClick={() => setOn(!on)}
      title={on ? 'Animations on: the avocado drives you to each quest' : 'Animations off: the map jumps straight to each quest'}
      data-testid="animation-toggle"
    >
      <span aria-hidden style={{ fontSize: 15, lineHeight: 1 }}>🥑🚗</span>
      <span className="avo-toggle__label">{label}</span>
      <span className="avo-toggle__switch" aria-hidden />
    </button>
  );
}

export default AnimationToggle;
