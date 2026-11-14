/**
 * Paper-cartoon car with the avocado at the wheel, facing right. Pure SVG + CSS (no hooks).
 * Used by the quest "drive to destination" animation (see driveCar.tsx) but fine standalone.
 */
import './mascot.css';
import { ShiptBag } from './ShiptBag';

export interface AvocadoCarProps {
  /** Pixel width. Default 120. */
  size?: number;
  /** Spin the wheels / bounce / puff smoke. Default true. */
  driving?: boolean;
  className?: string;
}

const BODY =
  'M12 80V64Q12 56 22 54L56 50Q68 26 98 24H128Q150 26 160 50L182 56Q194 60 194 70V80Q194 90 184 90H20Q12 90 12 80Z';

function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy="90" r="17" fill="#2a1d3d" stroke="#fff" strokeWidth="5" paintOrder="stroke" />
      <g className="avo-wheel" style={{ transformOrigin: `${cx}px 90px` }}>
        <circle cx={cx} cy="90" r="8" fill="#f4efe6" />
        <path d={`M${cx} 82V98M${cx - 8} 90H${cx + 8}`} stroke="#8c7a9b" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function AvocadoCar({ size = 120, driving = true, className }: AvocadoCarProps) {
  return (
    <div className={`avo-car ${driving ? 'avo-car--drive' : ''} ${className ?? ''}`} style={{ width: size }}>
      <span className="avo-puff avo-puff--1" />
      <span className="avo-puff avo-puff--2" />
      <span className="avo-puff avo-puff--3" />
      <svg width={size} height={(size * 112) / 200} viewBox="0 0 200 112" role="img" aria-label="Avocado driving a car" style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id="avo-car-clip">
            <rect x="68" y="-20" width="92" height="72" />
          </clipPath>
        </defs>
        <g className="avo-car-body">
          <path d={BODY} fill="#4a2d7a" stroke="#fff" strokeWidth="7" strokeLinejoin="round" paintOrder="stroke" />
          {/* lower stripe + highlight (paper layers) */}
          <path d="M14 72H192V80Q192 88 184 88H20Q14 88 14 80Z" fill="#35205a" />
          <path d="M26 60L56 57" stroke="#7a56b8" strokeWidth="3" strokeLinecap="round" />

          {/* window, avocado driver (top peeks above the roof), window frame */}
          <path d="M68 52Q78 33 98 31H126Q144 33 152 52Z" fill="#a9dcf5" />
          <g clipPath="url(#avo-car-clip)">
            <ellipse cx="112" cy="40" rx="25" ry="31" fill="#3f9a3a" transform="translate(5 0)" stroke="#fff" strokeWidth="5" paintOrder="stroke" />
            <ellipse cx="112" cy="40" rx="25" ry="31" fill="#a6e22e" />
            <circle cx="102" cy="40" r="3" fill="#2a2a1c" />
            <circle cx="123" cy="40" r="3" fill="#2a2a1c" />
            <path d="M103 50Q112 59 124 50" fill="none" stroke="#2a2a1c" strokeWidth="2.8" strokeLinecap="round" />
            <ellipse cx="96" cy="49" rx="4.5" ry="2.6" fill="#ff8fa8" opacity=".55" />
            <ellipse cx="130" cy="49" rx="4.5" ry="2.6" fill="#ff8fa8" opacity=".55" />
          </g>
          <path d="M68 52Q78 33 98 31H126Q144 33 152 52Z" fill="none" stroke="#35205a" strokeWidth="3" strokeLinejoin="round" />
          <path d="M82 46Q88 38 96 36" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".7" fill="none" />

          {/* door badge with the Shipt bag */}
          <circle cx="104" cy="71" r="12" fill="#fff" />
          <g transform="translate(95 60)">
            <ShiptBag size={16} stroke="none" />
          </g>

          {/* lights */}
          <path d="M184 62Q192 62 192 68Q192 72 184 72Z" fill="#ffd54a" stroke="#fff" strokeWidth="2" paintOrder="stroke" />
          <rect x="12" y="62" width="6" height="10" rx="2" fill="#ff6b5a" />
        </g>
        <Wheel cx={52} />
        <Wheel cx={152} />
      </svg>
    </div>
  );
}

export default AvocadoCar;
