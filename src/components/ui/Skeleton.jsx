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
