"use client";

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
        setSubject(d.subject ?? "");
        setBody(d.body ?? "");
        return;
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
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: "1.5rem", alignItems: "start" }} className="mail-grid">
      <style>{`@media (max-width: 900px){.mail-grid{grid-template-columns:minmax(0,1fr)!important}}`}</style>

      <section style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>Invoegen:</span>
            {FIELDS.map((f) => (
              <button key={f.key} type="button" className="btn-sm btn-sm--ghost" onClick={() => insertField(f.key)}
                title={`Voegt {${f.key}} in, per ploeg ingevuld`}>
                {f.label}
              </button>
            ))}
          </div>
          <textarea id="m-body" ref={bodyRef} rows={12} value={body} onChange={(e) => setBody(e.target.value)}
            style={{ resize: "vertical", lineHeight: 1.55 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" className="btn-sm btn-sm--primary" onClick={send}
            disabled={sending || n === 0 || !subject.trim() || !body.trim()}
            style={{ padding: "0.55rem 1.1rem" }}>
            {sending ? "Versturen…" : `Verstuur naar ${n} ploeg${n === 1 ? "" : "en"}`}
          </button>
          {sendError && <span style={{ color: "var(--err-fg)", fontSize: "0.85rem" }}>{sendError}</span>}
        </div>

        {result && (
          <div style={{ padding: "0.85rem 1rem", borderRadius: 12, background: result.failed.length ? "var(--warn-bg)" : "var(--ok-bg)", color: result.failed.length ? "var(--warn-fg)" : "var(--ok-fg)", fontSize: "0.875rem", lineHeight: 1.5 }}>
            Verstuurd naar {result.sent} ploeg{result.sent === 1 ? "" : "en"}.
            {result.failed.length > 0 && (
              <>
                {" "}Mislukt voor {result.failed.length}:
                <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>
                  {result.failed.map((f) => <li key={f.email}>{f.name} ({f.email}): {f.error}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      <aside style={{ display: "grid", gap: "0.75rem" }}>
        <div style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.5 }}>
          {previewError ? (
            <span style={{ color: "var(--err-fg)" }}>{previewError}</span>
          ) : preview ? (
            <>
              Gaat naar <strong style={{ color: "var(--text)" }}>{n} ploeg{n === 1 ? "" : "en"}</strong>
              {preview.skipped.length > 0 && (
                <> · {preview.skipped.length} zonder e-mailadres: {preview.skipped.map((s) => s.name).join(", ")}</>
              )}
            </>
          ) : "Ontvangers laden…"}
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg-alt)", overflow: "hidden" }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-2)", display: "grid", gap: "0.2rem" }}>
            <span>Voorbeeld voor <strong style={{ color: "var(--text)" }}>{preview?.preview?.name ?? "…"}</strong> {preview?.preview ? `<${preview.preview.to}>` : ""}</span>
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text)" }}>{preview?.preview?.subject || subject || "(geen onderwerp)"}</span>
          </div>
          <pre style={{ margin: 0, padding: "1rem", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text)" }}>
            {preview?.preview?.text ?? body}
          </pre>
        </div>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-2)", lineHeight: 1.5 }}>
          Elke ploeg krijgt een eigen mail; de anderen zien elkaars adres niet. Je concept blijft bewaard in deze browser tot het verstuurd is.
        </p>
      </aside>
    </div>
  );
}
