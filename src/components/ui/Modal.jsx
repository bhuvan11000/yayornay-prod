import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './sheet';

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
};

/**
 * Modal — Portal-based modal. Desktop uses shadcn Dialog; mobile
 * (max-width 640px) uses a bottom Sheet. Keep public API unchanged.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 */
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const header = (Title, TitleComp) => (
    <TitleComp className="flex items-center justify-between pr-10 font-heading text-lg font-semibold text-[var(--text-primary)]">
      <Title asChild>
        <div>{title}</div>
      </Title>
      <button
        onClick={onClose}
        aria-label="Close modal"
        className="absolute top-3 right-3 rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
      >
        <X size={18} />
      </button>
    </TitleComp>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" showCloseButton={false} className="border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          {title && (
            <SheetHeader>
              {header(SheetTitle, SheetTitle)}
            </SheetHeader>
          )}
          <div className="px-4 pb-6 text-[var(--text-primary)]">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={`border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-primary)] ${sizeClasses[size]}`}
      >
        {title && (
          <DialogHeader>{header(DialogTitle, DialogTitle)}</DialogHeader>
        )}
        <div className="text-[var(--text-primary)]">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
