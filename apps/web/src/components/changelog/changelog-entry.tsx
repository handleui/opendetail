import Image from "next/image";
import type { ReactNode } from "react";

const entryShell =
  "not-first:mt-8 not-first:border-neutral-100 not-first:border-t not-first:pt-8";

const proseTight =
  "tracking-tight [&_strong]:font-medium [&_strong]:text-neutral-900";

/**
 * One release block: sticky version + date in the left rail while this entry
 * scrolls; stacks on small viewports.
 */
export function ChangelogEntry({
  version,
  date,
  children,
}: {
  version: string;
  date: string;
  children: ReactNode;
}) {
  return (
    <section className={entryShell}>
      <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-[6.75rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-0.5 md:sticky md:top-4 md:self-start">
          <p className="font-medium text-[13px] text-neutral-900 tracking-tight">
            {version}
          </p>
          <p className="text-[#999] text-[13px] tracking-tight">{date}</p>
        </aside>
        <div className={`min-w-0 ${proseTight}`}>{children}</div>
      </div>
    </section>
  );
}

/** Main entry title — no heavier than medium. */
export function ChangelogTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-3 font-medium text-[22px] text-neutral-950 leading-snug tracking-tight">
      {children}
    </h1>
  );
}

/** Section heading inside an entry. */
export function ChangelogSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-5 mb-1.5 font-medium text-[14px] text-neutral-950 leading-snug tracking-tight first-of-type:mt-3">
      {children}
    </h2>
  );
}

/** Body copy; supports semantic `em` / `strong`. */
export function ChangelogParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[14px] text-neutral-900 leading-relaxed tracking-tight [&_em]:font-medium [&_em]:text-neutral-800 [&_em]:italic">
      {children}
    </p>
  );
}

const figureShellClass =
  "my-4 w-full overflow-hidden rounded-[10px] border border-neutral-200/90 bg-neutral-50 shadow-[0_1px_4px_rgba(0,0,0,0.06)]";

/**
 * Full-width figure for release screenshots. Renders nothing until `src`,
 * `width`, and `height` are provided — add when an entry merits an image.
 */
export function ChangelogFigure({
  src,
  alt = "",
  width,
  height,
}: {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}) {
  if (!(src && width && height)) {
    return null;
  }

  return (
    <figure className={figureShellClass}>
      <Image
        alt={alt}
        className="h-auto w-full object-cover"
        height={height}
        src={src}
        width={width}
      />
    </figure>
  );
}

/** Bulleted changes for an entry. */
export function ChangelogChanges({
  title = "Changes",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4">
      <h2 className="mb-2 font-medium text-[14px] text-neutral-950 leading-snug tracking-tight">
        {title}
      </h2>
      <ul className="list-disc space-y-1.5 pl-[1.1rem] text-[14px] text-neutral-900 leading-relaxed tracking-tight marker:text-neutral-400">
        {children}
      </ul>
    </div>
  );
}

export function ChangelogListItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}
