import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        product: true,
        bids: {
          orderBy: { createdAt: "desc" },
          include: {
            bidder: { select: { id: true, displayName: true, username: true } },
          },
        },
        winner: { select: { id: true, displayName: true, username: true } },
      },
    });

    if (!auction) {
      return NextResponse.json({ success: false, error: "Açık artırma bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: auction });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}

// PATCH: Açık artırmayı bitir/iptal et
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 401 });
    }

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: { bids: { orderBy: { amount: "desc" }, take: 1 } },
    });

    if (!auction || auction.sellerId !== user.id) {
      return NextResponse.json({ success: false, error: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "end") {
      const topBid = auction.bids[0];
      let winnerId = topBid ? topBid.bidderId : null;

      const updated = await prisma.auction.update({
        where: { id },
        data: {
          status: "ENDED",
          endedAt: new Date(),
          winnerId,
        },
      });

      // Diğer teklifleri kaybetti olarak işaretle
      if (topBid) {
        await prisma.bid.update({ where: { id: topBid.id }, data: { status: "WON" } });
        await prisma.bid.updateMany({
          where: { auctionId: id, id: { not: topBid.id } },
          data: { status: "LOST" },
        });

        // Kaybedenlerin held bakiyesini iade et
        const losingBids = await prisma.bid.findMany({
          where: { auctionId: id, status: "LOST" },
        });

        for (const bid of losingBids) {
          await prisma.wallet.update({
            where: { userId: bid.bidderId },
            data: {
              heldAmount: { decrement: bid.amount },
            },
          });
          await prisma.bid.update({ where: { id: bid.id }, data: { status: "REFUNDED" } });
          await prisma.transaction.create({
            data: {
              userId: bid.bidderId,
              type: "BID_REFUND",
              amount: bid.amount,
              status: "COMPLETED",
              description: `Açık artırma iadesi: ${auction.title}`,
            },
          });
        }

        // Kazananın bakiyesinden düş
        await prisma.wallet.update({
          where: { userId: topBid.bidderId },
          data: {
            heldAmount: { decrement: topBid.amount },
            balance: { decrement: 0 }, // held zaten tutulmuştu
          },
        });
        await prisma.transaction.create({
          data: {
            userId: topBid.bidderId,
            type: "PURCHASE",
            amount: topBid.amount,
            status: "COMPLETED",
            description: `Satın alındı: ${auction.title}`,
          },
        });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "cancel") {
      // Tüm teklifleri iade et
      const bids = await prisma.bid.findMany({ where: { auctionId: id, status: "ACTIVE" } });
      for (const bid of bids) {
        await prisma.wallet.update({
          where: { userId: bid.bidderId },
          data: { heldAmount: { decrement: bid.amount } },
        });
        await prisma.bid.update({ where: { id: bid.id }, data: { status: "REFUNDED" } });
      }

      const updated = await prisma.auction.update({
        where: { id },
        data: { status: "CANCELLED", endedAt: new Date() },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "Geçersiz işlem." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}
