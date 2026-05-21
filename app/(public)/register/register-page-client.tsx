"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE, setToken } from "@/lib/api";
import AuthService from "@/services/AuthService";

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Lid",
  CAPTAIN: "Kapitein",
  REFEREE: "Scheidsrechter",
  ADMIN: "Beheerder",
  SUPERADMIN: "Hoofdbeheerder",
};

export default function RegisterPageClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState(params.get("code") ?? "");
  const [codeRole, setCodeRole] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (AuthService.isAuthenticated()) router.replace("/admin");
  }, [router]);

  useEffect(() => {
    const code = params.get("code");
    if (code) validateInviteCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateInviteCode(code: string) {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCodeRole(null);
      setCodeError("");
      return;
    }
    setValidating(true);
    setCodeError("");
    setCodeRole(null);
    try {
      const res = await fetch(`${API_BASE}auth/validate-invite/${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setCodeError(body.message ?? "Ongeldige code");
      } else {
        const data = (await res.json()) as { role: string };
        setCodeRole(data.role);
      }
    } catch {
      setCodeError("Kon de code niet valideren");
    } finally {
      setValidating(false);
    }
  }

  function handleCodeBlur() {
    validateInviteCode(inviteCode);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }
    if (codeError || !codeRole) {
      setError("Voer een geldige uitnodigingscode in");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, inviteCode: inviteCode.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { token: string };
      setToken(data.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registratie mislukt");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email && username && password && confirm && inviteCode && codeRole && !codeError && !loading;
  let inviteCodeClassName = "border-rule bg-paper focus:border-pink focus:ring-pink/15";
  if (codeError) {
    inviteCodeClassName = "border-red-400 focus:border-red-400 focus:ring-red-200";
  } else if (codeRole) {
    inviteCodeClassName = "border-green-400 focus:border-green-400 focus:ring-green-200";
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-rule shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-pink shrink-0" aria-hidden="true" />
          <div className="leading-tight">
            <p className="font-semibold text-ink text-base">De Flosj</p>
            <p className="text-[0.6rem] font-semibold tracking-widest text-ink-2 uppercase font-mono">Registreren</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-1 tracking-tight">Account aanmaken</h1>
        <p className="text-sm text-ink-2 mb-6">U heeft een uitnodigingscode nodig om te registreren.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-ink-2">
              Uitnodigingscode
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setCodeRole(null);
                setCodeError("");
              }}
              onBlur={handleCodeBlur}
              placeholder="bijv. A3F9D21B7C"
              required
              disabled={loading}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 disabled:bg-surface disabled:cursor-not-allowed transition-colors font-mono tracking-widest uppercase ${inviteCodeClassName}`}
            />
            {validating && <p className="text-xs text-ink-2">Code valideren…</p>}
            {codeError && <p className="text-xs text-red-600">{codeError}</p>}
            {codeRole && (
              <p className="text-xs text-green-700 font-medium">
                Geldig — rol: {ROLE_LABELS[codeRole] ?? codeRole}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-ink-2">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:bg-surface disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm font-medium text-ink-2">
              Gebruikersnaam
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:bg-surface disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-ink-2">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:bg-surface disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-medium text-ink-2">
              Wachtwoord bevestigen
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:bg-surface disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink/90 focus:outline-none focus:ring-2 focus:ring-pink/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
          >
            {loading ? "Registreren…" : "Account aanmaken"}
          </button>
        </form>
      </div>
    </div>
  );
}