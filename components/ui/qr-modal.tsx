"use client";

import { useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface QrModalProps {
  title: string;
  subtitle?: string | null;
  url: string;
  code?: string;
  filename: string;
  onClose: () => void;
}

/** Groot QR-scherm om te tonen op een gsm/scherm of af te drukken. */
export function QrModal({ title, subtitle, url, code, filename, onClose }: Readonly<QrModalProps>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleDownload() {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${filename}.png`;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <style>{`
        @media print {
          @page { margin: 15mm; }
          body * { visibility: hidden !important; }
          #qr-print, #qr-print * { visibility: visible !important; }
          #qr-print { position: fixed; inset: 0; box-shadow: none !important; border: none !important; max-width: none !important; }
          .qr-no-print { display: none !important; }
        }
      `}</style>
      <div
        id="qr-print"
        className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold tracking-widest uppercase text-pink font-mono">De Flosj</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-ink-2">{subtitle}</p>}

        <div className="my-6 rounded-xl bg-white p-3">
          <QRCodeCanvas id="qr-canvas" value={url} size={320} level="M" marginSize={2} />
        </div>

        <p className="text-sm text-ink-2">Of ga naar</p>
        <p className="mt-0.5 text-sm font-medium text-ink break-all">{url}</p>
        {code && (
          <p className="mt-3 text-xs text-ink-2">
            Code: <span className="font-mono font-semibold tracking-widest text-ink">{code}</span>
          </p>
        )}

        <div className="qr-no-print mt-6 flex w-full gap-2">
          <button
            onClick={() => globalThis.print()}
            className="flex-1 rounded-lg bg-pink px-3.5 py-2 text-sm font-semibold text-white hover:bg-pink/90"
          >
            Afdrukken
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 rounded-lg border border-rule px-3.5 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            Download PNG
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-rule px-3.5 py-2 text-sm font-semibold text-ink-2 hover:bg-surface"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
