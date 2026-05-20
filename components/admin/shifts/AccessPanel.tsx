import { apiFetch } from "@/lib/api";
import { useState } from "react";

export function AccessPanel({ eventId }: Readonly<{ eventId: number }>) {
  const tokenKey = `deflosj_invite_${eventId}`;
  const [token, setToken] = useState<string | null>(() => {
    if (globalThis.window === undefined) return null;
    return localStorage.getItem(tokenKey);
  });
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = globalThis.window !== undefined ? globalThis.window.location.origin : "";
  const inviteUrl = token ? `${origin}/helpers/${token}` : null;

  async function generate() {
    setGenerating(true);
    try {
      const { token: t } = await apiFetch<{ token: string }>(`events/${eventId}/portal/invite`, { method: "POST" });
      setToken(t);
      localStorage.setItem(tokenKey, t);
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="admin-table-wrapper">
      <div className="admin-table-header">
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>Uitnodigingslink</h2>
      </div>
      <div style={{ padding: "1.1rem 1.4rem", display: "grid", gap: "1rem" }}>
        <div>
          <button type="button" className="btn-sm btn-sm--primary" onClick={generate} disabled={generating}>
            {generating ? "Genereren…" : token ? "Nieuwe link genereren" : "Link genereren"}
          </button>

          {inviteUrl && (
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.4rem" }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>Deel met je helpers:</p>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <code style={{ flex: 1, padding: "0.35rem 0.55rem", background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "7px", fontSize: "0.65rem", color: "var(--text-2)", wordBreak: "break-all" }}>
                  {inviteUrl}
                </code>
              </div>
              <button type="button" className="btn-sm btn-sm--ghost" onClick={copy} style={{ flexShrink: 0, fontSize: "0.75rem" }}>
                {copied ? "✓ Gekopieerd" : "Kopieer"}
              </button>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.875rem" }}>
          <div style={{ display: "grid", gap: "0.35rem", fontSize: "0.78rem", color: "var(--text-2)" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge--pink" style={{ flexShrink: 0, alignSelf: "flex-start" }}>Admin</span>
              <span>Taken beheren, aanwezigenlijst, CSV exporteren.</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span className="badge badge--blue" style={{ flexShrink: 0, alignSelf: "flex-start" }}>Helper</span>
              <span>Taken bekijken en claimen via de link.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}