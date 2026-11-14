/**
 * The bag from the Shipt logo (the green shopping-bag glyph), extracted from public/assets/shipt-logo.svg.
 * Pure SVG, no hooks: safe in server and client components. Use it standalone or let <Avocado/> carry it.
 */
import type { SVGProps } from 'react';

const BAG_PATH =
  'm176.5879 334.48807c-3.56051 4e-3 -7.08998-0.66213-10.4037-1.96464-1.70103-0.68098-2.76653-2.38368-2.63529-4.21125l0.93136-15.19319 4.6236 0.28201-0.91476 14.93014c5.41467 2.04363 11.39045 2.03267 16.79759-0.0308-0.11376-1.67549-0.71096-10.47716-1.07592-15.61503-4.6236 2.33195-8.53151 2.51443-11.40615 0.49293-1.81109-1.28118-2.87481-3.37229-2.84384-5.5905-0.0197-2.32021 1.08838-4.50553 2.97181-5.86068 1.65738-1.20678 3.77181-1.59883 5.75166-1.06643 2.19212 0.59009 4.11171 2.27507 5.13786 4.50274l-4.20887 1.93381c-0.45028-0.97876-1.26788-1.73237-2.13288-1.96699-0.65189-0.17682-1.349-0.0344-1.8793 0.38392-0.65061 0.48682-1.02792 1.25642-1.0143 2.06889-0.0232 0.70967 0.30481 1.38518 0.87684 1.80583 1.76081 1.23944 5.31561 0.29624 9.5079-2.52153 0.73053-0.49112 1.67622-0.52601 2.44095-0.0901 1.07592 0.61617 1.13754 1.48828 1.22048 2.69691l1.29395 18.7788c0.15166 1.84677-0.92776 3.57386-2.65425 4.24679-3.30459 1.31388-6.82853 1.98834-10.38474 1.98834z';

/** Original logo green. */
export const SHIPT_GREEN = '#23cc6b';

export interface ShiptBagProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  size?: number;
  color?: string;
}

export function ShiptBag({ size = 32, color = SHIPT_GREEN, ...rest }: ShiptBagProps) {
  return (
    <svg width={size} height={size * 1.2} viewBox="96.5 -0.5 30 36" role="img" aria-label="Shipt bag" {...rest}>
      {/* the logo's own coordinates live inside its parent group transform */}
      <g transform="translate(-65.51 -300.16)">
        <path d={BAG_PATH} fill={color} stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" paintOrder="stroke" />
      </g>
    </svg>
  );
}

export default ShiptBag;
