import { LateralDemoShell } from "@/components/lateral/demo-shell";

export default function FullLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LateralDemoShell>{children}</LateralDemoShell>
    </div>
  );
}
