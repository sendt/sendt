"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  title: string;
  description?: string;
  startingPrice: number;
  category?: string;
  condition?: string;
  images: string[];
  createdAt: string;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    startingPrice: "",
    category: "",
    condition: "USED",
  });

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startingPrice: parseFloat(form.startingPrice) }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        setProducts([data.data, ...products]);
        setShowForm(false);
        setForm({ title: "", description: "", startingPrice: "", category: "", condition: "USED" });
      }
    } catch {
      setError("Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Ürünlerim</h1>
            <p className="text-gray-400">Mezata çıkaracağın ürünleri yönet</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            {showForm ? "İptal" : "+ Ürün Ekle"}
          </button>
        </div>

        {/* Add Product Form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-white mb-4">Yeni Ürün Ekle</h2>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Ürün Adı *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Ürün adını girin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Başlangıç Fiyatı (₺) *</label>
                  <input
                    type="number"
                    value={form.startingPrice}
                    onChange={e => setForm({ ...form, startingPrice: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Kategori</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Seçin</option>
                    <option value="electronics">Elektronik</option>
                    <option value="clothing">Giyim</option>
                    <option value="jewelry">Takı & Aksesuar</option>
                    <option value="home">Ev & Yaşam</option>
                    <option value="collectibles">Koleksiyon</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Durum</label>
                  <select
                    value={form.condition}
                    onChange={e => setForm({ ...form, condition: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="NEW">Sıfır</option>
                    <option value="LIKE_NEW">Sıfır Gibi</option>
                    <option value="USED">Kullanılmış</option>
                    <option value="REFURBISHED">Yenilenmiş</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Ürün hakkında detaylı bilgi..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white px-4 py-2.5"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-400">Henüz ürün eklemedin.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-purple-400 text-sm hover:text-purple-300 mt-2"
            >
              İlk ürününü ekle
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{p.title}</h3>
                  <span className="text-purple-400 font-bold text-lg">{p.startingPrice.toFixed(2)} ₺</span>
                </div>
                {p.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex gap-2">
                  {p.category && (
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{p.category}</span>
                  )}
                  {p.condition && (
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{p.condition}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
