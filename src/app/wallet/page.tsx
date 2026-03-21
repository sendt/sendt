"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface WalletData {
  balance: number;
  heldAmount: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
}

const TX_LABELS: Record<string, string> = {
  DEPOSIT: "Bakiye Yükleme",
  BID_HOLD: "Teklif Tutma",
  BID_REFUND: "Teklif İadesi",
  PURCHASE: "Satın Alma",
  WITHDRAWAL: "Para Çekme",
  COMMISSION: "Komisyon",
};

const TX_COLORS: Record<string, string> = {
  DEPOSIT: "text-green-400",
  BID_REFUND: "text-blue-400",
  BID_HOLD: "text-yellow-400",
  PURCHASE: "text-red-400",
  WITHDRAWAL: "text-orange-400",
  COMMISSION: "text-gray-400",
};

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [depositSuccess, setDepositSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.success) router.push("/login");
    });
    fetch("/api/wallet").then(r => r.json()).then(d => {
      if (d.success) {
        setWallet(d.data.wallet);
        setTransactions(d.data.transactions);
      }
    });
  }, [router]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError("");
    setDepositSuccess("");
    setDepositLoading(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(depositAmount) }),
      });
      const data = await res.json();
      if (!data.success) {
        setDepositError(data.error);
      } else {
        setDepositSuccess(`${depositAmount} ₺ başarıyla yüklendi!`);
        setDepositAmount("");
        setWallet(prev => prev ? { ...prev, balance: data.data.balance } : prev);
        // Reload transactions
        fetch("/api/wallet").then(r => r.json()).then(d => {
          if (d.success) setTransactions(d.data.transactions);
        });
      }
    } catch {
      setDepositError("Hata oluştu.");
    } finally {
      setDepositLoading(false);
    }
  };

  const availableBalance = wallet ? wallet.balance - wallet.heldAmount : 0;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Cüzdanım</h1>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-700/30 rounded-2xl p-6 mb-6">
          <p className="text-purple-300 text-sm mb-1">Toplam Bakiye</p>
          <p className="text-4xl font-bold text-white">{wallet?.balance.toFixed(2) || "0.00"} ₺</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-purple-300">Kullanılabilir</p>
              <p className="text-lg font-semibold text-green-400">{availableBalance.toFixed(2)} ₺</p>
            </div>
            <div>
              <p className="text-xs text-purple-300">Teklif Tutma</p>
              <p className="text-lg font-semibold text-yellow-400">{wallet?.heldAmount.toFixed(2) || "0.00"} ₺</p>
            </div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Bakiye Yükle</h2>

          {depositError && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg mb-3 text-sm">{depositError}</div>
          )}
          {depositSuccess && (
            <div className="bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg mb-3 text-sm">{depositSuccess}</div>
          )}

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[50, 100, 250, 500].map(a => (
              <button
                key={a}
                onClick={() => setDepositAmount(a.toString())}
                className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                  depositAmount === a.toString()
                    ? "border-purple-500 bg-purple-500/20 text-purple-400"
                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {a} ₺
              </button>
            ))}
          </div>

          <form onSubmit={handleDeposit} className="flex gap-3">
            <input
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              placeholder="Tutar girin (₺)"
              min="10"
              step="0.01"
              required
            />
            <button
              type="submit"
              disabled={depositLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium whitespace-nowrap"
            >
              {depositLoading ? "Yükleniyor..." : "Yükle"}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-3">
            * Gerçek ödemede iyzico ödeme sistemi entegre edilecek. Şu an test modu.
          </p>
        </div>

        {/* Transactions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-semibold text-white">İşlem Geçmişi</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">
              <p>Henüz işlem yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {transactions.map(t => (
                <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{TX_LABELS[t.type] || t.type}</p>
                    {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                    <p className="text-xs text-gray-600">{new Date(t.createdAt).toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${TX_COLORS[t.type] || "text-gray-300"}`}>
                      {["DEPOSIT", "BID_REFUND"].includes(t.type) ? "+" : "-"}
                      {t.amount.toFixed(2)} ₺
                    </p>
                    <p className="text-xs text-gray-500">{t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
