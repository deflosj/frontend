import type { Metadata } from "next";
import { RegistrationForm } from "@/components/registration-form";
import { BackLink } from "@/components/ui/back-link";

export const metadata: Metadata = {
  title: "Inschrijven | Dorpelingenkoers",
  description: "Schrijf je in voor de dorpelingenkoers of fun wedstrijd van De Flosj.",
};

export default function InschrijvenPage() {
  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
          <BackLink href="/dorpelingenkoers" className="mb-5">Dorpelingenkoers</BackLink>
          <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
            Inschrijving
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Schrijf je in
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            Vul het formulier volledig in. Na beoordeling ontvang je een bevestiging per e-mail.
          </p>
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <RegistrationForm />
      </div>
    </div>
  );
}
