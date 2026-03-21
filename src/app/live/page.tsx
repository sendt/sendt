"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stream {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  viewerCount: number;
  thumbnail?: string;
  seller: { id: string; displayName: string; username: string };
  auctions: Array<{ title: string; currentPrice: number }>;
}

export default function LiveStreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live">("all");

  useEffect(() => {
    const url = filter === "live" ? "/api/streams?active=true" : "/api/streams";
    fetch(url)
      .then(r => r.json())
      .then(d => { if (d.success) setStreams(d.data); })
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Canlı Yayınlar</h1>
            <p className="text-gray-400">Açık artırmalara katıl ve fırsatı kaçırma</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all" ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("live")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${filter === "live" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >
              <span className="w-1.5 h-1.5 bg-current rounded-full" />
              Sadece Canlı
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-800" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📺</div>
            <h2 className="text-xl font-semibold text-white mb-2">Şu an aktif yayın yok</h2>
            <p className="text-gray-400 mb-6">Satıcılar yakında yayın açacak. Bildirimleri aç!</p>
            <Link href="/register?role=SELLER" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium">
              Sen Yayın Aç
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streams.map(s => (
              <Link key={s.id} href={`/live/${s.id}`} className="group">
                <div className="bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all hover:scale-[1.02]">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-800 relative flex items-center justify-center">
                    {s.thumbnail ? (
                      <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl">🎥</div>
                    )}
                    {s.isActive && (
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        CANLI
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {s.viewerCount} izleyici
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-1 mb-1">
                      {s.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">{s.seller.displayName}</p>

                    {/* Active auction price */}
                    {s.auctions.length > 0 && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                        <p className="text-xs text-purple-400 font-medium">MEZAT</p>
                        <p className="text-white font-bold">{s.auctions[0].title}</p>
                        <p className="text-purple-300 text-sm">{s.auctions[0].currentPrice.toFixed(2)} ₺</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
