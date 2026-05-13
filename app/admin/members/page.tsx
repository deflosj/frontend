"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface MemberProfile {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  joinedAt: string | null;
  isPublic: boolean;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MemberProfile[]>("/members")
      .then(setMembers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="admin-page-header">
        <h1>Leden</h1>
        <p>Overzicht van leden met een openbaar profiel</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h2>Leden ({members.length})</h2>
        </div>

        {loading ? (
          <p className="admin-empty">Laden…</p>
        ) : members.length === 0 ? (
          <p className="admin-empty">Geen openbare ledenprofielen gevonden.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Telefoon</th>
                <th>Lid sinds</th>
                <th>Zichtbaar</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.firstName} {m.lastName}</strong>
                    {m.bio && (
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>
                        {m.bio.length > 80 ? m.bio.slice(0, 80) + "…" : m.bio}
                      </p>
                    )}
                  </td>
                  <td>{m.phone ?? "—"}</td>
                  <td>
                    {m.joinedAt
                      ? new Date(m.joinedAt).toLocaleDateString("nl-BE")
                      : "—"}
                  </td>
                  <td>
                    <span className={`badge badge--${m.isPublic ? "green" : "gray"}`}>
                      {m.isPublic ? "Openbaar" : "Privé"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
