const workspaceEntries = [
  {
    path: "packages/opendetail",
    title: "Core runtime",
    description:
      "Backend package, CLI, index build, and framework adapters stay here.",
  },
  {
    path: "apps/www",
    title: "Public site",
    description: "Reserved for docs, demos, and serving built registry JSON.",
  },
  {
    path: "registry",
    title: "Registry source",
    description:
      "Installable shadcn-compatible placeholders and future UI source live here.",
  },
] as const;

const registryGroups = [
  "lib/opendetail-client",
  "hooks/use-opendetail",
  "ui/assistant-*",
  "blocks/assistant-*",
  "themes/opendetail-base",
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-16 sm:px-10">
      <section className="space-y-4">
        <p className="font-medium text-sm text-zinc-500 uppercase tracking-[0.24em]">
          Public Site Scaffold
        </p>
        <div className="space-y-3">
          <h1 className="font-semibold text-4xl text-zinc-950 tracking-tight sm:text-5xl">
            opendetail
          </h1>
          <p className="max-w-3xl text-base text-zinc-600 leading-7 sm:text-lg">
            This Next app is scaffolded for the future public website. It will
            eventually host docs, demos, and the built registry JSON, while
            assistant UI source stays in the root registry and the backend
            runtime stays in the package.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {workspaceEntries.map((entry) => (
          <article
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            key={entry.path}
          >
            <p className="font-medium text-sm text-zinc-500">{entry.path}</p>
            <h2 className="mt-3 font-semibold text-xl text-zinc-950">
              {entry.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 leading-6">
              {entry.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="space-y-3">
          <h2 className="font-semibold text-2xl text-zinc-950 tracking-tight">
            Registry Placeholder Groups
          </h2>
          <p className="max-w-3xl text-sm text-zinc-600 leading-6">
            The registry is scaffolded for composable source distribution only.
            No assistant UI behavior is implemented yet.
          </p>
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {registryGroups.map((group) => (
            <li
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-medium text-sm text-zinc-700"
              key={group}
            >
              {group}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-2xl text-zinc-950 tracking-tight">
          Next Step
        </h2>
        <p className="max-w-3xl text-sm text-zinc-600 leading-6">
          Build registry payloads into{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5">
            apps/www/public/r
          </code>{" "}
          with{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5">
            bun run registry:build
          </code>{" "}
          once the placeholders are ready to be published.
        </p>
      </section>
    </main>
  );
}
