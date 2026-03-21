"use client";

import { useState } from "react";

export default function DemoSeller() {
  const [tab, setTab] = useState<"dashboard"|"products"|"stream">("dashboard");

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "dashboard", label: "📊 Genel Bakış" },
            { id: "products", label: "📦 Ürünlerim" },
            { id: "stream", label: "🎥 Yayın Aç" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Satıcı Paneli</h1>
                <p className="text-gray-400">Hoş geldin, Mehmet Bey</p>
              </div>
              <button
                onClick={() => setTab("stream")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                Yeni Yayın Aç
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Toplam Yayın", value: "12", icon: "📺" },
                { label: "Toplam Ürün", value: "47", icon: "📦" },
                { label: "Tamamlanan Mezat", value: "89", icon: "🏷️" },
                { label: "Toplam Kazanç", value: "₺124.500", icon: "💰" },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Aktif yayın */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-red-400 font-bold">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    CANLI YAYIN DEVAM EDİYOR
                  </span>
                  <span className="text-white">iPhone 15 Pro Max Mezatı</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span>234 izleyici</span>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs">
                    Yayını Durdur
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-800 font-semibold text-white">Son Mezatlar</div>
              <div className="divide-y divide-gray-800">
                {[
                  { product: "iPhone 15 Pro Max", winner: "ahmet_k", price: "24.500 ₺", status: "Aktif", color: "text-green-400" },
                  { product: "AirPods Pro 2", winner: "fatma_y", price: "4.200 ₺", status: "Tamamlandı", color: "text-blue-400" },
                  { product: "iPad Air M2", winner: "murat_d", price: "18.900 ₺", status: "Tamamlandı", color: "text-blue-400" },
                ].map((a, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{a.product}</p>
                      <p className="text-sm text-gray-400">Kazanan: {a.winner}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{a.price}</p>
                      <span className={`text-xs ${a.color}`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Ürünlerim</h1>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Ürün Ekle</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "iPhone 15 Pro Max 256GB", price: "22.000 ₺", cat: "Elektronik", cond: "Sıfır", emoji: "📱" },
                { name: "AirPods Pro 2. Nesil", price: "3.500 ₺", cat: "Elektronik", cond: "Sıfır", emoji: "🎧" },
                { name: "iPad Air M2 128GB", price: "16.000 ₺", cat: "Elektronik", cond: "Sıfır", emoji: "📱" },
                { name: "Apple Watch Series 9", price: "11.000 ₺", cat: "Elektronik", cond: "Sıfır Gibi", emoji: "⌚" },
              ].map((p, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="text-4xl">{p.emoji}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{p.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{p.cat}</span>
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{p.cond}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-bold">{p.price}</p>
                    <p className="text-xs text-gray-500">başlangıç</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "stream" && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-6">Yayın Oluştur</h1>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Yayın Başlığı</label>
                  <input
                    defaultValue="iPhone 15 Pro Max Mezatı"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Açıklama</label>
                  <textarea
                    defaultValue="Kutulu garantili sıfır Apple ürünleri mezatı"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    rows={2}
                  />
                </div>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  Yayın Oluştur
                </button>
              </div>
              <div className="mt-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                <p className="text-blue-400 text-xs font-medium mb-1">📡 OBS ile yayın yapma</p>
                <p className="text-blue-300 text-xs">Yayın oluşturduktan sonra size özel stream key verilecek. OBS Studio&apos;ya girerek yayın başlatabilirsiniz.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
