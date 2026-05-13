type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-widest text-pink">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {description && (
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{description}</p>
      )}
    </div>
  );
}
