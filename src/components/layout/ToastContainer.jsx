import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { TrendingUp } from 'lucide-react';
import { Toaster } from '../ui/sonner';
import CountUp from '../reactbits/CountUp/CountUp';
import { useUIStore } from '../../stores/uiStore';

function PredictionToastContent({ title, message, coins }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-yes-muted)] text-[var(--color-yes)]">
        <TrendingUp size={16} />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-[var(--text-primary)]">{title}</div>
        {message && <div className="text-sm text-[var(--text-secondary)]">{message}</div>}
        {coins !== undefined && (
          <div className="mt-1 text-sm font-semibold text-[var(--color-yes)]">
            <CountUp
              to={coins}
              direction={coins < 0 ? 'down' : 'up'}
              duration={0.8}
              className="tabular-nums"
            />
            {' '}coins
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ToastContainer — mounts Sonner's <Toaster /> and maps uiStore toasts
 * to sonner calls. The uiStore.addToast / removeToast API is unchanged.
 */
export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const shownRef = useRef(new Set());

  useEffect(() => {
    toasts.forEach((t) => {
      if (shownRef.current.has(t.id)) return;
      shownRef.current.add(t.id);

      const opts = {
        description: t.message,
        duration: 4000,
      };

      switch (t.type) {
        case 'success':
          toast.success(t.title || 'Success', opts);
          break;
        case 'error':
          toast.error(t.title || 'Error', opts);
          break;
        case 'prediction':
          toast.custom(() => (
            <PredictionToastContent
              title={t.title}
              message={t.message}
              coins={t.coins}
            />
          ), { duration: 4000 });
          break;
        default:
          toast(t.title || 'Notice', opts);
      }
    });
  }, [toasts]);

  return <Toaster position="top-right" richColors closeButton />;
}
