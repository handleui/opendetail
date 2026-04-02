import { DemoPageClient } from "@/components/demo-page-client";
import { getSourcePageUrls } from "@/lib/source";

export default function DemoPage() {
  return <DemoPageClient knownSourcePageUrls={getSourcePageUrls()} />;
}
