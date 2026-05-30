import { NextRequest, NextResponse } from "next/server";
import { isD1Configured, recordHeartbeat } from "@/lib/d1";

function validateHeartbeatPayload(body: unknown) {
  const payload = body as Record<string, unknown>;
  const id = typeof payload?.id === "string" ? payload.id.trim() : "";
  return id || null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const id = validateHeartbeatPayload(payload);

    if (!id) {
      return NextResponse.json({ error: "Missing visitor ID" }, { status: 400 });
    }

    if (!(await isD1Configured())) {
      return NextResponse.json(
        { error: "Cloudflare D1 is not configured. Heartbeat requires Cloudflare D1." },
        { status: 500 }
      );
    }

    const viewersCount = await recordHeartbeat(id);
    if (viewersCount === null) {
      return NextResponse.json({ error: "Failed to record heartbeat in D1." }, { status: 500 });
    }

    return NextResponse.json({ viewersCount });
  } catch (error: unknown) {
    console.error("Heartbeat Error:", error);
    const message = error instanceof Error ? error.message : "Failed to process heartbeat";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
