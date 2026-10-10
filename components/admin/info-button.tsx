"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Klein (i)-knopje naast een titel dat de uitleg in een venster toont,
 * zodat lange uitleg niet de hele pagina inneemt.
 */
export function InfoButton({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Uitleg: ${title}`}
        title="Uitleg"
        className="info-btn"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.01" />
        </svg>
      </button>
      <dialog
        ref={ref}
        className="admin-confirm info-dialog"
        aria-label={title}
        onCancel={(e) => { e.preventDefault(); setOpen(false); }}
        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      >
        <h2 className="admin-confirm__title">{title}</h2>
        <div className="info-dialog__body">{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={() => setOpen(false)}>Sluiten</button>
        </div>
      </dialog>
    </>
  );
}
