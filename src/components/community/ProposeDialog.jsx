import { useEffect, useState } from 'react';
import { ProposeForm } from './ProposeForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export function ProposeDialog({ open, onOpenChange }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] overflow-y-auto rounded-t-2xl border-t-[var(--border-subtle)] bg-[var(--bg-secondary)]"
        >
          <SheetHeader>
            <SheetTitle className="font-heading text-base">Propose a Market</SheetTitle>
            <SheetDescription>
              Create a new prediction market for the community to vote on.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ProposeForm onSuccess={() => onOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto bg-[var(--bg-secondary)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-base">Propose a Market</DialogTitle>
          <DialogDescription>
            Create a new prediction market for the community to vote on.
          </DialogDescription>
        </DialogHeader>
        <div className="p-1">
          <ProposeForm onSuccess={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
