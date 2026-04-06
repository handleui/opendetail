import { NextResponse } from "next/server";

interface Body {
  path?: unknown;
  sentiment?: unknown;
}

export async function POST(req: Request) {
  let raw: Body;
  try {
    raw = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof raw.path !== "string" ||
    raw.path.length === 0 ||
    (raw.sentiment !== "up" && raw.sentiment !== "down")
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
