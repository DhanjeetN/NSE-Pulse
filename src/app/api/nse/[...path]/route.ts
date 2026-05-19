import { NextRequest, NextResponse } from "next/server";

const NSE_BASE_URL = "https://www.nseindia.com";

export const runtime = "nodejs";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Referer: "https://www.nseindia.com/",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;

    const path = resolvedParams.path.join("/");

    const searchParams = request.nextUrl.searchParams.toString();

    const apiUrl =
      `${NSE_BASE_URL}/api/${path}` +
      (searchParams ? `?${searchParams}` : "");

    // First request to get cookies/session
    await fetch(NSE_BASE_URL, {
      headers,
      cache: "no-store",
    });

    // Actual NSE API request
    const response = await fetch(apiUrl, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `NSE API Error ${response.status}`,
        },
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("NSE Proxy Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch NSE data",
      },
      {
        status: 500,
      }
    );
  }
}