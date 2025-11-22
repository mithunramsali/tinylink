import { NextResponse } from "next/server";

// GET /healthz -> healthcheck
export async function GET() {
  return NextResponse.json({
    ok: true,
    version: "1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
