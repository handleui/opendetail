import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
      <div className="max-w-3xl">
        <p className="mb-3 font-medium text-[0.95rem] text-fd-muted-foreground">
          OpenDetail Documentation
        </p>
        <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
          Grounded answers from the docs you already have
        </h1>
        <p className="mt-5 max-w-2xl text-fd-muted-foreground text-lg leading-8">
          OpenDetail turns Markdown and MDX into a small assistant for your app.
          The docs are organized for humans first and exposed through
          Fumadocs&apos; machine-readable routes for agents too.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link
          className="rounded-xl border p-5 transition-colors hover:bg-fd-accent/40"
          href="/docs/quickstart"
        >
          <p className="font-medium">Quickstart</p>
          <p className="mt-2 text-fd-muted-foreground text-sm">
            Install, scaffold, build, and send the first request.
          </p>
        </Link>
        <Link
          className="rounded-xl border p-5 transition-colors hover:bg-fd-accent/40"
          href="/docs/getting-started/self-hosted"
        >
          <p className="font-medium">Self-hosted</p>
          <p className="mt-2 text-fd-muted-foreground text-sm">
            Use the built-in Next.js route and keep the runtime in your app.
          </p>
        </Link>
        <Link
          className="rounded-xl border p-5 transition-colors hover:bg-fd-accent/40"
          href="/docs/reference/runtime"
        >
          <p className="font-medium">Reference</p>
          <p className="mt-2 text-fd-muted-foreground text-sm">
            Config, CLI, runtime, hook, and client details.
          </p>
        </Link>
      </div>
    </main>
  );
}
