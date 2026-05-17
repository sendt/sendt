import os

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from config import EXCEL_FILE, TIMEFRAMES

C_HEADER_BG = "1F2937"
C_TF_1M     = "1E3A5F"
C_TF_5M     = "1E4D3A"
C_TF_15M    = "4A2020"
C_TF_1H     = "3B2A50"
C_INFO_BG   = "111827"
C_ROW_EVEN  = "1A2233"
C_ROW_ODD   = "111827"
C_GREEN     = "22C55E"
C_RED       = "EF4444"
C_YELLOW    = "EAB308"
C_WHITE     = "F9FAFB"
C_GRAY      = "9CA3AF"

TF_LABELS = {"1m": "1 DAKİKA", "5m": "5 DAKİKA", "15m": "15 DAKİKA", "1h": "1 SAAT (OPS.)"}
TF_COLORS = {"1m": C_TF_1M, "5m": C_TF_5M, "15m": C_TF_15M, "1h": C_TF_1H}

INFO_COLS = ["Tarih", "Saat", "Yön", "Giriş", "Stop", "TP", "Sonuç", "R:R"]
IND_COLS  = ["Donchian", "Fiyat/Hull", "RSI", "UT Bot K=1", "UT Bot K=2", "MACD", "StochRSI", "Trend"]
IND_KEYS  = ["donchian", "fiyat_hull", "rsi", "ut_bot_k1", "ut_bot_k2", "macd", "stochrsi", "trend"]
ALL_COLS  = INFO_COLS + IND_COLS * len(TIMEFRAMES)

# Sütun genişlikleri (IND_COLS sırasıyla)
IND_WIDTHS = [11, 16, 6, 9, 9, 13, 12, 9]


def _fill(c): return PatternFill("solid", fgColor=c)
def _font(bold=False, color=C_WHITE, size=9): return Font(bold=bold, color=color, name="Segoe UI", size=size)
def _center(): return Alignment(horizontal="center", vertical="center", wrap_text=True)
def _border():
    s = Side(style="thin", color="374151")
    return Border(left=s, right=s, top=s, bottom=s)


def _create_workbook() -> openpyxl.Workbook:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "TRADE LOG"

    last_col = get_column_letter(len(ALL_COLS))

    ws.merge_cells(f"A1:{last_col}1")
    ws["A1"] = "WLD/USDT — TRADE JOURNAL"
    ws["A1"].font = Font(bold=True, color=C_WHITE, name="Segoe UI", size=13)
    ws["A1"].fill = _fill(C_HEADER_BG)
    ws["A1"].alignment = _center()

    ws.merge_cells(f"A2:{last_col}2")
    ws["A2"] = "Paper Trading · 31x Kaldıraç · Hedef: 50 İşlem · Bot Geliştirme Verisi"
    ws["A2"].font = _font(color=C_GRAY)
    ws["A2"].fill = _fill(C_HEADER_BG)
    ws["A2"].alignment = _center()

    # Satır 3: bölüm başlıkları
    ws.merge_cells("A3:H3")
    ws["A3"] = "📋 İŞLEM BİLGİLERİ"
    ws["A3"].font = _font(bold=True)
    ws["A3"].fill = _fill(C_INFO_BG)
    ws["A3"].alignment = _center()

    col = 9
    for tf in TIMEFRAMES:
        end = col + len(IND_COLS) - 1
        sl = get_column_letter(col)
        el = get_column_letter(end)
        ws.merge_cells(f"{sl}3:{el}3")
        cell = ws[f"{sl}3"]
        cell.value = f"⏱ {TF_LABELS[tf]}"
        cell.font = _font(bold=True)
        cell.fill = _fill(TF_COLORS[tf])
        cell.alignment = _center()
        col = end + 1

    # Satır 4: sütun isimleri
    for i, h in enumerate(ALL_COLS, start=1):
        cell = ws.cell(row=4, column=i, value=h)
        if i <= 8:
            cell.fill = _fill(C_INFO_BG)
        else:
            tf_idx = min((i - 9) // len(IND_COLS), len(TIMEFRAMES) - 1)
            cell.fill = _fill(TF_COLORS[TIMEFRAMES[tf_idx]])
        cell.font = _font(bold=True, size=8)
        cell.alignment = _center()
        cell.border = _border()

    for r, h in [(1, 22), (2, 16), (3, 18), (4, 16)]:
        ws.row_dimensions[r].height = h

    for i in range(1, len(ALL_COLS) + 1):
        letter = get_column_letter(i)
        if i <= 2:
            ws.column_dimensions[letter].width = 10
        elif i <= 8:
            ws.column_dimensions[letter].width = 9
        else:
            ws.column_dimensions[letter].width = IND_WIDTHS[(i - 9) % len(IND_COLS)]

    ws.freeze_panes = "A5"
    _add_legend(wb)
    return wb


def _add_legend(wb):
    ws = wb.create_sheet("AÇIKLAMALAR")
    rows = [
        ("MACD Değerleri",),
        (None, "Y.ARTAN",  "Yeşil histogram büyüyor → alıcılar güçleniyor"),
        (None, "Y.AZALAN", "Yeşil histogram küçülüyor → alıcılar yoruluyor"),
        (None, "K.ARTAN",  "Kırmızı histogram büyüyor → satıcılar güçleniyor"),
        (None, "K.AZALAN", "Kırmızı histogram küçülüyor → satıcılar yoruluyor"),
        (),
        ("StochRSI",),
        (None, "OVERBOUGHT", "80 üzeri — aşırı alım, düşüş ihtimali"),
        (None, "MID",        "20-80 arası — nötr"),
        (None, "OVERSOLD",   "20 altı — aşırı satım, yükseliş ihtimali"),
        (),
        ("Fiyat/Hull",),
        (None, "Y.ÜSTÜNDE", "Yeşil Hull + fiyat Hull üstünde"),
        (None, "Y.ALTINDA", "Yeşil Hull + fiyat Hull altında"),
        (None, "K.ÜSTÜNDE", "Kırmızı Hull + fiyat Hull üstünde"),
        (None, "K.ALTINDA", "Kırmızı Hull + fiyat Hull altında"),
        (),
        ("UT Bot",),
        (None, "K=1", "Key=1 ATR=10 — daha hassas, daha fazla sinyal"),
        (None, "K=2", "Key=2 ATR=10 — daha az hassas, daha güvenilir sinyal"),
    ]
    for r, data in enumerate(rows, start=1):
        for c, val in enumerate(data, start=1):
            if val:
                ws.cell(row=r, column=c, value=val)


def _val_color(col_name: str, val) -> str | None:
    if val in ("YEŞİL", "BUY", "WIN", "LONG", "YUKARI", "Y.ARTAN"):
        return C_GREEN
    if val in ("KIRMIZI", "SELL", "LOSS", "SHORT", "AŞAĞI", "K.ARTAN"):
        return C_RED
    if val in ("BE", "MID", "Y.AZALAN", "K.AZALAN", "YATAY"):
        return C_YELLOW
    if "rsi" in col_name.lower() and val is not None:
        try:
            v = float(val)
            if v > 70: return C_RED
            if v < 30: return C_GREEN
        except (ValueError, TypeError):
            pass
    if str(val).upper() == "OVERBOUGHT": return C_RED
    if str(val).upper() == "OVERSOLD":   return C_GREEN
    return None


def append_row(trade: dict):
    if os.path.isfile(EXCEL_FILE):
        wb = openpyxl.load_workbook(EXCEL_FILE)
        ws = wb["TRADE LOG"]
    else:
        wb = _create_workbook()
        ws = wb["TRADE LOG"]

    next_row = ws.max_row + 1
    row_fill = _fill(C_ROW_EVEN if next_row % 2 == 0 else C_ROW_ODD)

    values = [
        trade.get("date", ""), trade.get("time", ""),
        trade.get("direction", ""), trade.get("entry", ""),
        trade.get("stop", ""), trade.get("tp", ""),
        trade.get("result", ""), trade.get("rr", ""),
    ]
    for tf in TIMEFRAMES:
        tf_data = trade.get("indicators", {}).get(tf, {})
        for k in IND_KEYS:
            values.append(tf_data.get(k, "-"))

    for col_i, (val, col_name) in enumerate(zip(values, ALL_COLS), start=1):
        cell = ws.cell(row=next_row, column=col_i, value=val)
        cell.fill = row_fill
        cell.alignment = _center()
        cell.border = _border()
        color = _val_color(col_name, val)
        cell.font = _font(color=color or C_WHITE)

    ws.row_dimensions[next_row].height = 15
    wb.save(EXCEL_FILE)
