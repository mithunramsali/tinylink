import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/links/:code -> stats for a single code
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  const rows = await query(
    "SELECT code, url, total_clicks, last_clicked, created_at FROM links WHERE code = $1",
    [code]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

// DELETE /api/links/:code -> delete link
export async function DELETE(
  request: Request,
  { params }: { params: { code: string } }
) {
  const { code } = params;

  const deleted = await query(
    "DELETE FROM links WHERE code = $1 RETURNING code",
    [code]
  );

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
