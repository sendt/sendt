import { NextResponse } from "next/server";

// Socket.io custom server gerektirir - bu route sadece bilgi döndürür
export async function GET() {
  return NextResponse.json({
    message: "Socket.io server ayrı bir custom server üzerinden çalışır.",
    docs: "server.ts dosyasını inceleyin.",
  });
}
