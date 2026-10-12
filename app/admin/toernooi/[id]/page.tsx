"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { isTeamComplete } from "@/lib/tournament-phase";
import { useTournament } from "./tournament-context";

interface Step {
  title: string;
  sub: string;
  done: boolean;
  href?: string;
  action?: string;
  body?: React.ReactNode;
}

function Progress({ label, value, of, tone }: Readonly<{ label: string; value: number; of: number; tone: "pink" | "ink" }>) {
  const pct = of > 0 ? Math.round((value / of) * 100) : 0;
  return (
    <div className="rounded-xl border border-rule bg-surface px-3.5 py-3">
      <div className="flex justify-between text-[13px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono font-semibold tabular-nums">{value} / {of}</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-rule">
        <div className={`h-full ${tone === "pink" ? "bg-pink" : "bg-ink"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CopyLink({ url }: Readonly<{ url: string }>) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* klembord niet beschikbaar */ }
  }
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-paper px-3 py-2.5">
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-2">{url.replace(/^https?:\/\//, "")}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Gekopieerd" : "Link kopiëren"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rule bg-surface text-ink-2 hover:text-ink"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function TournamentOverviewPage() {
  const { tournament: t } = useTournament();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(globalThis.location.origin), []);

  const base = `/admin/toernooi/${t.id}`;
  const teams = t.teams.length;
  const complete = t.teams.filter(isTeamComplete).length;
  const present = t.teams.filter((x) => x.isPresent).length;
  const poules = t.poules.filter((p) => p.phase === "GROUP_STAGE").length;
  const groupMatches = t.matches.filter((m) => m.phase === "GROUP_STAGE");
  const koMatches = t.matches.filter((m) => m.phase !== "GROUP_STAGE");
  const played = (ms: typeof t.matches) => ms.filter((m) => m.scoreA !== null && m.scoreB !== null).length;
  const deadline = t.teamEditDeadline
    ? new Date(t.teamEditDeadline).toLocaleDateString("nl-BE", { day: "numeric", month: "long" })
    : null;

  const perPoule = t.teamsPerPoule ?? 4;
  const adv = t.teamsAdvancingPerPoule ?? 2;
  const best = t.bestNthsAdvancing ?? 0;

  const steps: Step[] = [
    {
      title: "Toernooi ingesteld",
      sub: `Poules van ${perPoule} · top ${adv} door${best ? ` + ${best} beste ${adv + 1}des` : ""} · ${t.trackCount ?? "?"} banen`,
      done: true,
      href: `${base}/instellingen`,
      action: "Wijzigen",
    },
    {
      title: "Teams verzamelen",
      sub: deadline ? `Teams kunnen zichzelf aanpassen tot ${deadline}.` : "Geen deadline ingesteld voor zelf aanpassen.",
      done: poules > 0,
      href: `${base}/teams`,
      action: "Teams beheren",
      body: teams > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-rule bg-surface px-3.5 py-3">
            <p className="text-[13px] text-ink-2">Ingeschreven</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{teams} teams</p>
          </div>
          <Progress label="Volledig (4 spelers)" value={complete} of={teams} tone="pink" />
        </div>
      ),
    },
    {
      title: "Poules loten",
      sub: poules > 0 ? `${poules} poules geloot.` : `${teams} teams → ${Math.ceil(teams / perPoule) || 0} poules van ${perPoule}.`,
      done: poules > 0,
      href: `${base}/schema`,
      action: poules > 0 ? "Bekijken" : "Loten",
    },
    {
      title: "Poulewedstrijden genereren",
      sub: groupMatches.length > 0 ? `${groupMatches.length} wedstrijden ingepland.` : "Wedstrijden over de banen verdelen met starttijden.",
      done: groupMatches.length > 0,
      href: `${base}/schema`,
      action: groupMatches.length > 0 ? "Bekijken" : "Genereren",
    },
    {
      title: "Eventdag: aanmelden & scores",
      sub: "Teams melden zich aan, daarna de uitslagen per baan.",
      done: groupMatches.length > 0 && played(groupMatches) === groupMatches.length,
      href: `${base}/scores`,
      action: "Scores",
      body: groupMatches.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Progress label="Aanwezig" value={present} of={teams} tone="pink" />
          <Progress label="Poulewedstrijden gespeeld" value={played(groupMatches)} of={groupMatches.length} tone="ink" />
        </div>
      ),
    },
    {
      title: "Knock-out",
      sub: koMatches.length > 0
        ? `${played(koMatches)} van ${koMatches.length} wedstrijden gespeeld.`
        : "Wordt automatisch opgemaakt na de laatste poulematch.",
      done: t.status === "COMPLETED" || (koMatches.length > 0 && played(koMatches) === koMatches.length),
      href: koMatches.length > 0 ? `${base}/scores` : undefined,
      action: "Scores",
    },
  ];
  const current = steps.findIndex((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section aria-labelledby="steps-title" className="min-w-0 flex-[999_1_520px] overflow-hidden rounded-2xl border border-rule bg-surface">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 id="steps-title" className="text-base font-semibold">Op weg naar de toernooidag</h2>
            <p className="mt-0.5 text-[13px] text-ink-2">Wat er klaar is, en wat nu aan de beurt is.</p>
          </div>
          <span className="font-mono text-[13px] text-ink-2">{doneCount} / {steps.length}</span>
        </div>
        <ol>
          {steps.map((s, i) => {
            const isCurrent = i === current;
            return (
              <li key={s.title} className={`flex items-start gap-4 border-t border-rule px-5 py-4 ${isCurrent ? "bg-paper" : ""}`}>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                    s.done
                      ? "bg-[var(--ok-bg)] text-[var(--ok-fg)]"
                      : isCurrent
                        ? "bg-pink text-[#16161a]"
                        : "border-[1.5px] border-rule text-ink-2"
                  }`}
                  aria-hidden
                >
                  {s.done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-[15px] font-semibold ${!s.done && !isCurrent ? "text-ink-2" : ""}`}>{s.title}</p>
                      {isCurrent && (
                        <span className="rounded-full bg-pink-soft px-2 py-px text-[11px] font-semibold text-pink-ink">Nu bezig</span>
                      )}
                      <span className="sr-only">{s.done ? "(klaar)" : ""}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-2">{s.sub}</p>
                  </div>
                  {isCurrent && s.body}
                  {isCurrent && s.href && (
                    <span className="sm:hidden">
                      <Link href={s.href} className="btn-sm btn-sm--primary">{s.action}</Link>
                    </span>
                  )}
                </div>
                {s.href && (s.done || isCurrent) && (
                  <span className={isCurrent ? "hidden shrink-0 sm:block" : "shrink-0"}>
                    <Link
                      href={s.href}
                      className={isCurrent ? "btn-sm btn-sm--primary" : "text-[13px] font-semibold text-ink-2 hover:text-ink"}
                    >
                      {s.action}
                    </Link>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
        <section aria-labelledby="fmt-title" className="rounded-2xl border border-rule bg-surface px-5 pb-2 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="fmt-title" className="text-[15px] font-semibold">Formaat</h2>
            <Link href={`${base}/instellingen`} className="text-[13px] font-semibold text-ink-2 hover:text-ink">Instellingen</Link>
          </div>
          {[
            ["Teams per poule", String(perPoule)],
            ["Door naar knock-out", `Top ${adv}${best ? ` + ${best} beste ${adv + 1}des` : ""}`],
            ["Banen", String(t.trackCount ?? "—")],
            ["Kleine finale", t.withConsolation ?? true ? "Ja" : "Nee"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-t border-rule py-2.5 text-sm">
              <span className="text-ink-2">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </section>

        {origin && (
          <section aria-labelledby="share-title" className="flex flex-col gap-3 rounded-2xl border border-rule bg-surface p-5">
            <h2 id="share-title" className="text-[15px] font-semibold">Delen</h2>
            <p className="text-[13px] text-ink-2">Zelf-inschrijving voor teams</p>
            <CopyLink url={`${origin}/team-aanmelden`} />
            <p className="text-[13px] text-ink-2">Publieke toernooipagina</p>
            <CopyLink url={`${origin}/toernooi/${t.id}`} />
          </section>
        )}
      </div>
    </div>
  );
}
