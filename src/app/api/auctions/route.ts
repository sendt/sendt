import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST: Yeni açık artırma başlat
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SELLER") {
      return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 403 });
    }

    const body = await request.json();
    const { streamId, productId, title, startingPrice, minBidStep, buyNowPrice, duration } = body;

    if (!streamId || !productId || !title || !startingPrice) {
      return NextResponse.json(
        { success: false, error: "Zorunlu alanlar eksik." },
        { status: 400 }
      );
    }

    // Stream'in bu satıcıya ait olduğunu kontrol et
    const stream = await prisma.liveStream.findFirst({
      where: { id: streamId, sellerId: user.id, isActive: true },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: "Aktif bir yayın bulunamadı." },
        { status: 404 }
      );
    }

    // Mevcut aktif açık artırmayı kapat
    await prisma.auction.updateMany({
      where: { streamId, status: "LIVE" },
      data: { status: "ENDED", endedAt: new Date() },
    });

    const auction = await prisma.auction.create({
      data: {
        streamId,
        productId,
        sellerId: user.id,
        title,
        startingPrice,
        currentPrice: startingPrice,
        minBidStep: minBidStep || 1,
        buyNowPrice,
        duration: duration || 60,
        status: "LIVE",
        startedAt: new Date(),
      },
      include: { product: true, bids: true },
    });

    return NextResponse.json({ success: true, data: auction }, { status: 201 });
  } catch (error) {
    console.error("Create auction error:", error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}
