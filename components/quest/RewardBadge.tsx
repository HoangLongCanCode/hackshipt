import '../ui/cozy.css';
import { Pill } from '../ui/Pill';
import { cx } from '../ui/cx';

export interface RewardBadgeProps {
  credits: number;
  xp?: number;
  /** Extra credits from finishing a chain, shown as "+N bonus". */
  chainBonus?: number;
  className?: string;
}

/** Coin + XP reward pair used on quest cards, the quest sheet and the completion modal. */
export function RewardBadge({ credits, xp, chainBonus, className }: RewardBadgeProps) {
  return (
    <span className={cx('cz-reward', className)}>
      <Pill tone="gold" icon={<span className="cz-coin" style={{ width: 18, height: 18, fontSize: 10 }}>C</span>}>
        {credits}
      </Pill>
      {xp !== undefined && <Pill tone="leaf">{xp} XP</Pill>}
      {!!chainBonus && <Pill tone="coral">+{chainBonus} bonus</Pill>}
    </span>
  );
}

export default RewardBadge;
