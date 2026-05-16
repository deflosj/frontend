"use client";

import { useState } from "react";
import Link from "next/link";
import type { RaceCategory } from "@/lib/registration-types";

type FormState = "idle" | "loading" | "success" | "error";

// ── Animated underline field ──────────────────────────────────────────────────

function Field({
  id,
  label,
  required = false,
  children,
}: Readonly<{ id: string; label: string; required?: boolean; children: React.ReactNode }>) {
  return (
    <div className="group/field flex flex-col gap-2.5">
      <label
        htmlFor={id}
        className="text-[0.625rem] font-semibold uppercase tracking-widest text-muted transition-colors duration-200 group-focus-within/field:text-ink"
      >
        {label}
        {required && <span className="ml-1 text-pink">*</span>}
      </label>
      <div className="relative pb-px">
        {children}
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-rule" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-pink transition-[width] duration-300 ease-out group-focus-within/field:w-full" />
      </div>
    </div>
  );
}

const inputBase =
  "w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-muted/40 outline-none disabled:cursor-not-allowed disabled:opacity-60";

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="mb-5 border-b border-rule pb-3 text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
      {children}
    </p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RegistrationForm() {
  const [state, setState] = useState<FormState>("idle");
  const [raceCategory, setRaceCategory] = useState<RaceCategory>("DORPELINGENKOERS");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"M" | "V" | "X">("M");
  const [address, setAddress] = useState("");
  const [nationalRegisterNumber, setNationalRegisterNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wielerclub, setWielerclub] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit =
    Boolean(firstName && lastName && dateOfBirth && address && nationalRegisterNumber && email && phone) &&
    state !== "loading";

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!canSubmit) return;
    setState("loading");
    setErrorMsg("");
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
      const res = await fetch(`${BASE}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          gender,
          address: address.trim(),
          nationalRegisterNumber: nationalRegisterNumber.trim(),
          email: email.trim(),
          phone: phone.trim(),
          wielerclub: wielerclub.trim() || null,
          raceCategory,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan. Probeer opnieuw.");
      setState("error");
    }
  }

  // ── Success ─────────────────────────────────────────────────────────────────

  if (state === "success") {
    return (
      <div className="py-16 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-pink-soft text-pink">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path
              d="M5.5 14l6 6 11-12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mb-3 text-2xl font-bold text-ink">Inschrijving ontvangen!</h2>
        <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-ink-2">
          Bedankt voor je inschrijving voor de{" "}
          <strong>
            {raceCategory === "DORPELINGENKOERS" ? "Dorpelingenkoers" : "Fun wedstrijd"}
          </strong>
          . Je ontvangt een bevestiging zodra je inschrijving goedgekeurd is.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/dorpelingenkoers"
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-ink/80"
          >
            ← Terug naar de koerspagina
          </Link>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setFirstName(""); setLastName(""); setDateOfBirth(""); setGender("M");
              setAddress(""); setNationalRegisterNumber(""); setEmail(""); setPhone("");
              setWielerclub("");
            }}
            className="rounded-full border border-rule px-6 py-3 text-sm font-semibold text-ink-2 transition-colors hover:border-ink/20 hover:text-ink"
          >
            Nog iemand inschrijven
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10">
      {/* Race type selector */}
      <div>
        <p className="mb-3 text-[0.625rem] font-semibold uppercase tracking-widest text-muted">
          Kies jouw wedstrijd <span className="text-pink">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                value: "DORPELINGENKOERS" as RaceCategory,
                label: "Dorpelingenkoers",
                desc: "Voor inwoners van het dorp",
              },
              {
                value: "FUN_WEDSTRIJD" as RaceCategory,
                label: "Fun wedstrijd",
                desc: "Voor iedereen, recreatief",
              },
            ] as const
          ).map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRaceCategory(value)}
              className={`rounded-2xl border-2 px-5 py-4 text-left transition-all duration-150 ${
                raceCategory === value
                  ? "border-pink bg-pink-soft"
                  : "border-rule bg-surface hover:border-ink/20"
              }`}
            >
              <p
                className={`font-semibold ${raceCategory === value ? "text-pink" : "text-ink"}`}
              >
                {label}
              </p>
              <p className="mt-0.5 text-xs text-muted">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
        {/* Persoonsgegevens */}
        <div>
          <SectionHeading>Persoonsgegevens</SectionHeading>
          <div className="flex flex-col gap-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <Field id="firstName" label="Voornaam" required>
                <input
                  id="firstName" type="text" placeholder="Jan" required
                  autoComplete="given-name" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={state === "loading"} className={inputBase}
                />
              </Field>
              <Field id="lastName" label="Achternaam" required>
                <input
                  id="lastName" type="text" placeholder="Janssen" required
                  autoComplete="family-name" value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={state === "loading"} className={inputBase}
                />
              </Field>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field id="dateOfBirth" label="Geboortedatum" required>
                <input
                  id="dateOfBirth" type="date" required value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={state === "loading"} className={inputBase}
                />
              </Field>
              <Field id="gender" label="Geslacht" required>
                <select
                  id="gender" required value={gender}
                  onChange={(e) => setGender(e.target.value as "M" | "V" | "X")}
                  disabled={state === "loading"} className={inputBase}
                >
                  <option value="M">Man</option>
                  <option value="V">Vrouw</option>
                  <option value="X">X (niet-binair)</option>
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Contact & adres */}
        <div>
          <SectionHeading>Contact &amp; adres</SectionHeading>
          <div className="flex flex-col gap-8">
            <Field id="address" label="Adres (straat, nummer, gemeente)" required>
              <input
                id="address" type="text" placeholder="Dorpstraat 1, 0000 Gemeente" required
                autoComplete="street-address" value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={state === "loading"} className={inputBase}
              />
            </Field>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field id="email" label="E-mail" required>
                <input
                  id="email" type="email" placeholder="jan@voorbeeld.be" required
                  autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "loading"} className={inputBase}
                />
              </Field>
              <Field id="phone" label="Telefoonnummer" required>
                <input
                  id="phone" type="tel" placeholder="+32 470 00 00 00" required
                  autoComplete="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={state === "loading"} className={inputBase}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Overige */}
        <div>
          <SectionHeading>Overige gegevens</SectionHeading>
          <div className="flex flex-col gap-8">
            <Field id="nationalRegisterNumber" label="Rijkregisternummer" required>
              <input
                id="nationalRegisterNumber" type="text" placeholder="00.00.00-000.00"
                required value={nationalRegisterNumber}
                onChange={(e) => setNationalRegisterNumber(e.target.value)}
                disabled={state === "loading"} className={inputBase}
              />
            </Field>
            <Field id="wielerclub" label="Wielerclub (indien van toepassing)">
              <input
                id="wielerclub" type="text"
                placeholder="Naam van de club (optioneel)" value={wielerclub}
                onChange={(e) => setWielerclub(e.target.value)}
                disabled={state === "loading"} className={inputBase}
              />
            </Field>
          </div>
        </div>

        {/* Error */}
        {(state === "error") && errorMsg && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
        )}

        {/* GDPR */}
        <p className="text-xs leading-relaxed text-muted">
          Je persoonsgegevens worden uitsluitend gebruikt voor de organisatie van de koers en
          worden na het evenement verwijderd. Je hebt het recht je inschrijving op te vragen of
          te laten verwijderen via{" "}
          <a href="mailto:info@deflosj.be" className="underline hover:text-ink">
            info@deflosj.be
          </a>
          .
        </p>

        {/* Submit */}
        <div className="flex items-center gap-5 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="group flex items-center gap-2.5 rounded-full bg-pink px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-pink/85 hover:shadow-md hover:shadow-pink/20 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>{state === "loading" ? "Bezig met inschrijven…" : "Inschrijven"}</span>
            {state !== "loading" && (
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            )}
          </button>
          {state === "loading" && (
            <span className="text-xs text-muted">Even geduld…</span>
          )}
        </div>
      </form>
    </div>
  );
}
