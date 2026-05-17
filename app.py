#!/usr/bin/env python3
"""
Çalıştır: python app.py
Sonra tarayıcıda aç: http://localhost:5000
"""

import csv
import os
from datetime import datetime, timezone

from flask import Flask, jsonify, render_template, request

from config import CSV_FILE, SYMBOL, TIMEFRAMES
from fetcher import fetch_ohlcv
from indicators import get_all

app = Flask(__name__)


def _fetch_all() -> tuple[dict, float]:
    tf_data = {}
    price = 0.0
    for tf in TIMEFRAMES:
        df = fetch_ohlcv(tf)
        tf_data[tf] = get_all(df)
        price = float(df["close"].iloc[-1])
    return tf_data, price


@app.route("/")
def index():
    return render_template("index.html", symbol=SYMBOL)


@app.route("/capture", methods=["POST"])
def capture():
    body = request.json
    action = body.get("action", "open").upper()
    trade_id = body.get("trade_id") or datetime.now(timezone.utc).strftime("T%Y%m%d%H%M%S")
    note = body.get("note", "")

    try:
        tf_data, price = _fetch_all()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    dt = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    _save_csv(action, trade_id, price, dt, tf_data, note)

    return jsonify({
        "trade_id": trade_id,
        "action": action,
        "price": price,
        "datetime_utc": dt,
        "indicators": tf_data,
    })


@app.route("/history")
def history():
    if not os.path.isfile(CSV_FILE):
        return jsonify([])
    rows = []
    with open(CSV_FILE, newline="") as f:
        for row in csv.DictReader(f):
            rows.append(row)
    # son 50 kayıt, en yenisi önce
    return jsonify(list(reversed(rows[-50:])))


def _save_csv(action, trade_id, price, dt, tf_data, note):
    tfs = TIMEFRAMES
    headers = ["trade_id", "action", "symbol", "datetime_utc", "price"]
    for tf in tfs:
        headers += [
            f"{tf}_rsi",
            f"{tf}_macd", f"{tf}_macd_signal", f"{tf}_macd_hist",
            f"{tf}_stochrsi_k", f"{tf}_stochrsi_d",
            f"{tf}_hull_hma", f"{tf}_hull_dir",
            f"{tf}_donchian_upper", f"{tf}_donchian_mid",
            f"{tf}_donchian_lower", f"{tf}_donchian_trend",
            f"{tf}_ut_trail_stop", f"{tf}_ut_signal", f"{tf}_ut_above_trail",
        ]
    headers.append("notes")

    row = {
        "trade_id": trade_id, "action": action, "symbol": SYMBOL,
        "datetime_utc": dt, "price": price, "notes": note,
    }
    for tf, data in tf_data.items():
        for k, v in data.items():
            row[f"{tf}_{k}"] = v

    file_exists = os.path.isfile(CSV_FILE)
    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


if __name__ == "__main__":
    print("\n  Trade Logger başlatıldı.")
    print("  Tarayıcıda aç: http://localhost:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=False)
