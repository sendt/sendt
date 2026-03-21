import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

// GET: Aktif yayınları listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active") === "true";

    const streams = await prisma.liveStream.findMany({
      where: active ? { isActive: true } : {},
      include: {
        seller: {
          select: { id: true, displayName: true, username: true, avatar: true },
        },
        auctions: {
          where: { status: "LIVE" },
          include: { product: true },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
      orderBy: [{ isActive: "desc" }, { viewerCount: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: streams });
  } catch (error) {
    console.error("Get streams error:", error);
    return NextResponse.json(
      { success: false, error: "Yayınlar yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}

// POST: Yeni yayın oluştur (sadece SELLER)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SELLER") {
      return NextResponse.json(
        { success: false, error: "Yalnızca satıcılar yayın açabilir." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, thumbnail } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Yayın başlığı zorunludur." },
        { status: 400 }
      );
    }

    const stream = await prisma.liveStream.create({
      data: {
        sellerId: user.id,
        title,
        description,
        thumbnail,
        streamKey: uuidv4(),
        isActive: false,
      },
      include: {
        seller: {
          select: { id: true, displayName: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: stream }, { status: 201 });
  } catch (error) {
    console.error("Create stream error:", error);
    return NextResponse.json(
      { success: false, error: "Yayın oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}
