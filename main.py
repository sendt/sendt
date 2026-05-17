#!/usr/bin/env python3
"""
Kullanım:
  python main.py open          -> İşlem açma kaydı
  python main.py close         -> İşlem kapama kaydı
  python main.py open --id X   -> Belirli bir trade_id ile kayıt
  python main.py open -n "not" -> Notla birlikte kayıt
  python main.py open --demo   -> Gerçek bağlantı olmadan test et
"""

import argparse
import sys
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from colorama import Fore, Style, init

from config import SYMBOL, TIMEFRAMES, CANDLE_LIMIT
from fetcher import fetch_ohlcv
from indicators import get_all
from logger import save_row

init(autoreset=True)


def print_header():
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"  TradingView İndikatör Yakalayıcı — {SYMBOL}")
    print(f"{'='*60}{Style.RESET_ALL}\n")


def _make_demo_df(seed: int) -> pd.DataFrame:
    np.random.seed(seed)
    n = CANDLE_LIMIT
    close = 2.5 + np.cumsum(np.random.randn(n) * 0.01)
    high = close + np.abs(np.random.randn(n) * 0.02)
    low = close - np.abs(np.random.randn(n) * 0.02)
    return pd.DataFrame({"open": close, "high": high, "low": low, "close": close, "volume": np.ones(n) * 1000})


def fetch_all_timeframes(demo: bool = False) -> tuple:
    tf_data = {}
    price = 0.0
    for i, tf in enumerate(TIMEFRAMES):
        print(f"  {Fore.YELLOW}[{tf}]{Style.RESET_ALL} veri çekiliyor...", end=" ", flush=True)
        if demo:
            df = _make_demo_df(seed=i)
        else:
            df = fetch_ohlcv(tf)
        indicators = get_all(df)
        tf_data[tf] = indicators
        price = df["close"].iloc[-1]
        suffix = "(DEMO)" if demo else f"(son kapanış: {price:.4f})"
        print(f"{Fore.GREEN}OK{Style.RESET_ALL}  {suffix}")
    return tf_data, price


def display_results(action: str, price: float, tf_data: dict, trade_id: str):
    action_color = Fore.GREEN if action == "OPEN" else Fore.RED
    print(f"\n{action_color}{'▶ İŞLEM AÇILDI' if action == 'OPEN' else '◀ İŞLEM KAPATILDI'}{Style.RESET_ALL}")
    print(f"  Trade ID : {Fore.WHITE}{trade_id}{Style.RESET_ALL}")
    print(f"  Sembol   : {SYMBOL}")
    print(f"  Fiyat    : {price:.4f} USDT")
    print(f"  Zaman    : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC\n")

    for tf, data in tf_data.items():
        print(f"  {Fore.CYAN}── {tf} ──────────────────────────────{Style.RESET_ALL}")

        rsi = data.get("rsi")
        rsi_color = Fore.RED if rsi and rsi > 70 else (Fore.GREEN if rsi and rsi < 30 else Fore.WHITE)
        print(f"    RSI              : {rsi_color}{rsi}{Style.RESET_ALL}")

        print(f"    MACD             : {data.get('macd')}  Signal: {data.get('macd_signal')}  Hist: {data.get('macd_hist')}")

        k = data.get("stochrsi_k")
        d = data.get("stochrsi_d")
        srsi_color = Fore.RED if k and k > 80 else (Fore.GREEN if k and k < 20 else Fore.WHITE)
        print(f"    Stoch RSI        : K={srsi_color}{k}{Style.RESET_ALL}  D={d}")

        hull_dir = data.get("hull_dir")
        hull_color = Fore.GREEN if hull_dir == "UP" else Fore.RED
        print(f"    Hull Suite       : {data.get('hull_hma')}  Yön: {hull_color}{hull_dir}{Style.RESET_ALL}")

        dtrend = data.get("donchian_trend")
        d_color = Fore.GREEN if dtrend == "BULL" else Fore.RED
        print(f"    Donchian Ribbon  : Üst={data.get('donchian_upper')}  Orta={data.get('donchian_mid')}  Alt={data.get('donchian_lower')}  Trend: {d_color}{dtrend}{Style.RESET_ALL}")

        ut_sig = data.get("ut_signal")
        ut_color = Fore.GREEN if ut_sig == "BUY" else (Fore.RED if ut_sig == "SELL" else Fore.WHITE)
        above = "✓ fiyat üstünde" if data.get("ut_above_trail") else "✗ fiyat altında"
        print(f"    UT Bot           : Trail={data.get('ut_trail_stop')}  Sinyal: {ut_color}{ut_sig}{Style.RESET_ALL}  ({above})")
        print()


def main():
    parser = argparse.ArgumentParser(description="TradingView indikatör kaydedici")
    parser.add_argument("action", choices=["open", "close"], help="İşlem yönü: open veya close")
    parser.add_argument("--id", dest="trade_id", help="Trade ID (belirtilmezse otomatik oluşturulur)")
    parser.add_argument("-n", "--note", default="", help="Bu işleme ait not")
    parser.add_argument("--demo", action="store_true", help="İnternet olmadan demo modunda çalıştır")
    args = parser.parse_args()

    action = args.action.upper()
    trade_id = args.trade_id or datetime.now(timezone.utc).strftime("T%Y%m%d%H%M%S")

    print_header()
    src = "DEMO verisi" if args.demo else "Binance'ten veri çekiliyor"
    print(f"  {Fore.YELLOW}{src}...{Style.RESET_ALL}\n")

    try:
        tf_data, price = fetch_all_timeframes(demo=args.demo)
    except Exception as e:
        print(f"\n{Fore.RED}HATA: {e}{Style.RESET_ALL}")
        sys.exit(1)

    display_results(action, price, tf_data, trade_id)

    save_row(
        action=action,
        symbol=SYMBOL,
        price=price,
        tf_data=tf_data,
        trade_id=trade_id,
        notes=args.note,
    )

    print(f"  {Fore.GREEN}✓ Kaydedildi → trades.csv{Style.RESET_ALL}\n")


if __name__ == "__main__":
    main()
