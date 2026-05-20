"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { IconClose } from "@/components/ui/icons";

// ── Sheet (right-side drawer using Radix Dialog) ──────────────────────────────

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: Readonly<SheetProps>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

interface SheetContentProps {
  title: string;
  description?: string;
  width?: string;
  children: React.ReactNode;
}

export function SheetContent({
  title,
  description,
  width = "min(520px, 100vw)",
  children,
}: Readonly<SheetContentProps>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="admin-sheet-overlay" />
      <Dialog.Content className="admin-sheet" style={{ width }} aria-label={title}>
        <div className="admin-drawer__header">
          <div>
            <Dialog.Title className="admin-sheet__title">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="admin-sheet__desc">{description}</Dialog.Description>
            )}
          </div>
          <Dialog.Close className="admin-drawer__close" aria-label="Sluiten">
            <IconClose />
          </Dialog.Close>
        </div>
        <div className="admin-sheet__body">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
