import { Input as ShadcnInput } from './input';
import { Label } from './label';

/**
 * Input — form input with label, error state, and helper text.
 *
 * @param {object} props
 * @param {string} [props.type='text']
 * @param {string} [props.placeholder]
 * @param {string} [props.value]
 * @param {function} [props.onChange]
 * @param {string} [props.error] - Error message
 * @param {string} [props.label] - Input label
 * @param {string} [props.helperText] - Helper text below input
 * @param {string} [props.className]
 */
export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  label,
  helperText,
  className = '',
  ...props
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && <Label className="text-sm font-medium text-[var(--text-secondary)]">{label}</Label>}
      <ShadcnInput
        type={type}
        className={`h-10 rounded-lg border bg-[var(--bg-input)] px-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--border-focus)] ${
          error
            ? 'border-[var(--color-no)] focus-visible:ring-[rgba(239,68,68,0.15)]'
            : 'border-[var(--border-subtle)]'
        } ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <span className="text-xs text-[var(--color-no)]">{error}</span>}
      {helperText && !error && <span className="text-xs text-[var(--text-muted)]">{helperText}</span>}
    </div>
  );
}
