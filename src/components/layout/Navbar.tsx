"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface NavUser {
  id: string;
  displayName: string;
  username: string;
  role: string;
  wallet?: { balance: number; heldAmount: number } | null;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); })
      .catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  };

  const availableBalance = user?.wallet
    ? user.wallet.balance - user.wallet.heldAmount
    : 0;

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-white font-bold text-xl">CanoApp</span>
            <span className="text-purple-400 text-xs font-medium bg-purple-900/30 px-2 py-0.5 rounded-full">CANLI MEZAT</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/live" className="text-gray-300 hover:text-white transition-colors">
              Canlı Yayınlar
            </Link>
            {user?.role === "SELLER" && (
              <Link href="/seller/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Satıcı Paneli
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.displayName[0].toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">{user.displayName}</p>
                    <p className="text-xs text-green-400">
                      {availableBalance.toFixed(2)} ₺
                    </p>
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                    <Link
                      href="/wallet"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      Cüzdan ({availableBalance.toFixed(2)} ₺)
                    </Link>
                    {user.role === "SELLER" && (
                      <>
                        <Link
                          href="/seller/dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                          onClick={() => setMenuOpen(false)}
                        >
                          Satıcı Paneli
                        </Link>
                        <Link
                          href="/seller/products"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                          onClick={() => setMenuOpen(false)}
                        >
                          Ürünlerim
                        </Link>
                        <Link
                          href="/seller/streams"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                          onClick={() => setMenuOpen(false)}
                        >
                          Yayınlarım
                        </Link>
                      </>
                    )}
                    <hr className="border-gray-700 my-1" />
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white px-3 py-1.5 text-sm transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
