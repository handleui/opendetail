import Link from "next/link";

import { getPrimitiveDoc } from "@/lib/ui-sandbox/primitive-docs-data";
import type { SandboxPrimitiveId } from "@/lib/ui-sandbox/primitives";

export function PrimitiveDocPanel({ id }: { id: SandboxPrimitiveId }) {
  const doc = getPrimitiveDoc(id);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      <header className="shrink-0">
        <h2 className="mb-1 font-medium text-[20px] text-neutral-950 tracking-tight">
          {doc.title}
        </h2>
        <p className="text-[14px] text-neutral-600 leading-relaxed">
          {doc.description}
        </p>
      </header>
      {doc.intro ? <div className="shrink-0">{doc.intro}</div> : null}
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto overscroll-contain">
        {doc.tables.map((table) => (
          <section key={table.title}>
            <h3 className="mb-3 font-medium text-[15px] text-neutral-900">
              {table.title}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 border-solid">
              <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-neutral-200 border-b bg-neutral-50">
                    <th className="px-3 py-2 font-medium text-neutral-800">
                      Prop
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-800">
                      Type
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-800">
                      Default
                    </th>
                    <th className="px-3 py-2 font-medium text-neutral-800">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr
                      className="border-neutral-100 border-b last:border-b-0"
                      key={row.name}
                    >
                      <td className="px-3 py-2 align-top font-mono text-[12px] text-neutral-900">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 align-top font-mono text-[12px] text-neutral-700">
                        {row.type}
                      </td>
                      <td className="px-3 py-2 align-top font-mono text-[12px] text-neutral-500">
                        {row.default ?? "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-neutral-600">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
      {doc.seeAlso && doc.seeAlso.length > 0 ? (
        <footer className="shrink-0 border-neutral-200 border-t pt-4">
          <p className="mb-2 font-medium text-[13px] text-neutral-500">
            See also
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
            {doc.seeAlso.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-500"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </div>
  );
}
