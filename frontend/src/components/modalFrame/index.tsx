import { type ReactNode, useEffect, useRef } from "react";

// Native dialog supplies Escape handling, focus trapping and focus restoration.
export default function ModalFrame({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const current = dialog.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (open && current && !current.open) {
      current.showModal();
      current
        .querySelector<HTMLButtonElement>("button:not([disabled])")
        ?.focus();
    }
    return () => {
      current?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      aria-label={label}
      className="bassaps-modal-frame"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
          ),
        ).filter((el) => el.getClientRects().length > 0);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !controls.includes(document.activeElement as HTMLElement)) &&
          last
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !controls.includes(document.activeElement as HTMLElement)) &&
          first
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        {children}
      </div>
    </dialog>
  );
}
