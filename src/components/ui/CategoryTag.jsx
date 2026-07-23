import styles from './CategoryTag.module.css';

const categoryColors = {
  sports: { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  tech: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  popculture: { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' },
  politics: { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  memes: { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
};

/**
 * CategoryTag — Small colored pill showing a market's category.
 *
 * @param {object} props
 * @param {'sports'|'tech'|'popculture'|'politics'|'memes'} props.category
 */
export function CategoryTag({ category }) {
  const colors = categoryColors[category] || categoryColors.tech;

  return (
    <span
      className={styles.tag}
      style={{
        background: colors.background,
        color: colors.color,
      }}
    >
      {category === 'popculture' ? 'Pop Culture' : category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  );
}
