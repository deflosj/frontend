"use client";

export type PaymentMethod = "CASH" | "PAYCONIQ";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  PAYCONIQ: "Payconiq",
};

/** Waarde voor de select: "" = niet betaald, "PAID" = betaald zonder gekende wijze. */
export function paymentValue(team: { isPaid?: boolean; paymentMethod?: string | null }): string {
  if (team.paymentMethod) return team.paymentMethod;
  return team.isPaid ? "PAID" : "";
}

/** Body voor PATCH/POST op basis van de gekozen select-waarde. */
export function paymentBody(value: string): { isPaid: boolean; paymentMethod?: PaymentMethod | null } {
  if (value === "CASH" || value === "PAYCONIQ") return { isPaid: true, paymentMethod: value };
  if (value === "PAID") return { isPaid: true };
  return { isPaid: false, paymentMethod: null };
}

const COLORS: Record<string, { bg: string; fg: string }> = {
  "":       { bg: "#f3f4f6", fg: "#6b7280" },
  CASH:     { bg: "#dcfce7", fg: "#15803d" },
  PAYCONIQ: { bg: "#fce7f3", fg: "#be185d" },
  PAID:     { bg: "#dcfce7", fg: "#15803d" },
};

/** Compacte keuze aan de balie: Niet betaald / Cash / Payconiq. */
export function PaymentSelect({
  value,
  onChange,
  disabled,
  id,
}: Readonly<{ value: string; onChange: (value: string) => void; disabled?: boolean; id?: string }>) {
  const c = COLORS[value] ?? COLORS[""];
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: c.bg,
        color: c.fg,
        fontWeight: 600,
        fontSize: "0.8rem",
        border: "1px solid transparent",
        borderRadius: "999px",
        padding: "0.3rem 0.6rem",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <option value="">Niet betaald</option>
      <option value="CASH">✓ Cash</option>
      <option value="PAYCONIQ">✓ Payconiq</option>
      {value === "PAID" && <option value="PAID">✓ Betaald</option>}
    </select>
  );
}
