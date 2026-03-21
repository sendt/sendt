"use client";

export default function DemoHome({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Fake Navbar */}
      <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-white font-bold text-xl">CanoApp</span>
          <span className="text-purple-400 text-xs bg-purple-900/30 px-2 py-0.5 rounded-full">CANLI MEZAT</span>
        </div>
        <div className="flex gap-3 items-center">
          <button className="text-gray-300 text-sm">Canlı Yayınlar</button>
          <button className="text-gray-300 px-3 py-1.5 text-sm">Giriş Yap</button>
          <button className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Kayıt Ol</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            CANLI MEZAT PLATFORMU
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
            Canlı Yayında<br />Alışveriş Devrimi
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Satıcılar canlı yayın açar, siz gerçek zamanlı açık artırmaya katılırsınız.
            TikTok ve Instagram mezatlarını artık kendi platformumuzda yapıyoruz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate("live")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Canlı Yayınları İzle →
            </button>
            <button
              onClick={() => onNavigate("seller")}
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Satıcı Ol
            </button>
          </div>
        </div>
      </section>

      {/* Canlı Yayın Önizleme */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Şu An Canlı</h2>
            <span className="flex items-center gap-1.5 text-red-400 text-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              3 yayın aktif
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Mehmet Bey Elektronik", title: "iPhone 15 Pro Max Mezatı", price: "24.500", viewers: 234, color: "from-blue-900/40 to-purple-900/40" },
              { name: "Altın Dükkanı", title: "22 Ayar Altın Bilezik", price: "8.900", viewers: 567, color: "from-yellow-900/40 to-orange-900/40" },
              { name: "Vintage Shop", title: "Rolex Saat Koleksiyonu", price: "45.000", viewers: 189, color: "from-green-900/40 to-teal-900/40" },
            ].map((s, i) => (
              <button key={i} onClick={() => onNavigate("auction")} className="group text-left">
                <div className="bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all hover:scale-[1.02]">
                  <div className={`aspect-video bg-gradient-to-br ${s.color} relative flex items-center justify-center`}>
                    <div className="text-5xl">🎥</div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      CANLI
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {s.viewers} izleyici
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-400 mb-1">{s.name}</p>
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">{s.title}</h3>
                    <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-purple-400">GÜNCEL TEKLİF</p>
                      <p className="text-purple-300 font-bold text-lg">{s.price} ₺</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">Nasıl Çalışır?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: "📦", title: "Satıcılar Yayın Açar", desc: "Ürünlerini ekler, canlı yayın başlatır. Yüzlerce alıcı anında haberdar olur." },
              { emoji: "💰", title: "Bakiye Yükle & Teklif Ver", desc: "Cüzdanına bakiye yükle, açık artırmaya katıl. Kazanırsan ürün sana gelir." },
              { emoji: "🚚", title: "Kazan & Teslim Al", desc: "En yüksek teklifi veren kazanır. Ürün adresine kargo ile gönderilir." },
            ].map((f, i) => (
              <div key={i} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        © 2025 CanoApp - canoapp.net
      </footer>
    </div>
  );
}
