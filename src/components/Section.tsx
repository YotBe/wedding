import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Consistent vertical rhythm + optional centered serif heading for a page section. */
export function Section({ id, title, children, className = '' }: SectionProps) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-3xl scroll-mt-20 px-6 py-16 sm:py-20 ${className}`}
    >
      {title && (
        <h2 className="mb-10 text-center font-serif text-3xl font-medium text-stone-800 sm:text-4xl">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
