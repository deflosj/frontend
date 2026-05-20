"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";
import { RSVPStatus } from "@/types/shifts";

interface RsvpFormProps {
  eventId: number;
  token: string;
}

export function RsvpForm({ eventId, token }: Readonly<RsvpFormProps>) {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<RSVPStatus>("YES");
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  async function submit() {
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE}events/${eventId}/portal/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, status, token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmelden mislukt.");
    } finally { setSaving(false); }
  }

  if (done) {
    return (
      <div className="p-6 bg-green-50 rounded-2xl text-center">
        <p className="m-0 font-semibold text-green-700">
          {status === "YES" ? "Super, je bent ingeschreven voor het feestje!" : "Jammer, we zetten je op de lijst als afwezig."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-muted rounded-2xl border border-rule">
      <h3 className="mb-1.5 text-[1.1rem] font-semibold text-ink">
        Ben je erbij op het feestje?
      </h3>
      <p className="mb-5 text-[0.875rem] text-ink-2">
        Laat weten of je de bedankingsborrel erbij bent.
      </p>

      {error && (
        <p className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 text-red-700 text-[0.85rem]">
          {error}
        </p>
      )}

      <div className="grid gap-3 mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jouw naam *"
          disabled={saving}
          className="px-3.5 py-2.5 border border-rule rounded-[10px] text-[0.9rem] outline-none font-[inherit] bg-surface text-ink placeholder:text-ink-2/50"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail (optioneel)"
          disabled={saving}
          className="px-3.5 py-2.5 border border-rule rounded-[10px] text-[0.9rem] outline-none font-[inherit] bg-surface text-ink placeholder:text-ink-2/50"
        />
        <div className="flex gap-3">
          {(["YES", "NO"] as const).map((s) => {
            const activeClass = s === "YES"
              ? "border-green-600 bg-green-50 text-green-700 font-semibold"
              : "border-red-600 bg-red-50 text-red-700 font-semibold";
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2.5 rounded-lg border-2 text-[0.9rem] cursor-pointer font-[inherit] transition-colors ${
                  status === s ? activeClass : "border-rule bg-transparent text-ink-2"
                }`}
              >
                {s === "YES" ? "Ja, ik ben erbij!" : "Helaas, ik kan niet"}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving || !name.trim()}
        className="w-full py-2.5 rounded-lg border-0 bg-ink text-paper text-[0.9rem] font-medium cursor-pointer font-[inherit] disabled:opacity-50"
      >
        {saving ? "Bezig…" : "Aanmelden"}
      </button>
    </div>
  );
}
