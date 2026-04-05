import { LateralDemoShell } from "@/components/lateral/demo-shell";

export default function SplitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <LateralDemoShell variant="split">{children}</LateralDemoShell>
    </div>
  );
}
