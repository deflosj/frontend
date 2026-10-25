"use client";

import { fmtDate, fmtTime } from "@/utils/DateHelpers";
import { Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface QuotaWindow {
  used: number;
  limit: number | null;
  resetsAt: string | null;
}

export interface MailStatus {
  provider: "gmail" | "resend" | "smtp" | null;
  from: string;
  usage: { daily: QuotaWindow | null; monthly: QuotaWindow | null } | null;
  usageError?: string;
}

const PROVIDER_LABEL: Record<NonNullable<MailStatus["provider"]>, string> = {
  gmail: "Gmail",
  resend: "Resend",
  smtp: "SMTP",
};

/** Hoeveel mails er vandaag nog kunnen (min. van dag- en maandlimiet), of null als onbekend. */
export function remainingToday(status: MailStatus | null): number | null {
  const left = [status?.usage?.daily, status?.usage?.monthly]
    .filter((w): w is QuotaWindow & { limit: number } => !!w && w.limit !== null)
    .map((w) => Math.max(0, w.limit - w.used));
  return left.length ? Math.min(...left) : null;
}

export function useMailStatus() {
  const [status, setStatus] = useState<MailStatus | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setStatus(await apiFetch<MailStatus>("mail/status"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mailstatus laden mislukt.");
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { status, error, reload };
}

function fmtReset(iso: string | null, monthly: boolean) {
  if (!iso) return "";
  const d = new Date(iso);
  return monthly
    ? `vanaf ${fmtDate(d, { day: "numeric", month: "long" })}`
    : `om ${fmtTime(d)}`;
}

function Meter({ label, w, monthly }: Readonly<{ label: string; w: QuotaWindow; monthly?: boolean }>) {
  const pct = w.limit ? Math.min(100, Math.round((w.used / w.limit) * 100)) : 0;
  const left = w.limit === null ? null : Math.max(0, w.limit - w.used);
  let tone = "bg-[var(--ok-fg)]";
  if (pct >= 90) tone = "bg-[var(--err-fg)]";
  else if (pct >= 70) tone = "bg-[var(--warn-fg)]";

  return (
    <div className="flex min-w-[10rem] flex-1 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono tabular-nums text-ink-2">
          {w.used.toLocaleString("nl-BE")}
          {w.limit !== null && <> / {w.limit.toLocaleString("nl-BE")}</>}
        </span>
      </div>
      {w.limit !== null && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-rule"
          role="meter"
          aria-label={`${label}: ${w.used} van ${w.limit} gebruikt`}
          aria-valuemin={0}
          aria-valuemax={w.limit}
          aria-valuenow={w.used}
        >
          <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      <span className="text-xs text-ink-2">
        {left !== null ? `Nog ${left.toLocaleString("nl-BE")}` : "Geen limiet"}
        {w.resetsAt && <> · reset {fmtReset(w.resetsAt, !!monthly)}</>}
      </span>
    </div>
  );
}

/** Compacte kaart: via welke dienst er gemaild wordt en hoeveel er nog kan. */
export function MailStatusCard({ status, error }: Readonly<{ status: MailStatus | null; error?: string }>) {
  if (error) {
    return <div className="rounded-2xl border border-rule bg-surface px-5 py-3 text-[13px] text-[var(--err-fg)]">{error}</div>;
  }
  if (!status) {
    return <div className="rounded-2xl border border-rule bg-surface px-5 py-3 text-[13px] text-ink-2">Mailstatus laden…</div>;
  }
  if (!status.provider) {
    return (
      <div className="rounded-2xl border border-rule bg-[var(--warn-bg)] px-5 py-3 text-[13px] text-[var(--warn-fg)]">
        Mail is nog niet ingesteld op de server. Mails versturen gaat pas als er een provider (Resend of Gmail) ingevuld is.
      </div>
    );
  }

  return (
    <section aria-label="Mailstatus" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-rule bg-surface px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-ink-2">
          <Mail size={15} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 text-[13px]">
          <p className="font-medium text-ink">Via {PROVIDER_LABEL[status.provider]}</p>
          <p className="truncate text-ink-2">{status.from}</p>
        </div>
      </div>
      {status.usage?.daily && <Meter label="Vandaag" w={status.usage.daily} />}
      {status.usage?.monthly && <Meter label="Deze maand" w={status.usage.monthly} monthly />}
      {status.usageError && <p className="text-xs text-ink-2">{status.usageError}</p>}
      {status.provider === "gmail" && <p className="text-xs text-ink-2">Gmail: tot ±2.000 mails per dag.</p>}
    </section>
  );
}
