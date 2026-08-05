import { Badge } from './badge';

const categoryColors = {
  sports: { background: 'rgba(34, 197, 94, 0.14)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  tech: { background: 'rgba(125, 162, 232, 0.13)', color: '#7da2e8', border: 'rgba(125, 162, 232, 0.3)' },
  popculture: { background: 'rgba(168, 85, 247, 0.14)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  politics: { background: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  memes: { background: 'rgba(239, 68, 68, 0.14)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

/**
 * CategoryTag — scoreboard-style chip showing a market's category.
 *
 * @param {object} props
 * @param {'sports'|'tech'|'popculture'|'politics'|'memes'} props.category
 */
export function CategoryTag({ category }) {
  const colors = categoryColors[category] || categoryColors.tech;

  return (
    <Badge
      variant="outline"
      className="h-5 rounded-[3px] border px-2 font-heading text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{
        background: colors.background,
        color: colors.color,
        borderColor: colors.border,
      }}
    >
      {category === 'popculture' ? 'Pop Culture' : category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>
  );
}
