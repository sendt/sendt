"use client";

import { useState } from "react";
import DemoHome from "./screens/DemoHome";
import DemoLive from "./screens/DemoLive";
import DemoAuction from "./screens/DemoAuction";
import DemoSeller from "./screens/DemoSeller";
import DemoWallet from "./screens/DemoWallet";

const SCREENS = [
  { id: "home", label: "🏠 Ana Sayfa" },
  { id: "live", label: "📺 Canlı Yayınlar" },
  { id: "auction", label: "⚡ Mezat Ekranı" },
  { id: "seller", label: "🎥 Satıcı Paneli" },
  { id: "wallet", label: "💰 Cüzdan" },
];

export default function DemoPage() {
  const [active, setActive] = useState("home");

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Demo Nav */}
      <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
          <span className="text-yellow-400 text-xs font-bold mr-2">DEMO MOD — Gerçek veri yok</span>
          {SCREENS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                active === s.id
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Content */}
      <div>
        {active === "home" && <DemoHome onNavigate={setActive} />}
        {active === "live" && <DemoLive onNavigate={setActive} />}
        {active === "auction" && <DemoAuction />}
        {active === "seller" && <DemoSeller />}
        {active === "wallet" && <DemoWallet />}
      </div>
    </div>
  );
}
