import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// POST /api/links -> create short link
export async function POST(request: Request) {
  const body = await request.json().catch(() => null as any);

  const url = body?.url as string | undefined;
  let code = body?.code as string | undefined;

  if (!url || !isValidUrl(url)) {
    return NextResponse.json(
      { error: "Invalid URL. Must be a valid http(s) URL." },
      { status: 400 }
    );
  }

  if (code) {
    if (!CODE_REGEX.test(code)) {
      return NextResponse.json(
        { error: "Code must be 6–8 alphanumeric characters." },
        { status: 400 }
      );
    }
  } else {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const len = 6;

    // Try a few times to avoid collisions
    for (let i = 0; i < 5; i++) {
      code = Array.from({ length: len })
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");

      const existing = await query("SELECT code FROM links WHERE code = $1", [
        code,
      ]);
      if (existing.length === 0) break;
    }
  }

  // Ensure final code is globally unique
  const existing = await query("SELECT code FROM links WHERE code = $1", [code]);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Code already exists." },
      { status: 409 }
    );
  }

  await query("INSERT INTO links (code, url) VALUES ($1, $2)", [code, url]);

  const origin = new URL(request.url).origin;
  const baseUrl = process.env.BASE_URL || origin;

  return NextResponse.json(
    {
      code,
      url,
      shortUrl: `${baseUrl}/${code}`,
    },
    { status: 201 }
  );
}

// GET /api/links -> list all links
export async function GET() {
  const rows = await query(
    "SELECT code, url, total_clicks, last_clicked, created_at FROM links ORDER BY created_at DESC"
  );

  return NextResponse.json(rows);
}
