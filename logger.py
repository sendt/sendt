import csv
import os
from datetime import datetime, timezone
from config import CSV_FILE, TIMEFRAMES


def _build_headers():
    base = ["trade_id", "action", "symbol", "datetime_utc", "price"]
    for tf in TIMEFRAMES:
        base += [
            f"{tf}_rsi",
            f"{tf}_macd", f"{tf}_macd_signal", f"{tf}_macd_hist",
            f"{tf}_stochrsi_k", f"{tf}_stochrsi_d",
            f"{tf}_hull_hma", f"{tf}_hull_dir",
            f"{tf}_donchian_upper", f"{tf}_donchian_mid", f"{tf}_donchian_lower", f"{tf}_donchian_trend",
            f"{tf}_ut_trail_stop", f"{tf}_ut_signal", f"{tf}_ut_above_trail",
        ]
    base.append("notes")
    return base


def save_row(action: str, symbol: str, price: float, tf_data: dict, trade_id: str, notes: str = ""):
    headers = _build_headers()
    file_exists = os.path.isfile(CSV_FILE)

    row = {
        "trade_id": trade_id,
        "action": action,
        "symbol": symbol,
        "datetime_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "price": price,
        "notes": notes,
    }

    for tf, data in tf_data.items():
        for key, val in data.items():
            row[f"{tf}_{key}"] = val

    with open(CSV_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)
