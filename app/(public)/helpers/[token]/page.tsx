"use client";

import { use, useEffect, useState } from "react";
import { IconPin } from "@/components/ui/icons";
import { API_BASE } from "@/lib/api";
import { ShiftGroup, ShiftSlot } from "@/types/shifts";
import { ClaimForm } from "./_components/ClaimForm";
import { TaskBoard } from "./_components/TaskBoard";

interface PortalEvent {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
}

export default function HelperPortalPage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = use(params);

  const [event, setEvent]                       = useState<PortalEvent | null>(null);
  const [groups, setGroups]                     = useState<ShiftGroup[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [fetchError, setFetchError]             = useState("");
  const [registeringSlot, setRegisteringSlot]   = useState<ShiftSlot | null>(null);
  const [registeringGroup, setRegisteringGroup] = useState<ShiftGroup | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}events/shifts/invite/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? "Ongeldige link");
        }
        return res.json() as Promise<{ event: PortalEvent; groups: ShiftGroup[] }>;
      })
      .then(({ event: ev, groups: gs }) => { setEvent(ev); setGroups(gs); })
      .catch((err) => setFetchError(err instanceof Error ? err.message : "Laden mislukt."))
      .finally(() => setLoading(false));
  }, [token]);

  function handleRegister(slot: ShiftSlot, group: ShiftGroup) {
    setRegisteringSlot(slot);
    setRegisteringGroup(group);
  }

  function handleRegistered(updatedGroups: ShiftGroup[]) {
    setGroups(updatedGroups);
    setRegisteringSlot(null);
    setRegisteringGroup(null);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-ink-2">Laden…</p>
      </div>
    );
  }

  if (fetchError || !event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-3">
        <p className="text-[1.1rem] font-semibold text-red-700">Ongeldige uitnodigingslink</p>
        <p className="text-ink-2 text-[0.9rem]">{fetchError}</p>
      </div>
    );
  }

  return (
    <>
      {registeringSlot && registeringGroup && event && (
        <ClaimForm
          slot={registeringSlot}
          group={registeringGroup}
          eventId={event.id}
          token={token}
          onRegistered={handleRegistered}
          onCancel={() => { setRegisteringSlot(null); setRegisteringGroup(null); }}
        />
      )}

      <div className="max-w-190 mx-auto px-4 py-8">
        <div className="mb-8">
          <span className="inline-block text-[0.72rem] font-bold tracking-[0.12em] uppercase text-ink-2 mb-2">
            Helperportal
          </span>
          <h1 className="mb-1.5 text-[1.9rem] font-bold tracking-[-0.03em] text-ink">
            {event.title}
          </h1>
          <div className="flex gap-4 flex-wrap text-[0.875rem] text-ink-2">
            <span>
              {new Date(event.startsAt).toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {event.endsAt && ` – ${new Date(event.endsAt).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}`}
            </span>
            {event.location && <span className="inline-flex items-center gap-1"><IconPin />{event.location}</span>}
          </div>
          {event.description && (
            <p className="mt-3 text-[0.9rem] text-ink-2 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        <div className="px-5 py-4 bg-blue-50 rounded-[0.875rem] mb-8 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900">
          <p className="m-0 text-[0.875rem] text-blue-700 dark:text-blue-300">
            <strong>Bedankt dat je wil helpen!</strong> Klik op een shift om je in te schrijven. Als een slot vol is kan je je niet meer inschrijven.
          </p>
        </div>

        <TaskBoard groups={groups} onRegister={handleRegister} />
      </div>
    </>
  );
}
