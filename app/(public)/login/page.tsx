"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthService from "@/services/AuthService";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (AuthService.isAuthenticated()) router.replace("/admin");
  }, [router]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await AuthService.login(identifier, password);
      if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        AuthService.logout();
        setError("Uw account heeft geen beheerderstoegang.");
        return;
      }
      globalThis.location.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmelden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-rule shadow-sm p-8">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-pink shrink-0" aria-hidden="true" />
          <div className="leading-tight">
            <p className="font-semibold text-ink text-base">De Flosj</p>
            <p className="text-[0.6rem] font-semibold tracking-widest text-ink-2 uppercase font-mono">Beheer</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-ink mb-1 tracking-tight">Aanmelden</h1>
        <p className="text-sm text-ink-2 mb-6">Meld u aan om het beheerderspaneel te openen.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="identifier" className="block text-sm font-medium text-ink-2">
              E-mail of gebruikersnaam
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-2 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:bg-surface disabled:cursor-not-allowed transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !identifier || !password}
            className="w-full rounded-xl bg-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink/90 focus:outline-none focus:ring-2 focus:ring-pink/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
          >
            {loading ? "Aanmelden…" : "Aanmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}
