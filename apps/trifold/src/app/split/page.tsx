import { redirect } from "next/navigation";

/** Legacy route: split-screen demo removed; single sliding stack + URL is the model. */
export default function SplitLegacyRedirect() {
  redirect("/full");
}
