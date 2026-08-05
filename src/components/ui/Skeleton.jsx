import { Skeleton as ShadcnSkeleton } from './skeleton';

const variantClasses = {
  text: 'h-4 w-24',
  circle: 'h-10 w-10 rounded-[3px]',
  rect: 'h-16 w-full',
  card: 'h-40 w-full rounded-[var(--radius-sm)]',
};

/**
 * Skeleton — loading placeholder with shimmer animation.
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
    <ShadcnSkeleton
      className={`bg-[var(--bg-tertiary)] ${variantClasses[variant] || variantClasses.text}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * PageSkeleton — Full-page loading skeleton.
 */
export function PageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <ShadcnSkeleton className="h-6 w-40 bg-[var(--bg-tertiary)]" />
        <ShadcnSkeleton className="h-8 w-8 rounded-[3px] bg-[var(--bg-tertiary)]" />
      </div>
      <div className="grid gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}
