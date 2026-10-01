"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const input =
  "w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-ink-2 focus:outline-none focus:border-pink focus:ring-2 focus:ring-pink/15 disabled:cursor-not-allowed";

/** Publieke aanmeldpagina — hier komt de QR-code in het café op uit. */
export default function TeamAanmeldenPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}tournaments/active/self-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          captainName,
          email: email.trim() || null,
          phone,
          speler1: players[0],
          speler2: players[1],
          speler3: players[2],
          speler4: players[3],
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
      if (!res.ok || !body.token) throw new Error(body.message ?? `Er ging iets mis (${res.status})`);
      router.replace(`/mijn-team/${body.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aanmelden mislukt");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-rule shadow-sm p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-widest uppercase text-pink font-mono">De Flosj · Toernooi</p>
        <h1 className="mt-1 text-2xl font-bold text-ink tracking-tight">Schrijf je team in</h1>
        <p className="mt-1 mb-6 text-sm text-ink-2">
          Daarna krijg je de link naar jullie teampagina. Bewaar die goed — daarmee pas je later alles aan.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">{error}</p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="team" className="block text-sm font-medium text-ink-2">Teamnaam *</label>
            <input id="team" className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required disabled={loading} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="captain" className="block text-sm font-medium text-ink-2">Naam kapitein *</label>
            <input id="captain" className={input} value={captainName} onChange={(e) => setCaptainName(e.target.value)} maxLength={80} required disabled={loading} autoComplete="name" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-sm font-medium text-ink-2">Gsm-nummer kapitein *</label>
            <input id="phone" type="tel" inputMode="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} required disabled={loading} autoComplete="tel" placeholder="04xx xx xx xx" />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-ink-2">E-mail kapitein *</label>
            <input id="email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email" placeholder="hier sturen we alle info naartoe" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink-2 mb-1.5">Spelers (mag je later aanvullen)</legend>
            {players.map((p, i) => (
              <input
                key={i}
                className={input}
                value={p}
                placeholder={`Speler ${i + 1}`}
                maxLength={80}
                disabled={loading}
                onChange={(e) => setPlayers((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
          </fieldset>

          <button
            type="submit"
            disabled={loading || !name.trim() || !captainName.trim() || !phone.trim() || !email.trim()}
            className="w-full rounded-xl bg-pink px-4 py-3 text-base font-semibold text-white hover:bg-pink/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            {loading ? "Bezig…" : "Team inschrijven"}
          </button>
        </form>
      </div>
    </div>
  );
}
