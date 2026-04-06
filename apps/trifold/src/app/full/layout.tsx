import { TrifoldDemoShell } from "@/components/trifold-demo/demo-shell";

export default function FullLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TrifoldDemoShell>{children}</TrifoldDemoShell>
    </div>
  );
}
