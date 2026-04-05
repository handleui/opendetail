import { DetailView } from "@/components/lateral/views";

export default async function FullDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.id;
  let itemId: string | undefined;
  if (typeof raw === "string") {
    itemId = raw;
  } else if (Array.isArray(raw)) {
    itemId = raw[0];
  }
  return <DetailView itemId={itemId ?? null} />;
}
