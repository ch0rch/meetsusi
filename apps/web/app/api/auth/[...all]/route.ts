import { NextResponse } from "next/server";

// Auth is handled by Supabase. The callback lives at /auth/callback.
export function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
