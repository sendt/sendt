"use client";

import { useState, useEffect } from "react";

const FAKE_BIDS = [
  { user: "ahmet_k", amount: 24500, time: "2 sn önce" },
  { user: "fatma_y", amount: 24000, time: "8 sn önce" },
  { user: "murat_d", amount: 23500, time: "15 sn önce" },
  { user: "selin_a", amount: 23000, time: "22 sn önce" },
];

const FAKE_CHAT = [
  { user: "ahmet_k", msg: "Bu telefon gerçek mi? 👀" },
  { user: "fatma_y", msg: "Garantisi var mı?" },
  { user: "murat_d", msg: "Fiyat çok iyi gidiyor" },
  { user: "System", msg: "ahmet_k 24.500 ₺ teklif verdi!", system: true },
  { user: "selin_a", msg: "Çok pahalı oldu benim için 😅" },
  { user: "System", msg: "45 saniye kaldı!", system: true },
  { user: "kemal_b", msg: "Geçeceğim hepsini :)" },
];

export default function DemoAuction() {
  const [timeLeft, setTimeLeft] = useState(47);
  const [currentPrice, setCurrentPrice] = useState(24500);
  const [bidAmount, setBidAmount] = useState("25000");
  const [bids, setBids] = useState(FAKE_BIDS);
  const [chat, setChat] = useState(FAKE_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 0) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const placeBid = () => {
    const amount = parseFloat(bidAmount);
    if (amount <= currentPrice) return;
    const newBid = { user: "sen", amount, time: "az önce" };
    setBids([newBid, ...bids]);
    setCurrentPrice(amount);
    setBidAmount((amount + 500).toString());
    setBidSuccess(`${amount.toLocaleString("tr-TR")} ₺ teklifiniz verildi!`);
    setChat(prev => [...prev, { user: "System", msg: `sen ${amount.toLocaleString("tr-TR")} ₺ teklif verdi!`, system: true }]);
    setTimeout(() => setBidSuccess(""), 3000);
  };

  const sendMsg = () => {
    if (!chatInput.trim()) return;
    setChat(prev => [...prev, { user: "sen", msg: chatInput }]);
    setChatInput("");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">iPhone 15 Pro Max Mezatı</h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>Mehmet Bey Elektronik</span>
              <span>•</span>
              <span>234 izleyici</span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                CANLI
              </span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-400">Kullanılabilir Bakiye</p>
            <p className="text-green-400 font-bold text-lg">5.000 ₺</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Sol: Video + Mezat */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl aspect-video flex items-center justify-center border border-gray-800 relative">
              <div className="text-center">
                <div className="text-6xl mb-3">📱</div>
                <p className="text-white font-semibold">iPhone 15 Pro Max - 256GB - Titan</p>
                <p className="text-gray-400 text-sm">Kutulu, garantili, sıfır</p>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                CANLI YAYIN
              </div>
              <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-lg">
                234 izleyici 👁
              </div>
            </div>

            {/* Mezat Kartı */}
            <div className="bg-gray-900 border border-purple-500/40 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-white text-lg">iPhone 15 Pro Max 256GB</h2>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                    AÇIK ARTIRMA DEVAM EDİYOR
                  </span>
                </div>
                <div className={`text-4xl font-mono font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Fiyat */}
              <div className="bg-gray-800 rounded-xl p-5 mb-5 text-center">
                <p className="text-gray-400 text-sm mb-1">Mevcut En Yüksek Teklif</p>
                <p className="text-5xl font-bold text-purple-400">{currentPrice.toLocaleString("tr-TR")} ₺</p>
                <p className="text-gray-500 text-sm mt-2">Min. artış: 500 ₺</p>
              </div>

              {/* Teklif ver */}
              {bidSuccess && (
                <div className="bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg mb-3 text-sm text-center">
                  ✓ {bidSuccess}
                </div>
              )}
              <div className="flex gap-3 mb-3">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={placeBid}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors"
                >
                  TEKLİF VER
                </button>
              </div>
              {/* Hızlı teklif butonları */}
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map(step => (
                  <button
                    key={step}
                    onClick={() => setBidAmount((currentPrice + step).toString())}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    +{step.toLocaleString("tr-TR")} ₺
                  </button>
                ))}
              </div>

              {/* Son teklifler */}
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Son Teklifler</p>
                <div className="space-y-1">
                  {bids.slice(0, 4).map((b, i) => (
                    <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${i === 0 ? "bg-purple-500/10 border border-purple-500/20" : "bg-gray-800/50"}`}>
                      <span className={`text-sm font-medium ${i === 0 ? "text-purple-400" : "text-gray-400"}`}>
                        {i === 0 && "👑 "}{b.user}
                      </span>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${i === 0 ? "text-white" : "text-gray-400"}`}>
                          {b.amount.toLocaleString("tr-TR")} ₺
                        </span>
                        <span className="text-xs text-gray-600 ml-2">{b.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sohbet */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col" style={{ height: 580 }}>
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Canlı Sohbet</h3>
              <span className="text-xs text-gray-500">234 kişi</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chat.map((m, i) => (
                <div key={i} className={`text-sm ${(m as {system?: boolean}).system ? "text-yellow-400/80 italic bg-yellow-500/5 rounded px-2 py-1" : ""}`}>
                  {!(m as {system?: boolean}).system && (
                    <span className={`font-medium mr-1 ${m.user === "sen" ? "text-green-400" : "text-purple-400"}`}>
                      {m.user}:
                    </span>
                  )}
                  <span className="text-gray-300">{m.msg}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") sendMsg(); }}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Mesaj yaz... (Enter)"
                />
                <button
                  onClick={sendMsg}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
