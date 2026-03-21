"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "BUYER";

  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    role: defaultRole,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Kayıt başarısız.");
      } else {
        const role = data.data.role;
        router.push(role === "SELLER" ? "/seller/dashboard" : "/live");
        router.refresh();
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-white font-bold text-2xl">CanoApp</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Kayıt Ol</h1>
          <p className="text-gray-400 mt-1">Canlı mezat platformuna katıl</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Rol Seçimi */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: "BUYER" })}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                form.role === "BUYER"
                  ? "border-purple-500 bg-purple-500/10 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              <div className="text-2xl mb-1">🛒</div>
              <div className="font-medium text-sm">Alıcı</div>
              <div className="text-xs text-gray-500">Teklif ver, satın al</div>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: "SELLER" })}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                form.role === "SELLER"
                  ? "border-pink-500 bg-pink-500/10 text-white"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              <div className="text-2xl mb-1">📺</div>
              <div className="font-medium text-sm">Satıcı</div>
              <div className="text-xs text-gray-500">Yayın aç, sat</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Görünen Ad</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="Adınız Soyadınız"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Kullanıcı Adı</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="kullanici_adi"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">E-posta</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="ornek@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Şifre</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="En az 6 karakter"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? "Kaydediliyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
