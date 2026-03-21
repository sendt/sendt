"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stream {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  viewerCount: number;
  streamKey: string;
  createdAt: string;
}

export default function SellerStreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = () => {
    fetch("/api/streams")
      .then(r => r.json())
      .then(d => { if (d.success) setStreams(d.data); })
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error);
      } else {
        setStreams([data.data, ...streams]);
        setShowForm(false);
        setForm({ title: "", description: "" });
      }
    } catch {
      setError("Hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStream = async (streamId: string, isActive: boolean) => {
    await fetch(`/api/streams/${streamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: isActive ? "stop" : "start" }),
    });
    loadStreams();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Yayınlarım</h1>
            <p className="text-gray-400">Canlı yayınlarını yönet</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            {showForm ? "İptal" : "Yeni Yayın"}
          </button>
        </div>

        {/* Create Stream Form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-white mb-4">Yeni Yayın Oluştur</h2>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Yayın Başlığı *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  placeholder="örn: Elektronik Mezat - iPhone, Apple Watch"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
                  rows={2}
                  placeholder="Yayında satılacak ürünler hakkında bilgi..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium"
                >
                  {submitting ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* OBS / Streaming Info */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-blue-400 mb-2">📡 Yayın Nasıl Yapılır?</h3>
          <p className="text-blue-300 text-sm">
            OBS Studio veya Streamlabs kullanarak RTMP ile yayın yapabilirsin.
            Yayın anahtarını (Stream Key) OBS ayarlarına gir. İleri aşamada Agora SDK ile
            tarayıcı üzerinden de yayın yapılabilecek.
          </p>
        </div>

        {/* Streams List */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Yükleniyor...</div>
        ) : streams.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 text-center">
            <div className="text-4xl mb-3">🎥</div>
            <p className="text-gray-400">Henüz yayın oluşturmadın.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {streams.map(s => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{s.title}</h3>
                      {s.isActive && (
                        <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          CANLI
                        </span>
                      )}
                    </div>
                    {s.description && <p className="text-gray-400 text-sm mt-1">{s.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStream(s.id, s.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        s.isActive
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {s.isActive ? "Yayını Durdur" : "Yayını Başlat"}
                    </button>
                    <Link
                      href={`/live/${s.id}`}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm"
                    >
                      Görüntüle
                    </Link>
                  </div>
                </div>

                {/* Stream Key */}
                <div className="bg-gray-800 rounded-lg p-3 mt-3">
                  <p className="text-xs text-gray-500 mb-1">Stream Key (OBS için):</p>
                  <code className="text-xs text-green-400 break-all">{s.streamKey}</code>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                  <span>{s.viewerCount} izleyici</span>
                  <span>{new Date(s.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
