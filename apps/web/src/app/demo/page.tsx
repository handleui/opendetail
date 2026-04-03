import { DemoPageClient } from "@/components/demo-page-client";
import { knownSourcePageUrls } from "@/lib/known-source-page-urls";

export default function DemoPage() {
  return <DemoPageClient knownSourcePageUrls={knownSourcePageUrls} />;
}
