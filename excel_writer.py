import os
from datetime import datetime

import openpyxl
from openpyxl.styles import (
    Alignment, Border, Font, PatternFill, Side
)
from openpyxl.utils import get_column_letter

from config import EXCEL_FILE, TIMEFRAMES

# ── Renkler ──────────────────────────────────────────────────────────────────
C_HEADER_BG   = "1F2937"  # koyu gri başlık
C_HEADER_FG   = "F9FAFB"
C_TF_1M       = "1E3A5F"
C_TF_5M       = "1E4D3A"
C_TF_15M      = "4A2020"
C_TF_1H       = "3B2A50"
C_INFO_BG     = "111827"
C_ROW_EVEN    = "1A2233"
C_ROW_ODD     = "111827"
C_GREEN_TXT   = "22C55E"
C_RED_TXT     = "EF4444"
C_YELLOW_TXT  = "EAB308"
C_WHITE       = "F9FAFB"
C_GRAY        = "9CA3AF"
C_WIN         = "16A34A"
C_LOSS        = "DC2626"
C_BE          = "D97706"

TF_LABELS = {"1m": "1 DAKİKA", "5m": "5 DAKİKA", "15m": "15 DAKİKA", "1h": "1 SAAT (OPS.)"}
TF_COLORS = {"1m": C_TF_1M, "5m": C_TF_5M, "15m": C_TF_15M, "1h": C_TF_1H}

IND_COLS   = ["Donchian", "Fiyat/Hull", "RSI", "UT Bot", "MACD", "StochRSI", "Trend"]
INFO_COLS  = ["Tarih", "Saat", "Yön", "Giriş", "Stop", "TP", "Sonuç", "R:R"]
ALL_COLS   = INFO_COLS + IND_COLS * len(TIMEFRAMES)


def _fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)


def _font(bold=False, color=C_WHITE, size=9):
    return Font(bold=bold, color=color, name="Segoe UI", size=size)


def _center():
    return Alignment(horizontal="center", vertical="center", wrap_text=True)


def _thin_border():
    s = Side(style="thin", color="374151")
    return Border(left=s, right=s, top=s, bottom=s)


def _create_workbook() -> openpyxl.Workbook:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "TRADE LOG"

    # Başlık satırı 1
    ws.merge_cells("A1:AJ1")
    ws["A1"] = f"WLD/USDT — TRADE JOURNAL"
    ws["A1"].font = Font(bold=True, color=C_WHITE, name="Segoe UI", size=13)
    ws["A1"].fill = _fill(C_HEADER_BG)
    ws["A1"].alignment = _center()

    # Başlık satırı 2
    ws.merge_cells("A2:AJ2")
    ws["A2"] = "Paper Trading · 31x Kaldıraç · Hedef: 50 İşlem · Bot Geliştirme Verisi"
    ws["A2"].font = _font(color=C_GRAY)
    ws["A2"].fill = _fill(C_HEADER_BG)
    ws["A2"].alignment = _center()

    # Satır 3: Bölüm başlıkları
    ws.merge_cells("A3:H3")
    ws["A3"] = "📋 İŞLEM BİLGİLERİ"
    ws["A3"].font = _font(bold=True)
    ws["A3"].fill = _fill(C_INFO_BG)
    ws["A3"].alignment = _center()

    col = 9
    for tf in TIMEFRAMES:
        end_col = col + len(IND_COLS) - 1
        start_letter = get_column_letter(col)
        end_letter = get_column_letter(end_col)
        ws.merge_cells(f"{start_letter}3:{end_letter}3")
        cell = ws[f"{start_letter}3"]
        cell.value = f"⏱ {TF_LABELS[tf]}"
        cell.font = _font(bold=True)
        cell.fill = _fill(TF_COLORS[tf])
        cell.alignment = _center()
        col = end_col + 1

    # Satır 4: Sütun başlıkları
    for i, h in enumerate(ALL_COLS, start=1):
        cell = ws.cell(row=4, column=i, value=h)
        tf_idx = (i - 9) // len(IND_COLS) if i >= 9 else -1
        if i <= 8:
            cell.fill = _fill(C_INFO_BG)
        else:
            tf = TIMEFRAMES[tf_idx] if tf_idx < len(TIMEFRAMES) else TIMEFRAMES[-1]
            cell.fill = _fill(TF_COLORS[tf])
        cell.font = _font(bold=True, size=8)
        cell.alignment = _center()
        cell.border = _thin_border()

    ws.row_dimensions[1].height = 22
    ws.row_dimensions[2].height = 16
    ws.row_dimensions[3].height = 18
    ws.row_dimensions[4].height = 16

    # Sütun genişlikleri
    for i in range(1, len(ALL_COLS) + 1):
        letter = get_column_letter(i)
        if i <= 2:
            ws.column_dimensions[letter].width = 10
        elif i <= 8:
            ws.column_dimensions[letter].width = 9
        else:
            idx = (i - 9) % len(IND_COLS)
            ws.column_dimensions[letter].width = [11, 16, 6, 8, 12, 12, 9][idx]

    ws.freeze_panes = "A5"

    _add_legend(wb)
    return wb


def _add_legend(wb: openpyxl.Workbook):
    ws = wb.create_sheet("AÇIKLAMALAR")
    rows = [
        ("MACD Değerleri", None),
        (None, "Y.ARTAN",  "Yeşil histogram büyüyor → alıcılar güçleniyor"),
        (None, "Y.AZALAN", "Yeşil histogram küçülüyor → alıcılar yoruluyor"),
        (None, "K.ARTAN",  "Kırmızı histogram büyüyor → satıcılar güçleniyor"),
        (None, "K.AZALAN", "Kırmızı histogram küçülüyor → satıcılar yoruluyor"),
        (),
        ("StochRSI", None),
        (None, "OVERBOUGHT", "80 üzeri — aşırı alım, düşüş ihtimali"),
        (None, "MID",        "20-80 arası — nötr"),
        (None, "OVERSOLD",   "20 altı — aşırı satım, yükseliş ihtimali"),
        (),
        ("Fiyat/Hull", None),
        (None, "Y.ÜSTÜNDE", "Yeşil Hull + fiyat Hull üstünde"),
        (None, "Y.ALTINDA", "Yeşil Hull + fiyat Hull altında"),
        (None, "K.ÜSTÜNDE", "Kırmızı Hull + fiyat Hull üstünde"),
        (None, "K.ALTINDA", "Kırmızı Hull + fiyat Hull altında"),
    ]
    for r, data in enumerate(rows, start=1):
        for c, val in enumerate(data, start=1):
            if val:
                ws.cell(row=r, column=c, value=val)


def _color_for_value(col_name: str, val) -> str | None:
    """Değere göre yazı rengi döner."""
    col = col_name.lower()
    if val in ("YEŞİL", "BULL", "BUY", "WIN", "LONG", "YUKARI", "Y.ARTAN"):
        return C_GREEN_TXT
    if val in ("KIRMIZI", "BEAR", "SELL", "LOSS", "SHORT", "AŞAĞI", "K.ARTAN"):
        return C_RED_TXT
    if val in ("BE", "NEUTRAL", "YATAY", "MID", "Y.AZALAN", "K.AZALAN"):
        return C_YELLOW_TXT
    if col == "rsi" and val is not None:
        try:
            v = float(val)
            if v > 70: return C_RED_TXT
            if v < 30: return C_GREEN_TXT
        except (ValueError, TypeError):
            pass
    if "overbought" in str(val).lower():
        return C_RED_TXT
    if "oversold" in str(val).lower():
        return C_GREEN_TXT
    return None


def append_row(trade: dict):
    """
    trade dict anahtarları:
      date, time, direction, entry, stop, tp, result, rr
      indicators: {"1m": {donchian, fiyat_hull, rsi, ut_bot, macd, stochrsi, trend}, ...}
    """
    if os.path.isfile(EXCEL_FILE):
        wb = openpyxl.load_workbook(EXCEL_FILE)
        ws = wb["TRADE LOG"]
    else:
        wb = _create_workbook()
        ws = wb["TRADE LOG"]

    next_row = ws.max_row + 1
    row_fill = _fill(C_ROW_EVEN if next_row % 2 == 0 else C_ROW_ODD)

    ind_keys = ["donchian", "fiyat_hull", "rsi", "ut_bot", "macd", "stochrsi", "trend"]
    col_names = INFO_COLS + IND_COLS * len(TIMEFRAMES)

    values = [
        trade.get("date", ""),
        trade.get("time", ""),
        trade.get("direction", ""),
        trade.get("entry", ""),
        trade.get("stop", ""),
        trade.get("tp", ""),
        trade.get("result", ""),
        trade.get("rr", ""),
    ]
    for tf in TIMEFRAMES:
        tf_data = trade.get("indicators", {}).get(tf, {})
        for k in ind_keys:
            values.append(tf_data.get(k, "-"))

    for col_i, (val, col_name) in enumerate(zip(values, col_names), start=1):
        cell = ws.cell(row=next_row, column=col_i, value=val)
        cell.fill = row_fill
        cell.alignment = _center()
        cell.border = _thin_border()
        color = _color_for_value(col_name, val)
        cell.font = _font(color=color or C_WHITE)

    ws.row_dimensions[next_row].height = 15
    wb.save(EXCEL_FILE)
