import { NextRequest, NextResponse } from "next/server";
import { fetchFromNSE } from "@/lib/nse-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();

    const response = await fetchFromNSE(path, searchParams || undefined);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`NSE API ${response.status} for /api/${path}:`, body.slice(0, 200));
      return NextResponse.json(
        { error: `NSE API returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const body = await response.text();
      console.error(`NSE non-JSON response for /api/${path}:`, body.slice(0, 200));
      return NextResponse.json(
        { error: "NSE returned an unexpected response. Session may have expired." },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("NSE Proxy Gateway Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch NSE data";
    const isTlsError =
      message.includes("certificate") ||
      message.includes("UNABLE_TO_VERIFY") ||
      (error as NodeJS.ErrnoException)?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE";

    return NextResponse.json(
      {
        error: isTlsError
          ? "TLS error reaching NSE. Set NSE_TLS_INSECURE=1 in .env and restart `npm run dev`."
          : message || "Failed to fetch NSE data from gateway",
      },
      { status: 500 }
    );
  }
}
