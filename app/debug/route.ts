import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    BASE_URL: process.env.BASE_URL,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
