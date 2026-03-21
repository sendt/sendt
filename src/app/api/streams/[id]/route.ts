import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, displayName: true, username: true, avatar: true },
        },
        auctions: {
          include: {
            product: true,
            bids: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: {
                bidder: { select: { id: true, displayName: true, username: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: { select: { id: true, displayName: true, username: true, avatar: true } },
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ success: false, error: "Yayın bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: stream });
  } catch (error) {
    console.error("Get stream error:", error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}

// PATCH: Yayın başlat/durdur
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 401 });
    }

    const stream = await prisma.liveStream.findUnique({ where: { id } });
    if (!stream || stream.sellerId !== user.id) {
      return NextResponse.json({ success: false, error: "Bu yayını düzenleme yetkiniz yok." }, { status: 403 });
    }

    const body = await request.json();
    const { action, title, description, thumbnail } = body;

    let updateData: Record<string, unknown> = {};

    if (action === "start") {
      updateData = { isActive: true, startedAt: new Date(), endedAt: null };
    } else if (action === "stop") {
      updateData = { isActive: false, endedAt: new Date() };
      // Aktif açık artırmaları da kapat
      await prisma.auction.updateMany({
        where: { streamId: id, status: "LIVE" },
        data: { status: "ENDED", endedAt: new Date() },
      });
    } else {
      updateData = { title, description, thumbnail };
    }

    const updated = await prisma.liveStream.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update stream error:", error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}
