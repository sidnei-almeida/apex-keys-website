import type { ReactNode } from "react";

/**
 * Layout partilhado para páginas legais (legibilidade, contenção estreita).
 */
export function LegalDocShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[70vh] bg-apex-base">
      <article className="mx-auto max-w-4xl px-6 py-24">
        <h1 className="mb-8 font-heading text-4xl font-bold tracking-tight text-white">
          {title}
        </h1>
        <div className="space-y-6 font-body leading-relaxed text-apex-text-muted">
          {children}
        </div>
      </article>
    </main>
  );
}

/** Subtítulo de secção — primeiro bloco deve usar `firstSection` para evitar margem superior extra. */
export function LegalSectionTitle({
  children,
  firstSection = false,
}: {
  children: ReactNode;
  firstSection?: boolean;
}) {
  return (
    <h2
      className={`font-heading text-2xl font-semibold tracking-tight text-white ${firstSection ? "mb-4 mt-0" : "mb-4 mt-12"}`}
    >
      {children}
    </h2>
  );
}
