import { NextRequest, NextResponse } from "next/server";
import { isD1Configured, listContactSubmissions, saveContactSubmission } from "@/lib/d1";

function validateContactPayload(body: unknown) {
  const payload = body as Record<string, unknown>;
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const subject = typeof payload?.subject === "string" ? payload.subject.trim() : "";
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";

  if (!name || !email || !subject || !message) {
    return null;
  }

  return { name, email, subject, message };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const contact = validateContactPayload(payload);
    if (!contact) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!(await isD1Configured())) {
      return NextResponse.json(
        {
          error:
            "Cloudflare D1 is not configured. Add CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN to .env",
        },
        { status: 500 }
      );
    }

    const result = await saveContactSubmission(contact);

    return NextResponse.json({
      success: true,
      id: result.id,
    });
  } catch (error: unknown) {
    console.error("Contact handler error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit contact query";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!(await isD1Configured())) {
      return NextResponse.json(
        { error: "Cloudflare D1 is not configured. Contact submissions require D1." },
        { status: 500 }
      );
    }

    const rows = await listContactSubmissions();
    if (rows === null) {
      return NextResponse.json({ error: "Failed to read contact submissions from D1." }, { status: 500 });
    }

    return NextResponse.json({ success: true, submissions: rows });
  } catch (err: unknown) {
    console.error("Contact GET error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch submissions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
