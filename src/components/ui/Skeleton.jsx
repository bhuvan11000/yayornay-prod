import styles from './Skeleton.module.css';

/**
 * Skeleton — Loading placeholder with shimmer animation.
 *
 * @param {object} props
 * @param {string} [props.width]
 * @param {string} [props.height]
 * @param {'text'|'circle'|'rect'|'card'} [props.variant='text']
 */
export function Skeleton({ width, height, variant = 'text' }) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * PageSkeleton — Full-page loading skeleton.
 * Shows a header bar + 3 card-shaped placeholders with shimmer.
 * Used by ProtectedRoute while auth state is loading.
 */
export function PageSkeleton() {
  return (
    <div className={styles.pageSkeleton}>
      {/* Header skeleton */}
      <div className={styles.pageSkeletonHeader} />

      {/* Content area */}
      <div className={styles.pageSkeletonContent}>
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}
