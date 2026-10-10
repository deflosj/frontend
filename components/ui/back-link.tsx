import Link from "next/link";

/**
 * Terugknop: pijl in een bolletje + label, als pil. Eén component voor de
 * publieke site, het toernooi en de admin, zodat "terug" er overal hetzelfde
 * uitziet. Met `href` een link, met `onClick` een knop (bv. vorige stap).
 */

type Props = {
  children: React.ReactNode;
  className?: string;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

const cls =
  "group inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-full border border-rule bg-surface py-0 pl-1 pr-3.5 " +
  "text-[0.8125rem] font-medium text-ink-2 no-underline transition-[color,border-color,background-color] duration-150 " +
  "hover:border-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink active:scale-[.97]";

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/[0.06] transition-transform duration-200 group-hover:-translate-x-0.5"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
      </svg>
    </span>
  );
}

export function BackLink({ children, className = "", ...rest }: Readonly<Props>) {
  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={`${cls} ${className}`}>
        <Arrow />
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={rest.onClick} className={`${cls} cursor-pointer ${className}`}>
      <Arrow />
      {children}
    </button>
  );
}
