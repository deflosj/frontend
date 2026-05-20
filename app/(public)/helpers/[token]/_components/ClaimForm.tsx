"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api";
import { Task } from "@/types/shifts";

interface ClaimFormProps {
  task: Task;
  token: string;
  onClaimed: (taskId: number, assigneeName: string) => void;
  onCancel: () => void;
}

export function ClaimForm({ task, token, onClaimed, onCancel }: Readonly<ClaimFormProps>) {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  async function claim() {
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(
        `${API_BASE}events/${task.eventId}/portal/tasks/${task.id}/claim?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      onClaimed(task.id, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Overnemen mislukt.");
    } finally { setSaving(false); }
  }

  const spotsLeft = task.maxHelpers === null ? null : task.maxHelpers - task.assignees.length;

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
      <div className="bg-paper rounded-2xl p-8 w-full max-w-105 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
        <h2 className="mb-1.5 text-[1.2rem] font-semibold text-ink">
          Taak overnemen
        </h2>
        <p className="mb-1.5 text-[0.9rem] text-ink-2">
          <strong className="text-ink">{task.title}</strong> — vul je gegevens in.
        </p>
        {spotsLeft !== null && (
          <p className="mb-5 text-[0.8rem] text-ink-2">
            Nog {spotsLeft} {spotsLeft === 1 ? "plek" : "plekken"} beschikbaar
          </p>
        )}

        {error && (
          <p className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 text-red-700 text-[0.85rem]">
            {error}
          </p>
        )}

        <div className="grid gap-3 mb-5">
          <div>
            <label htmlFor="claim-name" className="block text-[0.8rem] font-medium text-ink-2 mb-1.5">
              Naam *
            </label>
            <input
              id="claim-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jouw naam"
              disabled={saving}
              onKeyDown={(e) => e.key === "Enter" && claim()}
              className="w-full px-3.5 py-2.5 border border-rule rounded-[10px] text-[0.9rem] outline-none font-[inherit] box-border bg-surface text-ink placeholder:text-ink-2/50"
            />
          </div>
          <div>
            <label htmlFor="claim-email" className="block text-[0.8rem] font-medium text-ink-2 mb-1.5">
              E-mail (optioneel)
            </label>
            <input
              id="claim-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.be"
              disabled={saving}
              className="w-full px-3.5 py-2.5 border border-rule rounded-[10px] text-[0.9rem] outline-none font-[inherit] box-border bg-surface text-ink placeholder:text-ink-2/50"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={claim}
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 rounded-lg border-0 bg-ink text-paper text-[0.9rem] font-medium cursor-pointer font-[inherit] disabled:opacity-50"
          >
            {saving ? "Bezig…" : "Taak overnemen"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg border border-rule bg-transparent text-ink-2 text-[0.9rem] cursor-pointer font-[inherit] disabled:opacity-50"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
