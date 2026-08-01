import styles from './Input.module.css';

/**
 * Input — Form input with label, error state, and helper text.
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
  const inputClasses = [
    styles.input,
    error ? styles.inputError : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
      {helperText && !error && <span className={styles.helper}>{helperText}</span>}
    </div>
  );
}
