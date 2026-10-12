"use client";

import { Notice, Panel } from "@/components/admin/ui";
import { useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { ActiveTournament } from "@/lib/tournament-types";

type Audience = "all" | "paid" | "unpaid" | "present" | "absent";

interface MailResult {
  recipients: { teamId: number; name: string; email: string }[];
  skipped: { teamId: number; name: string }[];
  preview: { to: string; name: string; subject: string; text: string } | null;
  sent: number;
  failed: { name: string; email: string; error: string }[];
}

const FIELDS: { key: string; label: string }[] = [
  { key: "kapitein", label: "Kapitein" },
  { key: "ploeg", label: "Ploegnaam" },
  { key: "poule", label: "Poule" },
  { key: "eerste_match", label: "Eerste match" },
  { key: "portaallink", label: "Portaallink" },
];

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: "all", label: "Alle ploegen" },
  { key: "unpaid", label: "Nog niet betaald" },
  { key: "paid", label: "Betaald" },
  { key: "absent", label: "Nog niet aanwezig" },
  { key: "present", label: "Aanwezig" },
];

const DRAFT_KEY = (id: number) => `deflosj:admin-mail:${id}`;

/** Mail naar de kapiteinen, met invulvelden per ploeg en een voorbeeld vóór je verstuurt. */
export function MailTab({ tournament }: Readonly<{ tournament: ActiveTournament }>) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [pouleId, setPouleId] = useState("");
  const [preview, setPreview] = useState<MailResult | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<MailResult | null>(null);
  const [sendError, setSendError] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const groupPoules = tournament.poules.filter((p) => p.phase === "GROUP_STAGE");

  // Concept bewaren in deze browser: een half geschreven mail ga je niet kwijt.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY(tournament.id));
      if (raw) {
        const d = JSON.parse(raw) as { subject?: string; body?: string };
        // Een leeg concept (bv. door de dubbele mount in dev) telt niet.
        if (d.subject?.trim() || d.body?.trim()) {
          setSubject(d.subject ?? "");
          setBody(d.body ?? "");
          return;
        }
      }
    } catch { /* geen concept */ }
    setSubject(`${tournament.name}: praktische info`);
    setBody(
      "Dag {kapitein},\n\n" +
      "Jullie spelen met {ploeg} in {poule}. Jullie eerste match: {eerste_match}.\n\n" +
      "Spelers aanpassen kan via jullie portaal: {portaallink}\n\n" +
      "Tot dan!"
    );
  }, [tournament.id, tournament.name]);
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY(tournament.id), JSON.stringify({ subject, body })); } catch { /* geen opslag */ }
  }, [tournament.id, subject, body]);

  const payload = (send: boolean) => ({
    subject, body, audience, send,
    pouleId: pouleId ? Number(pouleId) : null,
  });

  // Voorbeeld en ontvangers live bijwerken (licht vertraagd).
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setPreview(await apiFetch<MailResult>(`tournaments/${tournament.id}/mail`, { method: "POST", body: JSON.stringify(payload(false)) }));
        setPreviewError("");
      } catch (e) {
        setPreviewError(e instanceof Error ? e.message : "Voorbeeld laden mislukt.");
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, body, audience, pouleId, tournament.id]);

  function insertField(key: string) {
    const el = bodyRef.current;
    const token = `{${key}}`;
    if (!el) { setBody((b) => b + token); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function send() {
    const n = preview?.recipients.length ?? 0;
    if (!n) return;
    if (!globalThis.confirm(`Mail "${subject}" versturen naar ${n} ploeg${n === 1 ? "" : "en"}?`)) return;
    setSending(true); setSendError(""); setResult(null);
    try {
      const res = await apiFetch<MailResult>(`tournaments/${tournament.id}/mail`, { method: "POST", body: JSON.stringify(payload(true)) });
      setResult(res);
      if (res.failed.length === 0) {
        try { localStorage.removeItem(DRAFT_KEY(tournament.id)); } catch { /* */ }
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Versturen mislukt.");
    } finally {
      setSending(false);
    }
  }

  const n = preview?.recipients.length ?? 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Panel id="compose" title="Mail naar de teams" description="Elke ploeg krijgt een eigen mail, met de velden per ploeg ingevuld.">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="form-field">
              <label htmlFor="m-aud">Naar</label>
              <select id="m-aud" value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="m-poule">Poule</label>
              <select id="m-poule" value={pouleId} onChange={(e) => setPouleId(e.target.value)}>
                <option value="">Alle poules</option>
                {groupPoules.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="m-subject">Onderwerp</label>
            <input id="m-subject" type="text" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="m-body">Bericht</label>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-2">Invoegen:</span>
              {FIELDS.map((f) => (
                <button key={f.key} type="button" className="chip" style={{ height: 28, fontSize: "0.78rem" }}
                  onClick={() => insertField(f.key)} title={`Voegt {${f.key}} in, per ploeg ingevuld`}>
                  {f.label}
                </button>
              ))}
            </div>
            <textarea id="m-body" ref={bodyRef} rows={12} value={body} onChange={(e) => setBody(e.target.value)}
              style={{ resize: "vertical", lineHeight: 1.6 }} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-sm btn-sm--primary" onClick={send}
              disabled={sending || n === 0 || !subject.trim() || !body.trim()}>
              {sending ? "Versturen…" : `Verstuur naar ${n} ploeg${n === 1 ? "" : "en"}`}
            </button>
            <span className="text-xs text-ink-2">Concept wordt bewaard in deze browser.</span>
          </div>
          {sendError && <Notice tone="err">{sendError}</Notice>}

          {result && (
            <Notice tone={result.failed.length ? "warn" : "ok"}>
              Verstuurd naar {result.sent} ploeg{result.sent === 1 ? "" : "en"}.
              {result.failed.length > 0 && (
                <>
                  {" "}Mislukt voor {result.failed.length}:
                  <ul className="mt-1.5 list-disc pl-4">
                    {result.failed.map((f) => <li key={f.email}>{f.name} ({f.email}): {f.error}</li>)}
                  </ul>
                </>
              )}
            </Notice>
          )}
        </div>
      </Panel>

      <Panel
        id="preview"
        title="Voorbeeld"
        description={
          previewError ? <span className="text-[var(--err-fg)]">{previewError}</span>
          : preview ? (
            <>
              Gaat naar <strong className="text-ink">{n} ploeg{n === 1 ? "" : "en"}</strong>
              {preview.skipped.length > 0 && <> · {preview.skipped.length} zonder e-mailadres: {preview.skipped.map((s) => s.name).join(", ")}</>}
            </>
          ) : "Ontvangers laden…"
        }
        flush
      >
        <div className="flex flex-col gap-0.5 bg-paper px-5 py-3 text-[13px] text-ink-2">
          <span>Aan <strong className="text-ink">{preview?.preview?.name ?? "…"}</strong> {preview?.preview ? `<${preview.preview.to}>` : ""}</span>
          <span className="text-[15px] font-semibold text-ink">{preview?.preview?.subject || subject || "(geen onderwerp)"}</span>
        </div>
        <pre className="m-0 whitespace-pre-wrap break-words border-t border-rule px-5 py-4 font-[inherit] text-sm leading-relaxed text-ink">
          {preview?.preview?.text ?? body}
        </pre>
      </Panel>
    </div>
  );
}
