"use client";

import { useState } from "react";
import { ShiftGroup } from "@/types/shifts";
import { ShiftGroupCard } from "./ShiftGroupCard";
import { ShiftGroupForm } from "./ShiftGroupForm";

interface ShiftBoardProps {
  groups: ShiftGroup[];
  eventId: number;
  baseDate: string;
  onGroupsUpdated: (groups: ShiftGroup[]) => void;
}

export function ShiftBoard({ groups, eventId, baseDate, onGroupsUpdated }: Readonly<ShiftBoardProps>) {
  const [addingGroup, setAddingGroup] = useState(false);

  const totalRegistrations = groups.reduce(
    (acc, g) => acc + g.slots.reduce((a, s) => a + s.registrations.length, 0),
    0
  );
  const totalSpots = groups.reduce((acc, g) =>
    acc + g.slots.reduce((a, s) => a + (!s.isUnlimited && s.maxPersons !== null ? s.maxPersons : 0), 0), 0
  );
  const openSpots = groups.reduce((acc, g) =>
    acc + g.slots.reduce((a, s) => {
      if (s.isUnlimited || s.maxPersons === null) return a;
      return a + Math.max(0, s.maxPersons - s.registrations.length);
    }, 0), 0
  );

  return (
    <div>
      {/* Summary strip */}
      {groups.length > 0 && (
        <div style={{
          display: "flex",
          gap: "1.5rem",
          padding: "0.75rem 1.4rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-alt)",
          fontSize: "0.78rem",
          color: "var(--ink-2)",
          flexWrap: "wrap",
        }}>
          <span><strong style={{ color: "var(--text)" }}>{groups.length}</strong> groepen</span>
          <span><strong style={{ color: "var(--text)" }}>{totalRegistrations}</strong> inschrijvingen</span>
          {totalSpots > 0 && (
            <span><strong style={{ color: "var(--text)" }}>{openSpots}</strong> open plekken</span>
          )}
        </div>
      )}

      <div style={{ padding: "1.25rem 1.4rem", display: "grid", gap: "1rem" }}>
        {groups.length === 0 && !addingGroup && (
          <div style={{
            padding: "3rem 1.5rem",
            textAlign: "center",
            border: "1.5px dashed var(--border)",
            borderRadius: "12px",
          }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "var(--ink-2)" }}>
              Nog geen shiftgroepen aangemaakt.
            </p>
            <button
              type="button"
              className="btn-sm btn-sm--primary"
              onClick={() => setAddingGroup(true)}
              style={{ fontSize: "0.82rem" }}
            >
              Eerste groep toevoegen
            </button>
          </div>
        )}

        {groups.map((group) => (
          <ShiftGroupCard
            key={group.id}
            group={group}
            eventId={eventId}
            baseDate={baseDate}
            onGroupsUpdated={onGroupsUpdated}
          />
        ))}

        {addingGroup && (
          <ShiftGroupForm
            eventId={eventId}
            onSaved={(groups) => { onGroupsUpdated(groups); setAddingGroup(false); }}
            onCancel={() => setAddingGroup(false)}
          />
        )}

        {groups.length > 0 && !addingGroup && (
          <button
            type="button"
            onClick={() => setAddingGroup(true)}
            style={{
              padding: "0.65rem",
              border: "1.5px dashed var(--border)",
              borderRadius: "10px",
              background: "transparent",
              color: "var(--ink-2)",
              fontSize: "0.78rem",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.3rem",
            }}
          >
            + Groep toevoegen
          </button>
        )}
      </div>
    </div>
  );
}
