"use client";

import { use, useEffect, useRef, useState } from "react";
import { IconPin } from "@/components/ui/icons";
import { API_BASE } from "@/lib/api";
import { Task } from "@/types/shifts";
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HelperPortalPage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = use(params);

  const [event, setEvent]               = useState<PortalEvent | null>(null);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState("");
  const [claimingTask, setClaimingTask] = useState<Task | null>(null);
  const fakeIdRef = useRef(0);

  useEffect(() => {
    fetch(`${API_BASE}events/portal/invite/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? "Ongeldige link");
        }
        return res.json() as Promise<{ event: PortalEvent; tasks: Task[] }>;
      })
      .then(({ event: ev, tasks: ts }) => { setEvent(ev); setTasks(ts); })
      .catch((err) => setFetchError(err instanceof Error ? err.message : "Laden mislukt."))
      .finally(() => setLoading(false));
  }, [token]);

  function handleClaimed(taskId: number, assigneeName: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assignees: [...t.assignees, { id: --fakeIdRef.current, userId: null, name: assigneeName, email: null }] }
          : t
      )
    );
    setClaimingTask(null);
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
      {claimingTask && (
        <ClaimForm
          task={claimingTask}
          token={token}
          onClaimed={handleClaimed}
          onCancel={() => setClaimingTask(null)}
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
            <strong>Bedankt dat je wil helpen!</strong> Klik op een taak om die over te nemen. Als een taak vol is kan je hem niet meer claimen.
          </p>
        </div>

        <TaskBoard tasks={tasks} event={event} onClaim={setClaimingTask} />
      </div>
    </>
  );
}
