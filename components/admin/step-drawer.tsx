"use client";

import { Sheet, SheetContent } from "./sheet";

// ── StepDrawer — reusable multi-step sheet ────────────────────────────────────
// Renders a progress bar + step labels inside a Sheet.
// The footer (prev/next buttons) is passed as a prop for flexibility.

interface StepDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  steps: string[];    // e.g. ["Gegevens", "Structuur", "Bevestigen"]
  currentStep: number; // 1-indexed
  width?: string;
  footer: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

export function StepDrawer({
  open,
  onOpenChange,
  title,
  steps,
  currentStep,
  width,
  footer,
  error,
  children,
}: Readonly<StepDrawerProps>) {
  const description = `Stap ${currentStep} van ${steps.length} — ${steps[currentStep - 1]}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={title} description={description} width={width}>
        {/* Progress bar */}
        <div className="admin-step-bar">
          {steps.map((_, i) => (
            <div
              key={i}
              className="admin-step-bar__segment"
              data-active={i < currentStep}
            />
          ))}
        </div>

        {/* Content */}
        <div className="admin-form">
          {error && <div className="form-error">{error}</div>}
          {children}
        </div>

        {/* Footer */}
        <div className="admin-drawer__actions" style={{ marginTop: "auto", paddingTop: "1rem" }}>{footer}</div>
      </SheetContent>
    </Sheet>
  );
}
