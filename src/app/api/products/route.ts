import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SELLER") {
      return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, images, startingPrice, category, condition } = body;

    if (!title || !startingPrice) {
      return NextResponse.json(
        { success: false, error: "Ürün adı ve başlangıç fiyatı zorunludur." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        sellerId: user.id,
        title,
        description,
        images: images || [],
        startingPrice,
        category,
        condition,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}
