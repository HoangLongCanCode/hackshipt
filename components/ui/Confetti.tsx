import './cozy.css';
import type { CSSProperties } from 'react';

const COLORS = ['#f07c5a', '#f2b63d', '#6bb653', '#7fb6e8', '#fbc9b5'];

/** Decorative CSS-only confetti burst. Place inside a `position: relative` parent. */
export function Confetti({ count = 26 }: { count?: number }) {
  return (
    <div className="cz-confetti" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const style: CSSProperties = {
          left: `${(i * 37) % 100}%`,
          background: COLORS[i % COLORS.length],
          animationDelay: `${(i % 9) * 0.07}s`,
          animationDuration: `${1.8 + (i % 5) * 0.25}s`,
          transform: `rotate(${i * 29}deg)`,
        };
        return <i key={i} style={style} />;
      })}
    </div>
  );
}

export default Confetti;
