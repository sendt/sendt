"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

interface User {
  id: string;
  displayName: string;
  username: string;
  role: string;
  wallet?: { balance: number; heldAmount: number };
}

interface Auction {
  id: string;
  title: string;
  currentPrice: number;
  startingPrice: number;
  minBidStep: number;
  buyNowPrice?: number;
  status: string;
  duration: number;
  startedAt?: string;
  product?: { images: string[]; description?: string };
}

interface ChatMsg {
  id: string;
  userId: string;
  message: string;
  isSystem: boolean;
  createdAt: string;
  user: { displayName: string; username: string };
}

interface StreamData {
  id: string;
  title: string;
  isActive: boolean;
  viewerCount: number;
  seller: { id: string; displayName: string; username: string };
  auctions: Auction[];
  messages: ChatMsg[];
}

export default function LiveStreamPage({ params }: { params: Promise<{ streamId: string }> }) {
  const { streamId } = use(params);
  const router = useRouter();
  const [stream, setStream] = useState<StreamData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeAuction, setActiveAuction] = useState<Auction | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; title: string; startingPrice: number }>>([]);
  const [auctionForm, setAuctionForm] = useState({ productId: "", minBidStep: "1", buyNowPrice: "", duration: "60" });
  const socketRef = useRef<Socket | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.success) setUser(d.data); });
    fetch(`/api/streams/${streamId}`).then(r => r.json()).then(d => {
      if (d.success) {
        setStream(d.data);
        setMessages(d.data.messages.reverse());
        const live = d.data.auctions.find((a: Auction) => a.status === "LIVE");
        if (live) {
          setActiveAuction(live);
          setBidAmount((live.currentPrice + live.minBidStep).toString());
          startTimer(live);
        }
      }
    });
  }, [streamId]);

  useEffect(() => {
    if (stream && user) {
      setIsSeller(stream.seller.id === user.id);
    }
  }, [stream, user]);

  useEffect(() => {
    if (isSeller) {
      fetch("/api/products").then(r => r.json()).then(d => { if (d.success) setProducts(d.data); });
    }
  }, [isSeller]);

  // Socket.io bağlantısı
  useEffect(() => {
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.emit("join-stream", streamId);

    socket.on("new-chat-message", (msg: ChatMsg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("auction-update", (data: { type: string; auction?: Auction; auctionId?: string; currentPrice?: number; bidder?: { displayName: string }; finalPrice?: number; winner?: { displayName: string } }) => {
      if (data.type === "bid" && data.auctionId) {
        setActiveAuction(prev => prev ? { ...prev, currentPrice: data.currentPrice || prev.currentPrice } : prev);
        setBidAmount(((data.currentPrice || 0) + (activeAuction?.minBidStep || 1)).toString());
      } else if (data.type === "started" && data.auction) {
        setActiveAuction(data.auction);
        startTimer(data.auction);
        setBidAmount((data.auction.currentPrice + data.auction.minBidStep).toString());
      } else if (data.type === "ended") {
        setActiveAuction(null);
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(null);
      }
    });

    socket.on("viewer-update", (count: number) => {
      setStream(prev => prev ? { ...prev, viewerCount: count } : prev);
    });

    return () => {
      socket.emit("leave-stream", streamId);
      socket.disconnect();
    };
  }, [streamId]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const startTimer = (auction: Auction) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!auction.startedAt) return;
    const endTime = new Date(auction.startedAt).getTime() + auction.duration * 1000;
    const update = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
    };
    update();
    timerRef.current = setInterval(update, 1000);
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !user || !socketRef.current) return;
    socketRef.current.emit("chat-message", {
      streamId,
      message: chatInput,
      user: { id: user.id, displayName: user.displayName, username: user.username },
    });
    setChatInput("");
  };

  const placeBid = async () => {
    if (!user) { router.push("/login"); return; }
    setBidError("");
    setBidSuccess("");
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0) { setBidError("Geçerli bir teklif miktarı girin."); return; }

    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auctionId: activeAuction?.id, amount }),
    });
    const data = await res.json();
    if (!data.success) {
      setBidError(data.error);
    } else {
      setBidSuccess(`${amount.toFixed(2)} ₺ teklifiniz verildi!`);
      if (socketRef.current) {
        socketRef.current.emit("bid-placed", {
          streamId,
          auctionId: activeAuction?.id,
          amount,
          bidder: { displayName: user.displayName },
        });
      }
      setTimeout(() => setBidSuccess(""), 3000);
    }
  };

  const startAuction = async () => {
    if (!activeAuction && auctionForm.productId) {
      const product = products.find(p => p.id === auctionForm.productId);
      if (!product) return;
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId,
          productId: auctionForm.productId,
          title: product.title,
          startingPrice: product.startingPrice,
          minBidStep: parseFloat(auctionForm.minBidStep),
          buyNowPrice: auctionForm.buyNowPrice ? parseFloat(auctionForm.buyNowPrice) : null,
          duration: parseInt(auctionForm.duration),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveAuction(data.data);
        setShowAuctionForm(false);
        startTimer(data.data);
        if (socketRef.current) {
          socketRef.current.emit("auction-started", { streamId, auction: data.data });
        }
      }
    }
  };

  const endAuction = async () => {
    if (!activeAuction) return;
    const res = await fetch(`/api/auctions/${activeAuction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    const data = await res.json();
    if (data.success) {
      if (socketRef.current) {
        socketRef.current.emit("auction-ended", {
          streamId,
          auctionId: activeAuction.id,
          finalPrice: activeAuction.currentPrice,
        });
      }
      setActiveAuction(null);
      setTimeLeft(null);
    }
  };

  const availableBalance = user?.wallet ? user.wallet.balance - user.wallet.heldAmount : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!stream) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">{stream.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>{stream.seller.displayName}</span>
              <span>•</span>
              <span>{stream.viewerCount} izleyici</span>
              {stream.isActive && (
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  CANLI
                </span>
              )}
            </div>
          </div>
          {user && (
            <div className="ml-auto text-right">
              <p className="text-sm text-gray-400">Kullanılabilir Bakiye</p>
              <p className="text-green-400 font-bold">{availableBalance.toFixed(2)} ₺</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Video + Auction */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center border border-gray-800">
              {stream.isActive ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <span className="text-white text-2xl">▶</span>
                  </div>
                  <p className="text-white font-medium">Canlı Yayın</p>
                  <p className="text-gray-400 text-sm mt-1">Agora SDK entegrasyonu ile canlı video burada görünecek</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📺</div>
                  <p>Yayın henüz başlamadı</p>
                </div>
              )}
            </div>

            {/* Active Auction */}
            {activeAuction ? (
              <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-white text-lg">{activeAuction.title}</h2>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">AÇIK ARTIRMA DEVAM EDİYOR</span>
                  </div>
                  {timeLeft !== null && (
                    <div className={`text-3xl font-mono font-bold ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                      {formatTime(timeLeft)}
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 rounded-xl p-4 mb-4 text-center">
                  <p className="text-gray-400 text-sm mb-1">Mevcut En Yüksek Teklif</p>
                  <p className="text-4xl font-bold text-purple-400">{activeAuction.currentPrice.toFixed(2)} ₺</p>
                  <p className="text-gray-500 text-sm mt-1">Min. artış: {activeAuction.minBidStep} ₺</p>
                </div>

                {!isSeller ? (
                  <div>
                    {bidError && (
                      <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg mb-3 text-sm">{bidError}</div>
                    )}
                    {bidSuccess && (
                      <div className="bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg mb-3 text-sm">{bidSuccess}</div>
                    )}
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-purple-500"
                        step="0.01"
                      />
                      <button
                        onClick={placeBid}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
                      >
                        TEKLİF VER
                      </button>
                    </div>
                    {/* Quick bid buttons */}
                    <div className="flex gap-2 mt-2">
                      {[activeAuction.minBidStep, activeAuction.minBidStep * 2, activeAuction.minBidStep * 5].map(step => (
                        <button
                          key={step}
                          onClick={() => setBidAmount((activeAuction.currentPrice + step).toFixed(2))}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm"
                        >
                          +{step} ₺
                        </button>
                      ))}
                    </div>
                    {!user && (
                      <p className="text-center text-gray-400 text-sm mt-3">
                        Teklif vermek için{" "}
                        <a href="/login" className="text-purple-400 hover:text-purple-300">giriş yap</a>
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={endAuction}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold"
                  >
                    Mezatı Bitir
                  </button>
                )}
              </div>
            ) : isSeller && stream.isActive ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-white">Mezat Başlat</h2>
                  <button
                    onClick={() => setShowAuctionForm(!showAuctionForm)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    {showAuctionForm ? "İptal" : "Yeni Mezat"}
                  </button>
                </div>
                {showAuctionForm && (
                  <div className="space-y-3">
                    <select
                      value={auctionForm.productId}
                      onChange={e => setAuctionForm({ ...auctionForm, productId: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white"
                    >
                      <option value="">Ürün Seç</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title} - {p.startingPrice} ₺</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-400">Min. Artış (₺)</label>
                        <input
                          type="number"
                          value={auctionForm.minBidStep}
                          onChange={e => setAuctionForm({ ...auctionForm, minBidStep: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white mt-1"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Hemen Al (₺)</label>
                        <input
                          type="number"
                          value={auctionForm.buyNowPrice}
                          onChange={e => setAuctionForm({ ...auctionForm, buyNowPrice: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white mt-1"
                          placeholder="İsteğe bağlı"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Süre (sn)</label>
                        <input
                          type="number"
                          value={auctionForm.duration}
                          onChange={e => setAuctionForm({ ...auctionForm, duration: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white mt-1"
                          min="30"
                          max="3600"
                        />
                      </div>
                    </div>
                    <button
                      onClick={startAuction}
                      disabled={!auctionForm.productId}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium"
                    >
                      Mezatı Başlat
                    </button>
                  </div>
                )}
              </div>
            ) : !activeAuction ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-400">
                <div className="text-3xl mb-2">⏳</div>
                <p>Şu an aktif mezat yok. Satıcı yakında başlatacak.</p>
              </div>
            ) : null}
          </div>

          {/* Chat */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col h-[600px]">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="font-semibold text-white text-sm">Canlı Sohbet</h3>
            </div>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`text-sm ${m.isSystem ? "text-yellow-400/70 italic" : ""}`}>
                  {!m.isSystem && (
                    <span className="font-medium text-purple-400 mr-1">{m.user.displayName}:</span>
                  )}
                  <span className="text-gray-300">{m.message}</span>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-gray-600 text-sm text-center mt-4">Henüz mesaj yok. İlk mesajı sen gönder!</p>
              )}
            </div>
            <div className="p-3 border-t border-gray-800">
              {user ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Mesaj yaz..."
                    maxLength={200}
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Gönder
                  </button>
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm">
                  <a href="/login" className="text-purple-400 hover:text-purple-300">Giriş yap</a> ve sohbete katıl
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
