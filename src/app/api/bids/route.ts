import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST: Teklif ver
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const body = await request.json();
    const { auctionId, amount } = body;

    if (!auctionId || !amount) {
      return NextResponse.json({ success: false, error: "Gerekli alanlar eksik." }, { status: 400 });
    }

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { bids: { where: { bidderId: user.id }, orderBy: { amount: "desc" }, take: 1 } },
    });

    if (!auction || auction.status !== "LIVE") {
      return NextResponse.json(
        { success: false, error: "Açık artırma aktif değil." },
        { status: 400 }
      );
    }

    if (auction.sellerId === user.id) {
      return NextResponse.json(
        { success: false, error: "Kendi açık artırmanıza teklif veremezsiniz." },
        { status: 400 }
      );
    }

    const minRequired = auction.currentPrice + auction.minBidStep;
    if (amount < minRequired) {
      return NextResponse.json(
        { success: false, error: `Minimum teklif: ${minRequired.toFixed(2)} ₺` },
        { status: 400 }
      );
    }

    // Kullanıcının bakiyesini kontrol et
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      return NextResponse.json({ success: false, error: "Cüzdan bulunamadı." }, { status: 400 });
    }

    const availableBalance = wallet.balance - wallet.heldAmount;
    const previousBid = auction.bids[0];
    const additionalNeeded = previousBid ? amount - previousBid.amount : amount;

    if (availableBalance < additionalNeeded) {
      return NextResponse.json(
        { success: false, error: `Yetersiz bakiye. Mevcut: ${availableBalance.toFixed(2)} ₺, Gerekli: ${additionalNeeded.toFixed(2)} ₺` },
        { status: 400 }
      );
    }

    // Eski teklife ek olarak farkı tut
    await prisma.wallet.update({
      where: { userId: user.id },
      data: { heldAmount: { increment: additionalNeeded } },
    });

    // Bid oluştur
    const bid = await prisma.bid.create({
      data: { auctionId, bidderId: user.id, amount, status: "ACTIVE" },
      include: {
        bidder: { select: { id: true, displayName: true, username: true } },
      },
    });

    // Açık artırmanın mevcut fiyatını güncelle
    await prisma.auction.update({
      where: { id: auctionId },
      data: { currentPrice: amount },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BID_HOLD",
        amount: additionalNeeded,
        status: "COMPLETED",
        description: `Teklif tutma: ${auction.title} - ${amount} ₺`,
      },
    });

    return NextResponse.json({ success: true, data: bid }, { status: 201 });
  } catch (error) {
    console.error("Bid error:", error);
    return NextResponse.json({ success: false, error: "Teklif verilirken hata oluştu." }, { status: 500 });
  }
}
