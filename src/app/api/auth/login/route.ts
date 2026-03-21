import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "E-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { success: false, error: "Hesabınız askıya alınmış." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "E-posta veya şifre hatalı." },
        { status: 401 }
      );
    }

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
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Giriş sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
