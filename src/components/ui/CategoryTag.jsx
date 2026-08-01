import { Badge } from './badge';

const categoryColors = {
  sports: { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  tech: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  popculture: { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  politics: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  memes: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

/**
 * CategoryTag — shadcn Badge showing a market's category.
 *
 * @param {object} props
 * @param {'sports'|'tech'|'popculture'|'politics'|'memes'} props.category
 */
export function CategoryTag({ category }) {
  const colors = categoryColors[category] || categoryColors.tech;

  return (
    <Badge
      variant="outline"
      className="h-6 rounded-full border px-2.5 text-xs font-semibold"
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
