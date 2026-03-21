import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 401 });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, data: { wallet, transactions } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Hata oluştu." }, { status: 500 });
  }
}
