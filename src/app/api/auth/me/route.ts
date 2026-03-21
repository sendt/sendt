import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Yetkisiz." }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      wallet: user.wallet,
    },
  });
}
