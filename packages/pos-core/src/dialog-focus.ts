import { KeyboardEvent as ReactKeyboardEvent, RefObject, useEffect, useRef } from 'react';

const selector = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

export function useDialogFocus(open: boolean, onClose: () => void, initialRef?: RefObject<HTMLElement | null>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    previousRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timer = window.setTimeout(() => {
      const root = dialogRef.current;
      const target = initialRef?.current ?? root?.querySelector<HTMLElement>(selector);
      (target ?? root)?.focus();
    }, 0);
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', escape);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', escape);
      window.setTimeout(() => previousRef.current?.focus(), 0);
    };
  }, [open, onClose, initialRef]);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(selector) ?? []).filter((node) => node.offsetParent !== null);
    if (!nodes.length) { event.preventDefault(); return; }
    const first = nodes[0]; const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return { dialogRef, onKeyDown };
}
