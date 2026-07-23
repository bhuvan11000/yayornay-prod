import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Trophy, TrendingUp } from 'lucide-react';
import styles from './Toast.module.css';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  achievement: Trophy,
  prediction: TrendingUp,
};

/**
 * Toast — Notification component for temporary messages.
 *
 * @param {object} props
 * @param {number} props.id
 * @param {'success'|'error'|'achievement'|'prediction'} props.type
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {function} props.onDismiss
 * @param {number} [props.coins] - Optional coin change amount
 */
export function Toast({ id, type = 'success', title, message, onDismiss, coins }) {
  const Icon = iconMap[type] || CheckCircle;

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert">
      <div className={styles.iconWrapper}>
        <Icon size={18} />
      </div>
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        {message && <div className={styles.message}>{message}</div>}
        {coins !== undefined && (
          <div className={styles.coins}>
            {coins > 0 ? '+' : ''}{coins} coins
          </div>
        )}
      </div>
      <button className={styles.dismiss} onClick={() => onDismiss(id)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
