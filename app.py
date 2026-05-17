#!/usr/bin/env python3
"""
Çalıştır: python app.py
Tarayıcıda aç: http://localhost:5000
"""

import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request

from config import BTC_SYMBOL, EXCEL_FILE, SYMBOL, TIMEFRAMES
from excel_writer import append_row
from fetcher import fetch_ohlcv
from indicators import get_labels

app = Flask(__name__)

_open_trades: dict[str, dict] = {}

GUNLER  = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"]


def _seans(hour_utc: int) -> str:
    if 0 <= hour_utc < 8:   return "Asya"
    if 8 <= hour_utc < 15:  return "Avrupa"
    if 15 <= hour_utc < 22: return "ABD"
    return "Sakin"


def _demo_df(seed):
    np.random.seed(seed)
    n = 300
    c = 2.5 + np.cumsum(np.random.randn(n) * 0.01)
    return pd.DataFrame({"open":c,"high":c+0.02,"low":c-0.02,"close":c,"volume":np.ones(n)*1000})


def _fetch_all(demo=False):
    tf_data = {}
    price   = 0.0

    def _one(tf, seed):
        df = _demo_df(seed) if demo else fetch_ohlcv(SYMBOL, tf)
        return tf, get_labels(df), float(df["close"].iloc[-1])

    def _btc():
        if demo:
            return "YUKARI"
        df = fetch_ohlcv(BTC_SYMBOL, "1h")
        return "YUKARI" if df["close"].iloc[-1] > df["close"].iloc[-2] else "AŞAĞI"

    with ThreadPoolExecutor(max_workers=6) as pool:
        tf_futures = {pool.submit(_one, tf, i*7): tf for i, tf in enumerate(TIMEFRAMES)}
        btc_future = pool.submit(_btc)

        for f in as_completed(tf_futures):
            tf, labels, p = f.result()
            tf_data[tf] = labels
            price = p

        btc_yon = btc_future.result()

    return tf_data, price, btc_yon


@app.route("/")
def index():
    return render_template("index.html", symbol=SYMBOL)


@app.route("/open_trade", methods=["POST"])
def open_trade():
    body      = request.json
    demo      = body.get("demo", False)
    direction = body.get("direction", "LONG").upper()
    trade_id  = datetime.now(timezone.utc).strftime("T%y%m%d%H%M%S")

    try:
        indicators, price, btc_yon = _fetch_all(demo=demo)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    now = datetime.now(timezone.utc)
    _open_trades[trade_id] = {
        "direction":      direction,
        "indicators_open": indicators,
        "btc_yon":        btc_yon,
        "gun":            GUNLER[now.weekday()],
        "seans":          _seans(now.hour),
        "date":           now.strftime("%d.%m.%y"),
        "time":           now.strftime("%H:%M"),
    }

    return jsonify({
        "trade_id":    trade_id,
        "price":       round(price, 4),
        "datetime_utc":now.strftime("%Y-%m-%d %H:%M:%S"),
        "indicators":  indicators,
        "btc_yon":     btc_yon,
        "gun":         GUNLER[now.weekday()],
        "seans":       _seans(now.hour),
    })


@app.route("/close_trade", methods=["POST"])
def close_trade():
    body     = request.json
    demo     = body.get("demo", False)
    trade_id = body.get("trade_id", "")
    result   = body.get("result", "").upper()

    if not trade_id:
        return jsonify({"error": "trade_id gerekli"}), 400

    open_info = _open_trades.get(trade_id, {})

    try:
        indicators_close, close_price, _ = _fetch_all(demo=demo)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    append_row({
        "date":      open_info.get("date", ""),
        "time":      open_info.get("time", ""),
        "gun":       open_info.get("gun", ""),
        "seans":     open_info.get("seans", ""),
        "direction": open_info.get("direction", "LONG"),
        "result":    result,
        "indicators":open_info.get("indicators_open", indicators_close),
        "btc_yon":   open_info.get("btc_yon", "-"),
    })

    _open_trades.pop(trade_id, None)

    return jsonify({
        "trade_id":    trade_id,
        "price":       round(close_price, 4),
        "datetime_utc":datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "indicators":  indicators_close,
        "result":      result,
    })


@app.route("/history")
def history():
    import openpyxl
    if not os.path.isfile(EXCEL_FILE):
        return jsonify([])
    try:
        wb = openpyxl.load_workbook(EXCEL_FILE)
        ws = wb["TRADE LOG"]
        rows = []
        n_info = 6
        n_ind  = 14
        for row in ws.iter_rows(min_row=5, values_only=True):
            if row[0] is None:
                continue
            rows.append({
                "date":      str(row[0]) if row[0] else "",
                "time":      str(row[1]) if row[1] else "",
                "gun":       row[2] or "",
                "seans":     row[3] or "",
                "direction": row[4] or "",
                "result":    row[5] or "",
                "ind_1m":    _slice(row, n_info + 0*n_ind, n_ind),
                "ind_5m":    _slice(row, n_info + 1*n_ind, n_ind),
                "ind_15m":   _slice(row, n_info + 2*n_ind, n_ind),
                "ind_1h":    _slice(row, n_info + 3*n_ind, n_ind),
                "ind_1d":    _slice(row, n_info + 4*n_ind, n_ind),
                "btc_yon":   row[n_info + 5*n_ind] or "-",
            })
        return jsonify(list(reversed(rows[-50:])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _slice(row, start, n):
    keys = ["donchian","donchian_pct","fiyat_hull","rsi","rsi_prev","rsi_yon","rsi_div",
            "stoch_k","stoch_d","ut_bot_k1","ut_bot_k2","macd_hist","macd_yon","trend"]
    return {k: (row[start+i] if start+i < len(row) else "-") or "-"
            for i, k in enumerate(keys[:n])}


if __name__ == "__main__":
    print("\n  Trade Logger başlatıldı.")
    print(f"  Tarayıcıda aç: http://localhost:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
