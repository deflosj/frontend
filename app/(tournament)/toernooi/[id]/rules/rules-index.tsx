"use client";

import { useEffect, useState } from "react";

interface Props {
  sections: { id: string; title: string }[];
}

export function RulesIndex({ sections }: Readonly<Props>) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  // Sleutel op de ids, niet op de array — anders bouwt elke render een
  // nieuwe observer op.
  const ids = sections.map((s) => s.id).join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-64px 0px -70% 0px", threshold: 0 }
    );

    for (const id of ids.split(",")) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Op deze pagina">
      <p className="mb-2 ml-3.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-2">
        Op deze pagina
      </p>
      {sections.map(({ id, title }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`rounded-lg px-3.5 py-2 text-[0.8125rem] transition-colors ${
            active === id
              ? "bg-pink-soft font-semibold text-pink-ink"
              : "font-medium text-ink-2 hover:bg-ink/[0.04]"
          }`}
        >
          {title}
        </a>
      ))}
    </nav>
  );
}
