"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { IconPlus, IconTrash } from "@/components/ui/icons";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole = "MEMBER" | "CAPTAIN" | "REFEREE" | "ADMIN" | "SUPERADMIN";

interface InviteCode {
  id: number;
  code: string;
  role: UserRole;
  label: string | null;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: "Lid",
  CAPTAIN: "Kapitein",
  REFEREE: "Scheidsrechter",
  ADMIN: "Beheerder",
  SUPERADMIN: "Hoofdbeheerder",
};

const ALL_ROLES: UserRole[] = ["MEMBER", "CAPTAIN", "REFEREE", "ADMIN", "SUPERADMIN"];

// ── Sub-components ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: Readonly<{ role: UserRole }>) {
  const colors: Record<UserRole, string> = {
    MEMBER:     "bg-blue-100 text-blue-700",
    CAPTAIN:    "bg-purple-100 text-purple-700",
    REFEREE:    "bg-yellow-100 text-yellow-700",
    ADMIN:      "bg-orange-100 text-orange-700",
    SUPERADMIN: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function CopyButton({ text }: Readonly<{ text: string }>) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-pink hover:underline focus:outline-none"
      title="Kopieer link"
    >
      {copied ? "Gekopieerd!" : "Kopieer link"}
    </button>
  );
}

// ── Create form ────────────────────────────────────────────────────────────────

interface CreateFormProps {
  onCreated: (code: InviteCode) => void;
}

function CreateForm({ onCreated }: CreateFormProps) {
  const [role, setRole]   = useState<UserRole>("MEMBER");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const code = await apiFetch<InviteCode>("invite-codes", {
        method: "POST",
        body: JSON.stringify({ role, label: label.trim() || undefined }),
      });
      onCreated(code);
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmaken mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 p-4 bg-surface border border-rule rounded-xl">
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-ink-2">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          disabled={loading}
          className="rounded-lg border border-rule bg-paper px-2.5 py-2 text-sm text-ink focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:cursor-not-allowed"
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-xs font-medium text-ink-2">Label (optioneel)</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="bijv. Scheidsrechters 2026"
          disabled={loading}
          className="rounded-lg border border-rule bg-paper px-2.5 py-2 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:cursor-not-allowed"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-pink px-3.5 py-2 text-sm font-semibold text-white hover:bg-pink/90 focus:outline-none focus:ring-2 focus:ring-pink/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <IconPlus />
        {loading ? "Aanmaken…" : "Code aanmaken"}
      </button>

      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUitnodigingenPage() {
  const [codes, setCodes]       = useState<InviteCode[]>([]);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    apiFetch<InviteCode[]>("invite-codes")
      .then(setCodes)
      .catch((err) => setFetchError(err instanceof Error ? err.message : "Laden mislukt."))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(code: InviteCode) {
    setCodes((prev) => [code, ...prev]);
  }

  async function handleToggle(id: number) {
    try {
      const updated = await apiFetch<InviteCode>(`invite-codes/${id}/toggle`, { method: "PATCH" });
      setCodes((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      // swallow — UI stays consistent
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Code verwijderen?")) return;
    try {
      await apiFetch(`invite-codes/${id}`, { method: "DELETE" });
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // swallow
    }
  }

  const registerBase = typeof window !== "undefined"
    ? `${window.location.origin}/register?code=`
    : `/register?code=`;

  return (
    <>
      <div className="admin-page-header">
        <h1>Uitnodigingen</h1>
        <p>Beheer uitnodigingscodes voor nieuwe accounts. Deel de link met de ontvanger.</p>
        {fetchError && (
          <div style={{ marginTop: "1rem", padding: "0.65rem 1rem", borderRadius: "10px", background: "#fdecea", color: "#c5221f", fontSize: "0.875rem", fontWeight: 500 }}>
            Kon uitnodigingen niet laden: <strong>{fetchError}</strong>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <CreateForm onCreated={handleCreated} />

        {loading ? (
          <p className="text-sm text-ink-2 px-1">Laden…</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-ink-2 px-1">Nog geen codes aangemaakt.</p>
        ) : (
          <div className="rounded-xl border border-rule overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-rule text-left text-xs font-semibold text-ink-2 uppercase tracking-wide">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3 text-center">Gebruik</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Registratielink</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {codes.map((c) => (
                  <tr key={c.id} className="bg-paper hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-ink tracking-widest">{c.code}</td>
                    <td className="px-4 py-3"><RoleBadge role={c.role} /></td>
                    <td className="px-4 py-3 text-ink-2">{c.label ?? <span className="text-ink-2/50">—</span>}</td>
                    <td className="px-4 py-3 text-center text-ink-2">{c.usedCount}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(c.id)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                          c.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {c.isActive ? "Actief" : "Inactief"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive ? (
                        <CopyButton text={`${registerBase}${c.code}`} />
                      ) : (
                        <span className="text-xs text-ink-2/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Verwijderen"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
