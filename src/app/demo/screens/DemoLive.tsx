"use client";

const STREAMS = [
  { name: "Mehmet Bey Elektronik", title: "iPhone 15 Pro Max Mezatı", price: "24.500", viewers: 234, color: "from-blue-900/40 to-purple-900/40", badge: "Elektronik" },
  { name: "Altın Dükkanı", title: "22 Ayar Altın Bilezik", price: "8.900", viewers: 567, color: "from-yellow-900/40 to-orange-900/40", badge: "Takı" },
  { name: "Vintage Shop", title: "Rolex Saat Koleksiyonu", price: "45.000", viewers: 189, color: "from-green-900/40 to-teal-900/40", badge: "Saat" },
  { name: "Giyim Dünyası", title: "Kadın Çanta Koleksiyonu", price: "1.200", viewers: 98, color: "from-pink-900/40 to-rose-900/40", badge: "Giyim" },
  { name: "Tekno Market", title: "MacBook Pro M3", price: "67.000", viewers: 412, color: "from-gray-900/40 to-slate-900/40", badge: "Elektronik", offline: true },
  { name: "Koleksiyoncular", title: "Antika Para Koleksiyonu", price: "3.400", viewers: 55, color: "from-amber-900/40 to-yellow-900/40", badge: "Koleksiyon", offline: true },
];

export default function DemoLive({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Canlı Yayınlar</h1>
            <p className="text-gray-400">Açık artırmalara katıl ve fırsatı kaçırma</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Sadece Canlı (4)
            </button>
            <button className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium">
              Tümü
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STREAMS.map((s, i) => (
            <button key={i} onClick={() => !s.offline && onNavigate("auction")} className="group text-left">
              <div className={`bg-gray-900 border ${s.offline ? "border-gray-800 opacity-60" : "border-gray-800 hover:border-purple-500/50 hover:scale-[1.02]"} rounded-2xl overflow-hidden transition-all`}>
                <div className={`aspect-video bg-gradient-to-br ${s.color} relative flex items-center justify-center`}>
                  <div className="text-5xl">🎥</div>
                  {!s.offline ? (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      CANLI
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded-full">
                      Çevrimdışı
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {s.badge}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {s.viewers} izleyici
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-400 mb-1">{s.name}</p>
                  <h3 className={`font-semibold text-white ${!s.offline ? "group-hover:text-purple-400" : ""} transition-colors`}>{s.title}</h3>
                  {!s.offline && (
                    <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-purple-400 font-medium">MEZAT</p>
                      <p className="text-purple-300 font-bold">{s.price} ₺</p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
