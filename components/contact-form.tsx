"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

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
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      setState("success");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-rule bg-surface p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-soft text-pink text-xl font-bold">
          ✓
        </div>
        <h3 className="text-lg font-semibold text-ink">Bericht verstuurd</h3>
        <p className="text-sm leading-relaxed text-ink-2">
          Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op.
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setName("");
            setEmail("");
            setSubject("");
            setMessage("");
          }}
          className="mt-2 text-sm font-semibold text-ink hover:underline"
        >
          Nieuw bericht sturen →
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-rule bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted outline-none transition focus:border-pink focus:ring-2 focus:ring-pink/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
            Naam
          </label>
          <input
            id="name"
            type="text"
            placeholder="Jan Janssen"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={state === "loading"}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="jan@voorbeeld.be"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "loading"}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject" className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
          Onderwerp
        </label>
        <input
          id="subject"
          type="text"
          placeholder="Vraag over het toernooi..."
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={state === "loading"}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
          Bericht
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="Schrijf hier je bericht..."
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={state === "loading"}
          className={`${inputClass} resize-none`}
        />
      </div>

      {state === "error" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          Er ging iets mis. Probeer het opnieuw of stuur een e-mail rechtstreeks.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading" || !name || !email || !subject || !message}
        className="mt-1 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === "loading" ? "Verzenden…" : "Verstuur bericht"}
      </button>
    </form>
  );
}
