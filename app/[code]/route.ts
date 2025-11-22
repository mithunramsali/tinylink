import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /:code -> redirect or 404
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  // Atomically increment clicks and get URL
  const rows = await query<{
    url: string;
  }>(
    "UPDATE links SET total_clicks = total_clicks + 1, last_clicked = NOW() WHERE code = $1 RETURNING url",
    [code]
  );

  if (rows.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const target = rows[0].url;

  return NextResponse.redirect(target, 302);
}
