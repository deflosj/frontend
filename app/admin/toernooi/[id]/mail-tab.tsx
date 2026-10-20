"use client";

import { Notice, Panel } from "@/components/admin/ui";
import { useSearchParams } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { apiFetch, getTokenPayload } from "@/lib/api";
import { MailStatusCard, remainingToday, useMailStatus } from "@/components/admin/mail-status";
import type { ActiveTournament } from "@/lib/tournament-types";

type Audience = "all" | "incomplete";

interface MailResult {
  recipients: { teamId: number; name: string; email: string }[];
  skipped: { teamId: number; name: string }[];
  preview: { to: string; name: string; subject: string; text: string } | null;
  sent: number;
  failed: { name: string; email: string; error: string }[];
}

interface TestResult { to: string; basedOn: string; sent: number; error: string | null }

interface Attachment { filename: string; content: string; bytes: number }

const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;

const fileSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} kB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Leest een bestand als base64 zonder `data:`-prefix. */
const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ""));
    reader.onerror = () => reject(reader.error ?? new Error("Lezen mislukt"));
    reader.readAsDataURL(file);
  });

const TEST_TO_KEY = "deflosj:admin-mail:test-to";

const FIELDS: { key: string; label: string }[] = [
  { key: "kapitein", label: "Kapitein" },
  { key: "ploeg", label: "Ploegnaam" },
  { key: "poule", label: "Poule" },
  { key: "eerste_match", label: "Eerste match" },
  { key: "portaallink", label: "Portaallink" },
  { key: "ontbrekend", label: "Aantal ontbrekende spelers" },
];

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: "all", label: "Alle ploegen" },
  { key: "incomplete", label: "Onvolledige ploegen" },
];

const INCOMPLETE_TEMPLATE =
  "Dag {kapitein},\n\n" +
  "In {ploeg} ontbreken nog {ontbrekend}. Vul de namen van al jullie spelers aan via jullie portaal:\n" +
  "{portaallink}\n\n" +
  "Zo staan jullie juist op het scorebord en in het schema.\n\n" +
  "Tot dan!";

const DRAFT_KEY = (id: number) => `deflosj:admin-mail:${id}`;

/** Mail naar de kapiteinen, met invulvelden per ploeg en een voorbeeld vóór je verstuurt. */
export function MailTab({ tournament }: Readonly<{ tournament: ActiveTournament }>) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const searchParams = useSearchParams();
  const fromIncomplete = searchParams.get("naar") === "onvolledig";
  const [audience, setAudience] = useState<Audience>(fromIncomplete ? "incomplete" : "all");
  const [pouleId, setPouleId] = useState("");
  const [preview, setPreview] = useState<MailResult | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<MailResult | null>(null);
  const [sendError, setSendError] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const mailStatus = useMailStatus();
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const totalBytes = attachments.reduce((sum, a) => sum + a.bytes, 0);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setAttachError("");
    const next = [...attachments];
    for (const file of Array.from(files)) {
      if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) { setAttachError("Enkel PDF, PNG of JPG."); continue; }
      if (next.length >= MAX_FILES) { setAttachError(`Hoogstens ${MAX_FILES} bijlagen.`); break; }
      if (next.reduce((s, a) => s + a.bytes, 0) + file.size > MAX_BYTES) { setAttachError("Samen hoogstens 5 MB."); continue; }
      try {
        next.push({ filename: file.name, content: await readBase64(file), bytes: file.size });
      } catch {
        setAttachError(`${file.name} kon niet gelezen worden.`);
      }
    }
    setAttachments(next);
    if (fileRef.current) fileRef.current.value = "";
  }

  const attachmentPayload = () => attachments.map(({ filename, content }) => ({ filename, content }));

  // Testadres: wat je vorige keer gebruikte, anders het adres waarmee je inlogt.
  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem(TEST_TO_KEY) ?? ""; } catch { /* */ }
    setTestTo(saved || getTokenPayload()?.email || "");
  }, []);

  const groupPoules = tournament.poules.filter((p) => p.phase === "GROUP_STAGE");

  // Concept bewaren in deze browser: een half geschreven mail ga je niet kwijt.
  useEffect(() => {
    // Via "Mail deze ploegen" bij de onvolledige teams: meteen het juiste bericht.
    if (fromIncomplete) {
      setSubject(`${tournament.name}: vul jullie spelers aan`);
      setBody(INCOMPLETE_TEMPLATE);
      return;
    }
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
  }, [tournament.id, tournament.name, fromIncomplete]);
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

  async function sendTest() {
    if (!testTo.trim()) return;
    setTesting(true); setTestResult(null);
    try { localStorage.setItem(TEST_TO_KEY, testTo.trim()); } catch { /* */ }
    try {
      // Apart endpoint: kan nooit naar de ploegen gaan. Bewust zonder "send".
      const { subject: subj, body: txt, audience: aud, pouleId: pid } = payload(false);
      const res = await apiFetch<TestResult>(`tournaments/${tournament.id}/mail/test`, {
        method: "POST",
        body: JSON.stringify({ subject: subj, body: txt, audience: aud, pouleId: pid, testTo: testTo.trim(), attachments: attachmentPayload() }),
      });
      mailStatus.reload();
      setTestResult(res.error
        ? { tone: "err", text: `Testmail mislukt: ${res.error}` }
        : { tone: "ok", text: `Testmail verstuurd naar ${res.to}, ingevuld zoals voor ${res.basedOn}. Check ook je spam.` });
    } catch (e) {
      setTestResult({ tone: "err", text: e instanceof Error ? e.message : "Testmail versturen mislukt." });
    } finally {
      setTesting(false);
    }
  }

  async function send() {
    const n = preview?.recipients.length ?? 0;
    if (!n) return;
    const withFiles = attachments.length ? ` met ${attachments.length} bijlage${attachments.length === 1 ? "" : "n"}` : "";
    if (!globalThis.confirm(`Mail "${subject}"${withFiles} versturen naar ${n} ploeg${n === 1 ? "" : "en"}?`)) return;
    setSending(true); setSendError(""); setResult(null);
    try {
      const res = await apiFetch<MailResult>(`tournaments/${tournament.id}/mail`, {
        method: "POST",
        body: JSON.stringify({ ...payload(true), attachments: attachmentPayload() }),
      });
      setResult(res);
      mailStatus.reload();
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
  const left = remainingToday(mailStatus.status);
  const overQuota = left !== null && n > left;

  return (
    <div className="flex flex-col gap-6">
    <MailStatusCard status={mailStatus.status} error={mailStatus.error} />
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

          <div className="form-field">
            <span className="text-[13px] font-medium text-ink">Bijlagen</span>
            {attachments.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {attachments.map((a, i) => (
                  <li key={`${a.filename}-${i}`} className="flex items-center gap-2 rounded-lg border border-rule bg-paper px-3 py-2 text-sm">
                    <Paperclip size={14} className="shrink-0 text-ink-2" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-ink">{a.filename}</span>
                    <span className="text-xs text-ink-2">{fileSize(a.bytes)}</span>
                    <button type="button" className="rounded p-1 text-ink-2 hover:text-ink" aria-label={`${a.filename} verwijderen`}
                      onClick={() => setAttachments((list) => list.filter((_, j) => j !== i))}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} id="m-files" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
              <label htmlFor="m-files" className="btn-sm btn-sm--ghost cursor-pointer">
                <Paperclip size={14} aria-hidden /> Bijlage toevoegen
              </label>
              <span className="text-xs text-ink-2">
                PDF, PNG of JPG · max {MAX_FILES} · samen max 5 MB{attachments.length ? ` · nu ${fileSize(totalBytes)}` : ""}. Elke ploeg krijgt dezelfde bijlage.
              </span>
            </div>
            {attachError && <Notice tone="err">{attachError}</Notice>}
          </div>

          <div className="form-field flex flex-col gap-2 rounded-xl border border-dashed border-rule p-3">
            <label htmlFor="m-test" className="text-[13px] font-medium text-ink">Eerst testen?</label>
            <div className="flex flex-wrap items-center gap-2">
              <input id="m-test" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)}
                placeholder="jouw@email.be" className="min-w-[14rem] flex-1" />
              <button type="button" className="btn-sm btn-sm--ghost" onClick={sendTest}
                disabled={testing || sending || n === 0 || !testTo.trim() || !subject.trim() || !body.trim()}>
                {testing ? "Versturen…" : "Stuur testmail"}
              </button>
            </div>
            <span className="text-xs text-ink-2">
              Je krijgt één mail met &quot;[TEST]&quot; in het onderwerp, ingevuld zoals voor de eerste ploeg. Geen enkele ploeg krijgt iets.
            </span>
            {testResult && <Notice tone={testResult.tone}>{testResult.text}</Notice>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-sm btn-sm--primary" onClick={send}
              disabled={sending || n === 0 || !subject.trim() || !body.trim()}>
              {sending ? "Versturen…" : `Verstuur naar ${n} ploeg${n === 1 ? "" : "en"}`}
            </button>
            <span className="text-xs text-ink-2">Concept wordt bewaard in deze browser.</span>
          </div>
          {overQuota && (
            <Notice tone="warn">
              Je kan vandaag nog {left} mail{left === 1 ? "" : "s"} versturen, maar deze verzending gaat naar {n} ploegen.
              De rest mislukt; verstuur ze morgen opnieuw of beperk de ontvangers (bv. per poule).
            </Notice>
          )}
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
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-rule px-5 py-3">
            {attachments.map((a, i) => (
              <span key={`${a.filename}-${i}`} className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-paper px-2 py-1 text-xs text-ink">
                <Paperclip size={12} aria-hidden /> {a.filename} <span className="text-ink-2">{fileSize(a.bytes)}</span>
              </span>
            ))}
          </div>
        )}
      </Panel>
    </div>
    </div>
  );
}
