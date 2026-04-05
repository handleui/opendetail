import { IndexSlideLayout } from "./slide-layout";

export default function IndexSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <IndexSlideLayout>{children}</IndexSlideLayout>
    </div>
  );
}
