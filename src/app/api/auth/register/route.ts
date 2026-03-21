import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, displayName, password, role } = body;

    if (!email || !username || !displayName || !password) {
      return NextResponse.json(
        { success: false, error: "Tüm alanlar zorunludur." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Bu e-posta veya kullanıcı adı zaten kullanılıyor." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role === "SELLER" ? "SELLER" : "BUYER";

    const user = await prisma.user.create({
      data: {
        email,
        username: username.toLowerCase(),
        displayName,
        password: hashedPassword,
        role: userRole,
        wallet: { create: { balance: 0, heldAmount: 0 } },
      },
      include: { wallet: true },
    });

    const token = generateToken(user.id, user.role);
    const cookie = setAuthCookie(token);

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        wallet: user.wallet,
      },
    });

    response.cookies.set(cookie);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Kayıt sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
