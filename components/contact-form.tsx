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
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl font-bold">
          ✓
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Bericht verstuurd</h3>
        <p className="text-sm leading-relaxed text-gray-500">
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
          className="mt-2 text-sm font-semibold text-gray-900 hover:underline"
        >
          Nieuw bericht sturen →
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-gray-400">
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
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-gray-400">
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
        <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-widest text-gray-400">
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
        <label htmlFor="message" className="text-xs font-semibold uppercase tracking-widest text-gray-400">
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
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          Er ging iets mis. Probeer het opnieuw of stuur een e-mail rechtstreeks.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading" || !name || !email || !subject || !message}
        className="mt-1 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === "loading" ? "Verzenden…" : "Verstuur bericht"}
      </button>
    </form>
  );
}
