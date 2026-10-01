"use client";

import { use, useEffect, useRef, useState } from "react";

import { API_BASE } from "@/lib/api";
import type { TeamPortalData } from "@/lib/tournament-types";
import { MatchBlock, PageHead, SectionHead } from "../../toernooi/[id]/_shared";
import { TournamentHeader } from "../../toernooi/[id]/tournament-header";

/** Teamlogo tijdelijk uit — zet op true om de upload terug te tonen. */
const SHOW_LOGO = false;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
/** Waar het logo naartoe verkleind wordt voor het vertrekt. Een clubembleem
 *  van 256px is ruim genoeg en houdt de databank licht. */
const LOGO_EDGE = 256;

/** Schaalt de gekozen afbeelding terug en levert een webp data-URI op. */
async function shrinkToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LOGO_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Deze browser kan de afbeelding niet verkleinen.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return canvas.toDataURL("image/webp", 0.85);
}

function formatDeadline(iso: string): string {
  return new Date(iso).toLocaleString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeamPortalPage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = use(params);

  const [data, setData] = useState<TeamPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const [logoBusy, setLogoBusy] = useState(false);
  const [logoError, setLogoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Bewust géén apiFetch: die stuurt de admin-bearer mee en gooit je bij een
    // 401 naar /login. Dit portaal is publiek, de token is de sleutel.
    fetch(`${API_BASE}tournaments/teams/portal/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? "Deze link is niet (meer) geldig.");
        }
        return res.json() as Promise<TeamPortalData>;
      })
      .then((d) => {
        setData(d);
        setName(d.team.name);
        setPlayers([d.team.speler1, d.team.speler2, d.team.speler3, d.team.speler4]);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Er ging iets mis."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !name.trim()) return;
    setSaveError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}tournaments/teams/portal/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          speler1: players[0].trim(),
          speler2: players[1].trim(),
          speler3: players[2].trim(),
          speler4: players[3].trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Opslaan mislukt.");
      }
      const updated = (await res.json()) as TeamPortalData;
      setData(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    setLogoError("");

    if (!file.type.startsWith("image/")) {
      setLogoError("Kies een afbeelding.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Die afbeelding is groter dan 2 MB.");
      return;
    }

    setLogoBusy(true);
    try {
      const dataUrl = await shrinkToDataUrl(file);
      const res = await fetch(
        `${API_BASE}tournaments/teams/portal/${encodeURIComponent(token)}/logo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Uploaden mislukt.");
      }
      const { logoUrl } = (await res.json()) as { logoUrl: string };
      setData({ ...data, team: { ...data.team, logoUrl } });
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Uploaden mislukt.");
    } finally {
      setLogoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-5xl px-5 py-16 text-sm text-ink-2">Laden…</p>;
  }

  if (loadError || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-5">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-2">
            Ongeldige link
          </p>
          <h1 className="mb-3 text-2xl font-bold text-ink">Deze teamlink werkt niet</h1>
          <p className="text-sm text-ink-2">
            {loadError || "Vraag een nieuwe link aan de wedstrijdtafel."}
          </p>
        </div>
      </div>
    );
  }

  const { tournament, team, poule, matches, teams, canEdit, editDeadline } = data;
  const locked = !canEdit;

  return (
    <div>
      <TournamentHeader
        id={String(tournament.id)}
        name={tournament.name}
        year={tournament.year}
        isActive={tournament.isActive}
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
        <PageHead
          title="Mijn team"
          subtitle={poule ? `${team.name} · ${poule.name}` : team.name}
        />

        {/* ── Deadline ──────────────────────────────────────── */}
        {editDeadline && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              locked
                ? "border-rule bg-surface text-ink-2"
                : "border-pink/20 bg-pink-soft text-ink"
            }`}
          >
            {locked ? (
              <>
                Aanpassen is gesloten sinds {formatDeadline(editDeadline)}. Klopt er iets niet?
                Spreek de wedstrijdtafel aan.
              </>
            ) : (
              <>
                Vul je ploeg aan tot <strong>{formatDeadline(editDeadline)}</strong>. Daarna gaat
                het op slot.
              </>
            )}
          </div>
        )}

        {/* ── Ploeg ─────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="rounded-2xl border border-rule bg-surface px-6 py-6">
          <SectionHead title="Ploeg" />

          {saveError && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </p>
          )}

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
                Teamnaam
              </span>
              <input
                type="text"
                required
                disabled={locked || saving}
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false); }}
                className="h-11 rounded-xl border border-rule bg-paper px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-pink/30 disabled:opacity-60"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              {players.map((value, i) => (
                <label key={`speler-${i + 1}`} className="flex flex-col gap-1.5">
                  <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-2">
                    Speler {i + 1}
                  </span>
                  <input
                    type="text"
                    disabled={locked || saving}
                    value={value}
                    onChange={(e) => {
                      setPlayers((prev) => prev.map((p, j) => (j === i ? e.target.value : p)));
                      setSaved(false);
                    }}
                    className="h-11 rounded-xl border border-rule bg-paper px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-pink/30 disabled:opacity-60"
                  />
                </label>
              ))}
            </div>

            <p className="text-xs text-ink-2">
              Je speelt met vier spelers. Namen mogen later nog, zolang de deadline niet
              verstreken is.
            </p>
          </div>

          {!locked && (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="rounded-full bg-pink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pink/85 disabled:opacity-50"
              >
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
              {saved && <span className="text-sm text-ink-2">✓ Bewaard</span>}
            </div>
          )}
        </form>

        {/* ── Logo ──────────────────────────────────────────── */}
        {SHOW_LOGO && (
        <div className="rounded-2xl border border-rule bg-surface px-6 py-6">
          <SectionHead title="Teamlogo" />
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-rule bg-paper">
              {team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-ink/35">
                  Geen
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              {locked ? (
                <p className="text-sm text-ink-2">Aanpassen is gesloten.</p>
              ) : (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    disabled={logoBusy}
                    onChange={handleLogo}
                    className="block w-full text-sm text-ink-2 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-pink-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-pink-ink"
                  />
                  <p className="mt-2 text-xs text-ink-2">
                    {logoBusy ? "Bezig met uploaden…" : "Vierkant werkt het best. Max 2 MB."}
                  </p>
                </>
              )}
              {logoError && <p className="mt-2 text-xs text-red-600">{logoError}</p>}
            </div>
          </div>
        </div>
        )}

        {/* ── Wedstrijden ───────────────────────────────────── */}
        {matches.length > 0 && (
          <div>
            <SectionHead title="Jullie wedstrijden" />
            <div className="grid gap-3 sm:grid-cols-2">
              {matches.map((m) => (
                <MatchBlock key={m.id} match={m} teams={teams} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
