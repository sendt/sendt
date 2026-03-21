"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalStreams: number;
  activeStreams: number;
  totalProducts: number;
  totalAuctions: number;
  totalRevenue: number;
}

export default function SellerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [streams, setStreams] = useState<Array<{
    id: string;
    title: string;
    isActive: boolean;
    viewerCount: number;
    createdAt: string;
  }>>([]);
  const [user, setUser] = useState<{ displayName: string; wallet?: { balance: number } } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.success) setUser(d.data); });
    fetch("/api/streams").then(r => r.json()).then(d => { if (d.success) setStreams(d.data.slice(0, 5)); });
    // In a real app, fetch stats from /api/seller/stats
    setStats({ totalStreams: 0, activeStreams: 0, totalProducts: 0, totalAuctions: 0, totalRevenue: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Satıcı Paneli</h1>
            <p className="text-gray-400">Hoş geldin, {user?.displayName || "Satıcı"}</p>
          </div>
          <Link
            href="/seller/streams"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Yeni Yayın Aç
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Toplam Yayın", value: stats?.totalStreams || 0, icon: "📺" },
            { label: "Toplam Ürün", value: stats?.totalProducts || 0, icon: "📦" },
            { label: "Toplam Mezat", value: stats?.totalAuctions || 0, icon: "🏷️" },
            { label: "Cüzdan", value: `${user?.wallet?.balance?.toFixed(2) || "0.00"} ₺`, icon: "💰" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/seller/products" className="bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-xl p-5 transition-colors group">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Ürün Ekle</h3>
            <p className="text-sm text-gray-400 mt-1">Mezata çıkarmak istediğin ürünleri ekle</p>
          </Link>
          <Link href="/seller/streams" className="bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-xl p-5 transition-colors group">
            <div className="text-3xl mb-3">🎥</div>
            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Yayın Başlat</h3>
            <p className="text-sm text-gray-400 mt-1">Canlı yayın aç ve mezatı başlat</p>
          </Link>
          <Link href="/wallet" className="bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-xl p-5 transition-colors group">
            <div className="text-3xl mb-3">💳</div>
            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Cüzdanim</h3>
            <p className="text-sm text-gray-400 mt-1">Kazanç ve işlem geçmişi</p>
          </Link>
        </div>

        {/* Recent Streams */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">Son Yayınlar</h2>
            <Link href="/seller/streams" className="text-purple-400 text-sm hover:text-purple-300">
              Tümünü Gör
            </Link>
          </div>
          {streams.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <div className="text-4xl mb-3">📺</div>
              <p>Henüz yayın açmadın.</p>
              <Link href="/seller/streams" className="text-purple-400 text-sm hover:text-purple-300 mt-2 inline-block">
                İlk yayını aç
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {streams.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{s.title}</p>
                    <p className="text-sm text-gray-400">{new Date(s.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.isActive && (
                      <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        CANLI
                      </span>
                    )}
                    <span className="text-sm text-gray-400">{s.viewerCount} izleyici</span>
                    <Link href={`/live/${s.id}`} className="text-purple-400 text-sm hover:text-purple-300">
                      Görüntüle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
