import '../ui/cozy.css';
import { Star } from 'lucide-react';

/** 1..5 filled stars (QuestDTO.difficulty). */
export function DifficultyStars({ value, size = 14 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="cz-stars" role="img" aria-label={`Difficulty ${v} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} data-off={i >= v} fill="currentColor" strokeWidth={1.5} />
      ))}
    </span>
  );
}

export default DifficultyStars;
