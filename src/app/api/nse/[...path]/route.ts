import { NextRequest, NextResponse } from "next/server";
export const runtime = 'edge';

const NSE_BASE_URL = "https://www.nseindia.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${NSE_BASE_URL}/api/${path}${searchParams ? `?${searchParams}` : ""}`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Referer": "https://www.nseindia.com/",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "*/*",
  };

  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate: 0 }, // Disable caching for realtime data
    });

    if (!response.ok) {
      // If we get 401 or 403, we might need to fetch the main page first to get cookies
      // For now, let's just return the error
      return NextResponse.json(
        { error: `NSE API responded with ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("NSE Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from NSE" },
      { status: 500 }
    );
  }
}
