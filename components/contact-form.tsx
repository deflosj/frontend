"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";

type FormState = "idle" | "loading" | "success" | "error";

// ── Animated underline field wrapper ─────────────────────────────────────────

function Field({
  id,
  label,
  children,
}: Readonly<{ id: string; label: string; children: React.ReactNode }>) {
  return (
    <div className="group/field flex flex-col gap-2.5">
      <label
        htmlFor={id}
        className="text-[0.625rem] font-semibold uppercase tracking-widest text-ink-2 transition-colors duration-200 group-focus-within/field:text-ink"
      >
        {label}
      </label>
      <div className="relative pb-px">
        {children}
        {/* static base line */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-rule" />
        {/* animated pink line — grows from left on focus */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-pink transition-[width] duration-300 ease-out group-focus-within/field:w-full" />
      </div>
    </div>
  );
}

// ── Send icon ─────────────────────────────────────────────────────────────────

function IconSend() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M2 7.5h11M9 3l4.5 4.5L9 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}contact/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, body:message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      setState("success");
    } catch {
      setState("error");
    }
  }

  // ── Success state ───────────────────────────────────────────────────────────

  if (state === "success") {
    return (
      <div className="flex flex-col gap-6 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-soft text-pink">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M4.5 11l4.5 4.5 8.5-9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h3 className="mb-2 text-xl font-semibold text-ink">Bericht verstuurd</h3>
          <p className="max-w-sm text-sm leading-relaxed text-ink-2">
            Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op,
            normaal binnen de 2 werkdagen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setName("");
            setEmail("");
            setSubject("");
            setMessage("");
          }}
          className="group flex items-center gap-1.5 self-start text-sm font-medium text-ink-2 transition-colors duration-200 hover:text-ink"
        >
          <span>Nieuw bericht sturen</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    );
  }

  const inputBase =
    "w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-2/40 outline-none disabled:cursor-not-allowed disabled:opacity-60";

  const canSubmit = Boolean(name && email && subject && message);

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <Field id="name" label="Naam">
          <input
            id="name"
            type="text"
            placeholder="Jan Janssen"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={state === "loading"}
            className={inputBase}
          />
        </Field>

        <Field id="email" label="E-mail">
          <input
            id="email"
            type="email"
            placeholder="jan@voorbeeld.be"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "loading"}
            className={inputBase}
          />
        </Field>
      </div>

      <Field id="subject" label="Onderwerp">
        <input
          id="subject"
          type="text"
          placeholder="Vraag over het toernooi..."
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={state === "loading"}
          className={inputBase}
        />
      </Field>

      <Field id="message" label="Bericht">
        <textarea
          id="message"
          rows={5}
          placeholder="Schrijf hier je bericht..."
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={state === "loading"}
          className={`${inputBase} resize-none`}
        />
      </Field>

      {state === "error" && (
        <p className="text-sm text-red-500 dark:text-red-400">
          Er ging iets mis. Probeer het opnieuw of stuur een e-mail rechtstreeks.
        </p>
      )}

      <div className="flex items-center gap-5 pt-2">
        <button
          type="submit"
          disabled={state === "loading" || !canSubmit}
          className="group flex items-center gap-2.5 rounded-full bg-pink px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-pink/85 hover:shadow-md hover:shadow-pink/20 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>{state === "loading" ? "Verzenden…" : "Verstuur bericht"}</span>
          {state !== "loading" && (
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              <IconSend />
            </span>
          )}
        </button>

        {state === "loading" && (
          <span className="text-xs text-ink-2">Even geduld…</span>
        )}
      </div>
    </form>
  );
}
