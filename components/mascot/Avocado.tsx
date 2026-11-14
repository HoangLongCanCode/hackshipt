/**
 * The avocado mascot, cartoon paper-cut style (white sticker outline + hard drop shadow).
 * Pure SVG + CSS, no hooks: works in server and client components.
 *
 *   <Avocado />                       standing, holding the Shipt bag
 *   <Avocado walking />               walk cycle (bob, feet, swinging bag)
 *   <Avocado walking={false} bag={false} size={64} />
 */
import './mascot.css';
import { ShiptBag } from './ShiptBag';

export interface AvocadoProps {
  /** Pixel height of the mascot. Width follows the aspect ratio. Default 96. */
  size?: number;
  /** Play the walk cycle. Default false (standing, blinking). */
  walking?: boolean;
  /** Carry the Shipt shopping bag. Default true. */
  bag?: boolean;
  className?: string;
}

const BODY = 'M58 8C73 8 83 30 93 62C103 94 99 128 58 138C17 128 13 94 23 62C33 30 43 8 58 8Z';

export function Avocado({ size = 96, walking = false, bag = true, className }: AvocadoProps) {
  const h = size;
  const w = (size * 140) / 160;
  return (
    <svg
      className={`avo ${walking ? 'avo--walk' : ''} ${className ?? ''}`}
      width={w}
      height={h}
      viewBox="0 0 140 160"
      role="img"
      aria-label="Avocado mascot"
    >
      {/* feet (behind body) */}
      <g className="avo-foot avo-foot--l">
        <ellipse cx="40" cy="146" rx="15" ry="8" fill="#d99a4a" stroke="#fff" strokeWidth="5" paintOrder="stroke" />
        <ellipse cx="37" cy="144" rx="7" ry="3" fill="#ebb86e" />
      </g>
      <g className="avo-foot avo-foot--r">
        <ellipse cx="78" cy="146" rx="15" ry="8" fill="#d99a4a" stroke="#fff" strokeWidth="5" paintOrder="stroke" />
        <ellipse cx="75" cy="144" rx="7" ry="3" fill="#ebb86e" />
      </g>

      <g className="avo-body">
        {/* dark back-skin peeking out on the right, then the lime front panel */}
        <path d={BODY} transform="translate(8 0)" fill="#3f9a3a" stroke="#fff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
        <path d={BODY} fill="#a6e22e" />
        <path d="M44 30C48 22 52 16 58 14C52 28 44 50 36 70C34 52 38 40 44 30Z" fill="#c4f05a" opacity=".75" />

        {/* pit tummy */}
        <ellipse cx="58" cy="100" rx="21" ry="19" fill="#6f8c2a" />
        <ellipse cx="58" cy="100" rx="21" ry="19" fill="none" stroke="#5a7522" strokeWidth="2" />
        <circle cx="51" cy="94" r="7" fill="#a3bd4c" opacity=".75" />
        <circle cx="66" cy="108" r="2.2" fill="#a3bd4c" opacity=".7" />
        <circle cx="49" cy="108" r="1.8" fill="#a3bd4c" opacity=".6" />

        {/* face */}
        <g className="avo-eyes">
          <circle cx="45" cy="62" r="3.6" fill="#2a2a1c" />
          <circle cx="71" cy="62" r="3.6" fill="#2a2a1c" />
          <circle cx="46.2" cy="60.8" r="1.1" fill="#fff" />
          <circle cx="72.2" cy="60.8" r="1.1" fill="#fff" />
        </g>
        <path d="M46 73Q58 87 72 73" fill="none" stroke="#2a2a1c" strokeWidth="3.2" strokeLinecap="round" />
        <ellipse cx="36" cy="73" rx="6" ry="3.6" fill="#ff8fa8" opacity=".55" />
        <ellipse cx="80" cy="73" rx="6" ry="3.6" fill="#ff8fa8" opacity=".55" />

        {/* back arm (swings opposite) */}
        <g className="avo-arm avo-arm--l">
          <path d="M26 88C18 94 14 102 15 108" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
          <path d="M26 88C18 94 14 102 15 108" fill="none" stroke="#a6e22e" strokeWidth="8" strokeLinecap="round" />
        </g>

        {/* front arm + Shipt bag on the hand */}
        <g className="avo-arm avo-arm--r">
          <g className="avo-bag" style={{ display: bag ? undefined : 'none' }}>
            <g transform="translate(89 104)">
              <ShiptBag size={40} />
            </g>
          </g>
          <path d="M90 86C100 92 106 100 107 108" fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round" />
          <path d="M90 86C100 92 106 100 107 108" fill="none" stroke="#a6e22e" strokeWidth="8" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export default Avocado;
