import { Button as ShadcnButton } from './button';
import { Loader2 } from 'lucide-react';

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const variantClasses = {
  primary:
    'bg-[var(--accent-amber)] text-[var(--primary-foreground)] hover:bg-[var(--accent-amber-hover)] border border-transparent shadow-sm hover:shadow-[var(--shadow-glow-amber)] font-heading font-bold uppercase tracking-[0.08em]',
  secondary:
    'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-input)] border border-[var(--border-subtle)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]',
  yes: 'bg-[var(--color-yes-muted)] text-[var(--color-yes)] border border-[var(--color-yes-border)] hover:bg-[rgba(34,197,94,0.2)] font-heading font-bold uppercase tracking-[0.08em]',
  no: 'bg-[var(--color-no-muted)] text-[var(--color-no)] border border-[var(--color-no-border)] hover:bg-[rgba(239,68,68,0.2)] font-heading font-bold uppercase tracking-[0.08em]',
  danger: 'bg-[var(--color-no-muted)] text-[var(--color-no)] border border-[var(--color-no-border)] hover:bg-[rgba(239,68,68,0.2)]',
};

/**
 * Button — shadcn-backed button with app variant/size API preserved.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'yes'|'no'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} props.children
 * @param {function} [props.onClick]
 * @param {string} [props.className]
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  return (
    <ShadcnButton
      variant={variant === 'primary' ? 'default' : 'ghost'}
      className={`font-semibold ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </ShadcnButton>
  );
}
