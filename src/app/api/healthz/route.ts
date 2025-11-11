// src/app/api/healthz/route.ts (Next.js 13 app directory)
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
