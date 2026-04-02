import { DemoPageClient } from "@/components/demo-page-client";
import { knownSourcePageUrls } from "@/lib/source";

export default function DemoPage() {
  return <DemoPageClient knownSourcePageUrls={knownSourcePageUrls} />;
}
