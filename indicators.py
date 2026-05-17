import numpy as np
import pandas as pd
from config import (
    RSI_PERIOD, RSI_SMOOTH_PERIOD,
    MACD_FAST, MACD_SLOW, MACD_SIGNAL,
    STOCHRSI_RSI_PERIOD, STOCHRSI_STOCH_PERIOD, STOCHRSI_K, STOCHRSI_D,
    HMA_PERIOD, DONCHIAN_PERIOD,
    UT_ATR_PERIOD, UT_KEY1, UT_KEY2,
)


def _r(val, d=2):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    return round(float(val), d)


def _ohlc4(df):
    return (df["open"] + df["high"] + df["low"] + df["close"]) / 4


# ── RSI ──────────────────────────────────────────────────────────────────────

def _rsi_series(src, period):
    delta = src.diff()
    gain  = delta.clip(lower=0)
    loss  = -delta.clip(upper=0)
    ag = gain.ewm(com=period - 1, min_periods=period).mean()
    al = loss.ewm(com=period - 1, min_periods=period).mean()
    return 100 - 100 / (1 + ag / al)


def _divergence(close, rsi, pivot_bars=5, lookback=60):
    c = close.iloc[-lookback:].to_numpy()
    r = rsi.iloc[-lookback:].to_numpy()
    n = len(c)
    lows, highs = [], []
    for i in range(pivot_bars, n - pivot_bars):
        if np.isnan(r[i]):
            continue
        w = c[i - pivot_bars: i + pivot_bars + 1]
        if c[i] == w.min():
            lows.append((i, c[i], r[i]))
        if c[i] == w.max():
            highs.append((i, c[i], r[i]))
    if len(lows) >= 2:
        p1, p2 = lows[-2], lows[-1]
        if p2[1] < p1[1] and p2[2] > p1[2]:
            return "Bull"
    if len(highs) >= 2:
        p1, p2 = highs[-2], highs[-1]
        if p2[1] > p1[1] and p2[2] < p1[2]:
            return "Bear"
    return "-"


# ── MACD ─────────────────────────────────────────────────────────────────────

def _macd_series(close):
    ef = close.ewm(span=MACD_FAST,   adjust=False).mean()
    es = close.ewm(span=MACD_SLOW,   adjust=False).mean()
    line   = ef - es
    signal = line.ewm(span=MACD_SIGNAL, adjust=False).mean()
    return line, signal, line - signal


# ── WMA / HMA ────────────────────────────────────────────────────────────────

def _wma(s, n):
    w = np.arange(1, n + 1)
    return s.rolling(n).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)


def _hma(s, n):
    return _wma(2 * _wma(s, max(1, n // 2)) - _wma(s, n), max(1, int(np.sqrt(n))))


# ── ATR ──────────────────────────────────────────────────────────────────────

def _atr(df, period):
    h, l, c = df["high"], df["low"], df["close"]
    tr = pd.concat([(h - l), (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
    return tr.ewm(com=period - 1, min_periods=period).mean()


# ── UT Bot ────────────────────────────────────────────────────────────────────

def _ut_signal(close_arr, nloss_arr):
    trail = np.zeros(len(close_arr))
    for i in range(1, len(close_arr)):
        prev, c, nl = trail[i - 1], close_arr[i], nloss_arr[i]
        if np.isnan(nl):
            trail[i] = c
            continue
        trail[i] = max(prev, c - nl) if c > prev else min(prev, c + nl)
    c_now, c_prev = close_arr[-1], close_arr[-2]
    t_now, t_prev = trail[-1], trail[-2]
    if c_prev <= t_prev and c_now > t_now: return "BUY"
    if c_prev >= t_prev and c_now < t_now: return "SELL"
    return "-"


# ── Ana fonksiyon ─────────────────────────────────────────────────────────────

def get_labels(df: pd.DataFrame) -> dict:
    close  = df["close"]
    ohlc4  = _ohlc4(df)

    # RSI
    rsi_raw    = _rsi_series(ohlc4, RSI_PERIOD)
    rsi_smooth = rsi_raw.ewm(span=RSI_SMOOTH_PERIOD, adjust=False).mean()
    rsi_now    = _r(rsi_smooth.iloc[-1], 1)
    rsi_prev   = _r(rsi_smooth.iloc[-2], 1)
    rsi_yon    = "YUKARI" if rsi_smooth.iloc[-1] > rsi_smooth.iloc[-2] else "AŞAĞI"
    rsi_div    = _divergence(close, rsi_smooth)

    # MACD
    _, _, hist_s = _macd_series(close)
    hist_now  = float(hist_s.iloc[-1])
    hist_prev = float(hist_s.iloc[-2])
    macd_hist = _r(hist_now, 5)
    if not np.isnan(hist_now) and not np.isnan(hist_prev):
        if hist_now >= 0:
            macd_yon = "Y.ARTAN"  if hist_now > hist_prev else "Y.AZALAN"
        else:
            macd_yon = "K.ARTAN"  if abs(hist_now) > abs(hist_prev) else "K.AZALAN"
    else:
        macd_yon = "-"

    # Stoch RSI — sayısal K ve D
    rsi2  = _rsi_series(close, STOCHRSI_RSI_PERIOD)
    rmin  = rsi2.rolling(STOCHRSI_STOCH_PERIOD).min()
    rmax  = rsi2.rolling(STOCHRSI_STOCH_PERIOD).max()
    stoch = (rsi2 - rmin) / (rmax - rmin) * 100
    k_ser = stoch.rolling(STOCHRSI_K).mean()
    d_ser = k_ser.rolling(STOCHRSI_D).mean()
    stoch_k = _r(k_ser.iloc[-1], 1)
    stoch_d = _r(d_ser.iloc[-1], 1)

    # Hull Suite
    hma_s    = _hma(close, HMA_PERIOD)
    hma_val  = float(hma_s.iloc[-1])
    hma_prev = float(hma_s.iloc[-2])
    hull_dir = "UP" if hma_val > hma_prev else "DOWN"
    trend    = "YUKARI" if hull_dir == "UP" else "AŞAĞI"
    prefix   = "Y" if hull_dir == "UP" else "K"
    suffix   = "ÜSTÜNDE" if float(close.iloc[-1]) >= hma_val else "ALTINDA"
    fiyat_hull = f"{prefix}.{suffix}"

    # Donchian
    upper = df["high"].rolling(DONCHIAN_PERIOD).max()
    lower = df["low"].rolling(DONCHIAN_PERIOD).min()
    mid   = (upper + lower) / 2
    u_val = float(upper.iloc[-1])
    l_val = float(lower.iloc[-1])
    c_val = float(close.iloc[-1])
    donchian     = "YEŞİL" if c_val > float(mid.iloc[-1]) else "KIRMIZI"
    # kanalda yüzde konum: 0%=alt bant, 100%=üst bant
    band_range   = u_val - l_val
    donchian_pct = _r((c_val - l_val) / band_range * 100 if band_range > 0 else 50, 1)

    # UT Bot
    atr_s     = _atr(df, UT_ATR_PERIOD)
    close_arr = close.to_numpy()
    ut_k1 = _ut_signal(close_arr, (atr_s * UT_KEY1).to_numpy())
    ut_k2 = _ut_signal(close_arr, (atr_s * UT_KEY2).to_numpy())

    # Hacim oranı: şu anki hacim / 20 mum ortalaması
    vol     = df["volume"]
    vol_avg = vol.rolling(20).mean().iloc[-1]
    vol_now = vol.iloc[-1]
    vol_ratio = _r(vol_now / vol_avg if vol_avg > 0 else 1.0, 2)
    if vol_ratio is not None:
        vol_lbl = "YÜKSEK" if vol_ratio > 1.5 else ("DÜŞÜK" if vol_ratio < 0.8 else "NORMAL")
    else:
        vol_lbl = "-"

    # ATR% : volatilite yüzdesi (ATR14 / fiyat * 100)
    atr14   = _atr(df, 14).iloc[-1]
    atr_pct = _r(atr14 / c_val * 100 if c_val > 0 else 0, 3)

    return {
        "donchian":     donchian,
        "donchian_pct": donchian_pct,
        "fiyat_hull":   fiyat_hull,
        "rsi":          rsi_now,
        "rsi_prev":     rsi_prev,
        "rsi_yon":      rsi_yon,
        "rsi_div":      rsi_div,
        "stoch_k":      stoch_k,
        "stoch_d":      stoch_d,
        "ut_bot_k1":    ut_k1,
        "ut_bot_k2":    ut_k2,
        "macd_hist":    macd_hist,
        "macd_yon":     macd_yon,
        "trend":        trend,
        "vol_ratio":    vol_ratio,
        "vol_lbl":      vol_lbl,
        "atr_pct":      atr_pct,
    }
