import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            CANLI MEZAT PLATFORMU
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Canlı Yayında
            <br />
            Alışveriş Devrimi
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Satıcılar canlı yayın açar, siz gerçek zamanlı açık artırmaya katılırsınız.
            TikTok ve Instagram mezatlarını artık kendi platformumuzda yapıyoruz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/live"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all hover:scale-105"
            >
              Canlı Yayınları İzle
            </Link>
            <Link
              href="/register?role=SELLER"
              className="border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white px-8 py-3 rounded-xl font-semibold text-lg transition-all"
            >
              Satıcı Ol
            </Link>
          </div>
        </div>
      </section>

      {/* Nasıl Çalışır */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nasıl Çalışır?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
              <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                📦
              </div>
              <h3 className="text-xl font-semibold mb-3">Satıcılar Yayın Açar</h3>
              <p className="text-gray-400">
                Satıcılar ürünlerini ekler ve canlı yayın başlatır. İzleyiciler anlık bildirim alır.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
              <div className="w-14 h-14 bg-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                💰
              </div>
              <h3 className="text-xl font-semibold mb-3">Bakiye Yükle ve Teklif Ver</h3>
              <p className="text-gray-400">
                Cüzdanına bakiye yükle, açık artırmaya katıl. Kazanırsan ürün sana gelir.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 text-center">
              <div className="w-14 h-14 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                🚚
              </div>
              <h3 className="text-xl font-semibold mb-3">Kazan ve Teslim Al</h3>
              <p className="text-gray-400">
                En yüksek teklifi veren kazanır. Ürün adresinize kargo ile gönderilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Özellikleri</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { emoji: "📺", title: "Gerçek Zamanlı Yayın", desc: "HD kalitede canlı yayın. Satıcı sizi görür, siz satıcıyı görürsünüz." },
              { emoji: "⚡", title: "Anlık Teklif Sistemi", desc: "Milisaniyeler içinde teklifler işlenir. Kimse sizi geçemez." },
              { emoji: "🔒", title: "Güvenli Ödeme", desc: "Bakiyeniz güvende. Kaybettiğiniz açık artırmaların parası anında iade edilir." },
              { emoji: "💬", title: "Canlı Sohbet", desc: "Yayın sırasında satıcı ve diğer alıcılarla anlık iletişim kurun." },
              { emoji: "📱", title: "Mobil Uyumlu", desc: "Telefon, tablet veya bilgisayardan kesintisiz katılım." },
              { emoji: "🏆", title: "Şeffaf Mezat", desc: "Tüm teklifler herkese açık. Adil ve şeffaf bir sistem." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-5 bg-gray-900/50 rounded-xl border border-gray-800">
                <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Hemen Başla</h2>
          <p className="text-gray-400 mb-8">
            Ücretsiz kayıt ol, canlı yayınları izle ve ilk teklifini ver.
          </p>
          <Link
            href="/register"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
          >
            Ücretsiz Kayıt Ol
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-500 text-sm">
        <p>© 2025 CanoApp - canoapp.net | Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
