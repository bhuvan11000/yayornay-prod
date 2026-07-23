import { useUIStore } from '../../stores/uiStore';
import { Toast } from '../ui/Toast';
import styles from './ToastContainer.module.css';

/**
 * ToastContainer — Renders active toasts in a fixed position overlay.
 *
 * Reads toasts from uiStore and renders each one with the Toast component.
 * Adds to the AppLayout so toasts appear globally.
 */
export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toastWrapper}>
          <Toast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            coins={toast.coins}
            onDismiss={removeToast}
          />
        </div>
      ))}
    </div>
  );
}