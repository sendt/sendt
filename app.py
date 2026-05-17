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

from config import EXCEL_FILE, SYMBOL, TIMEFRAMES
from excel_writer import append_row
from fetcher import fetch_ohlcv
from indicators import get_labels

app = Flask(__name__)

_open_trades: dict[str, dict] = {}


def _fetch_one(tf: str, demo: bool, seed: int):
    if demo:
        np.random.seed(seed)
        n = 300
        c = 2.5 + np.cumsum(np.random.randn(n) * 0.01)
        df = pd.DataFrame({
            "open": c, "high": c + 0.02, "low": c - 0.02,
            "close": c, "volume": np.ones(n) * 1000,
        })
    else:
        df = fetch_ohlcv(tf)
    return tf, get_labels(df), float(df["close"].iloc[-1])


def _fetch_all(demo: bool = False) -> tuple[dict, float]:
    tf_data = {}
    price = 0.0
    # 4 timeframe'i paralel çek
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(_fetch_one, tf, demo, i * 7): tf
                   for i, tf in enumerate(TIMEFRAMES)}
        for future in as_completed(futures):
            tf, labels, p = future.result()
            tf_data[tf] = labels
            price = p
    return tf_data, price


@app.route("/")
def index():
    return render_template("index.html", symbol=SYMBOL)


@app.route("/open_trade", methods=["POST"])
def open_trade():
    body = request.json
    demo = body.get("demo", False)
    direction = body.get("direction", "LONG").upper()
    trade_id = datetime.now(timezone.utc).strftime("T%y%m%d%H%M%S")

    try:
        indicators, price = _fetch_all(demo=demo)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    _open_trades[trade_id] = {
        "direction": direction,
        "entry": price,
        "indicators_open": indicators,
    }

    now = datetime.now(timezone.utc)
    return jsonify({
        "trade_id": trade_id,
        "price": round(price, 4),
        "datetime_utc": now.strftime("%Y-%m-%d %H:%M:%S"),
        "indicators": indicators,
    })


@app.route("/close_trade", methods=["POST"])
def close_trade():
    body = request.json
    demo = body.get("demo", False)
    trade_id = body.get("trade_id", "")
    result = body.get("result", "").upper()  # WIN / LOSS / BE / VAZGEÇTİM

    if not trade_id:
        return jsonify({"error": "trade_id gerekli"}), 400

    open_info = _open_trades.get(trade_id)

    try:
        indicators_close, close_price = _fetch_all(demo=demo)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    entry = open_info["entry"] if open_info else close_price
    direction = open_info.get("direction", "LONG") if open_info else "LONG"
    inds_open = open_info.get("indicators_open", indicators_close) if open_info else indicators_close

    now = datetime.now(timezone.utc)
    append_row({
        "date": now.strftime("%d.%m.%y"),
        "time": now.strftime("%H:%M"),
        "direction": direction,
        "entry": round(entry, 4),
        "result": result,
        "indicators": inds_open,
    })

    if trade_id in _open_trades:
        del _open_trades[trade_id]

    return jsonify({
        "trade_id": trade_id,
        "price": round(close_price, 4),
        "datetime_utc": now.strftime("%Y-%m-%d %H:%M:%S"),
        "indicators": indicators_close,
        "result": result,
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
        for row in ws.iter_rows(min_row=5, values_only=True):
            if row[0] is None and row[1] is None:
                continue
            rows.append({
                "date":      str(row[0]) if row[0] else "",
                "time":      str(row[1]) if row[1] else "",
                "direction": row[2] or "",
                "entry":     row[3] or "",
                "result":    row[4] or "",
                "ind_1m":    _row_slice(row, 5),
                "ind_5m":    _row_slice(row, 16),
                "ind_15m":   _row_slice(row, 27),
                "ind_1h":    _row_slice(row, 38),
            })
        return jsonify(list(reversed(rows[-50:])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _row_slice(row, start):
    keys = ["donchian", "fiyat_hull", "rsi", "rsi_prev", "rsi_yon", "rsi_div",
            "ut_bot_k1", "ut_bot_k2", "macd", "stochrsi", "trend"]
    vals = row[start:start + 11]
    return {k: (v or "-") for k, v in zip(keys, vals)}


if __name__ == "__main__":
    print("\n  Trade Logger başlatıldı.")
    print(f"  Tarayıcıda aç: http://localhost:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
