import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST: Bakiye yükle (gerçek implementasyonda iyzico entegrasyonu)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Giriş yapmalısınız." }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentToken } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Geçerli bir tutar girin." }, { status: 400 });
    }

    if (amount < 10) {
      return NextResponse.json({ success: false, error: "Minimum yükleme tutarı 10 ₺'dir." }, { status: 400 });
    }

    // TODO: Gerçek ödeme entegrasyonu (iyzico)
    // const payment = await verifyIyzicoPayment(paymentToken, amount);
    // if (!payment.success) return error;

    // Bakiyeyi güncelle
    const wallet = await prisma.wallet.update({
      where: { userId: user.id },
      data: { balance: { increment: amount } },
    });

    // İşlemi kaydet
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount,
        status: "COMPLETED",
        description: `Bakiye yükleme: ${amount} ₺`,
        reference: paymentToken,
      },
    });

    return NextResponse.json({ success: true, data: { balance: wallet.balance } });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json({ success: false, error: "Bakiye yüklenirken hata oluştu." }, { status: 500 });
  }
}
