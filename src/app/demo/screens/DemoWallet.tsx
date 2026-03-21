"use client";

import { useState } from "react";

export default function DemoWallet() {
  const [balance, setBalance] = useState(5000);
  const [selected, setSelected] = useState<number | null>(null);
  const [success, setSuccess] = useState("");

  const deposit = (amount: number) => {
    setBalance(b => b + amount);
    setSuccess(`${amount} ₺ başarıyla yüklendi!`);
    setSelected(null);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Cüzdanım</h1>

        {/* Bakiye kartı */}
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-700/30 rounded-2xl p-6 mb-6">
          <p className="text-purple-300 text-sm mb-1">Toplam Bakiye</p>
          <p className="text-5xl font-bold text-white">{balance.toLocaleString("tr-TR")} ₺</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-purple-300">Kullanılabilir</p>
              <p className="text-xl font-semibold text-green-400">{(balance - 500).toLocaleString("tr-TR")} ₺</p>
            </div>
            <div>
              <p className="text-xs text-purple-300">Teklif Tutma</p>
              <p className="text-xl font-semibold text-yellow-400">500 ₺</p>
            </div>
          </div>
        </div>

        {/* Bakiye yükleme */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Bakiye Yükle</h2>
          {success && (
            <div className="bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg mb-4 text-sm text-center">
              ✓ {success}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[50, 100, 250, 500].map(a => (
              <button
                key={a}
                onClick={() => setSelected(a)}
                className={`py-3 rounded-xl text-sm font-bold border transition-colors ${
                  selected === a
                    ? "border-purple-500 bg-purple-500/20 text-purple-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {a} ₺
              </button>
            ))}
          </div>
          <button
            onClick={() => selected && deposit(selected)}
            disabled={!selected}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white py-3 rounded-xl font-semibold"
          >
            {selected ? `${selected} ₺ Yükle` : "Tutar Seç"}
          </button>
          <p className="text-xs text-gray-500 mt-3 text-center">
            * Gerçek sistemde iyzico ödeme entegrasyonu ile kredi kartı / havale
          </p>
        </div>

        {/* İşlem geçmişi */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="px-5 py-4 border-b border-gray-800 font-semibold text-white">İşlem Geçmişi</div>
          <div className="divide-y divide-gray-800">
            {[
              { type: "Satın Alma", desc: "iPhone 15 Pro Max - Kazandın! 🎉", amount: "-24.500 ₺", color: "text-red-400", time: "Bugün 14:23" },
              { type: "Teklif İadesi", desc: "AirPods Pro - Kaybedildi, iade edildi", amount: "+3.800 ₺", color: "text-blue-400", time: "Bugün 14:20" },
              { type: "Bakiye Yükleme", desc: "Kredi kartı ile yükleme", amount: "+30.000 ₺", color: "text-green-400", time: "Bugün 10:00" },
              { type: "Teklif Tutma", desc: "AirPods Pro teklif tutma", amount: "-3.800 ₺", color: "text-yellow-400", time: "Dün 18:45" },
            ].map((t, i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white text-sm">{t.type}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{t.time}</p>
                </div>
                <p className={`font-bold ${t.color}`}>{t.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
