import numpy as np
import pandas as pd
from config import (
    RSI_PERIOD, RSI_SMOOTH_PERIOD,
    MACD_FAST, MACD_SLOW, MACD_SIGNAL,
    STOCHRSI_RSI_PERIOD, STOCHRSI_STOCH_PERIOD, STOCHRSI_K, STOCHRSI_D,
    HMA_PERIOD,
    DONCHIAN_PERIOD,
    UT_ATR_PERIOD, UT_KEY1, UT_KEY2,
)


def _r(val, decimals=2):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    return round(float(val), decimals)


# ── RSI (period=6, kaynak=OHLC4, EMA smooth=10) ──────────────────────────────

def _rsi_series(source: pd.Series, period: int) -> pd.Series:
    delta = source.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)


def _ohlc4(df: pd.DataFrame) -> pd.Series:
    return (df["open"] + df["high"] + df["low"] + df["close"]) / 4


# ── MACD ─────────────────────────────────────────────────────────────────────

def _macd_series(close: pd.Series):
    ema_fast = close.ewm(span=MACD_FAST, adjust=False).mean()
    ema_slow = close.ewm(span=MACD_SLOW, adjust=False).mean()
    line = ema_fast - ema_slow
    signal = line.ewm(span=MACD_SIGNAL, adjust=False).mean()
    hist = line - signal
    return line, signal, hist


# ── WMA / HMA ────────────────────────────────────────────────────────────────

def _wma(s: pd.Series, n: int) -> pd.Series:
    w = np.arange(1, n + 1)
    return s.rolling(n).apply(lambda x: np.dot(x, w) / w.sum(), raw=True)


def _hma(s: pd.Series, n: int) -> pd.Series:
    return _wma(2 * _wma(s, max(1, n // 2)) - _wma(s, n), max(1, int(np.sqrt(n))))


# ── ATR ──────────────────────────────────────────────────────────────────────

def _atr(df: pd.DataFrame, period: int) -> pd.Series:
    h, l, c = df["high"], df["low"], df["close"]
    tr = pd.concat([(h - l), (h - c.shift()).abs(), (l - c.shift()).abs()], axis=1).max(axis=1)
    return tr.ewm(com=period - 1, min_periods=period).mean()


# ── UT Bot trail hesabı ───────────────────────────────────────────────────────

def _ut_signal(close_arr: np.ndarray, nloss_arr: np.ndarray) -> str:
    trail = np.zeros(len(close_arr))
    for i in range(1, len(close_arr)):
        prev = trail[i - 1]
        c = close_arr[i]
        nl = nloss_arr[i]
        if np.isnan(nl):
            trail[i] = c
            continue
        trail[i] = max(prev, c - nl) if c > prev else min(prev, c + nl)

    c_now, c_prev = close_arr[-1], close_arr[-2]
    t_now, t_prev = trail[-1], trail[-2]
    if c_prev <= t_prev and c_now > t_now:
        return "BUY"
    if c_prev >= t_prev and c_now < t_now:
        return "SELL"
    return "-"


# ── Label helpers ─────────────────────────────────────────────────────────────

def _stochrsi_label(k) -> str:
    if k is None:
        return "-"
    if k > 80:
        return "OVERBOUGHT"
    if k < 20:
        return "OVERSOLD"
    return "MID"


def _macd_label(hist_now, hist_prev) -> str:
    if hist_now is None or hist_prev is None:
        return "-"
    if hist_now >= 0:
        return "Y.ARTAN" if hist_now > hist_prev else "Y.AZALAN"
    else:
        return "K.ARTAN" if abs(hist_now) > abs(hist_prev) else "K.AZALAN"


def _hull_fiyat_label(hull_dir: str, close: float, hma_val: float) -> str:
    prefix = "Y" if hull_dir == "UP" else "K"
    suffix = "ÜSTÜNDE" if close >= hma_val else "ALTINDA"
    return f"{prefix}.{suffix}"


# ── Ana fonksiyon ─────────────────────────────────────────────────────────────

def get_labels(df: pd.DataFrame) -> dict:
    close = df["close"]
    ohlc4 = _ohlc4(df)

    # RSI: OHLC4 kaynağı, period=6, EMA(10) smooth
    rsi_raw = _rsi_series(ohlc4, RSI_PERIOD)
    rsi_smooth = rsi_raw.ewm(span=RSI_SMOOTH_PERIOD, adjust=False).mean()
    rsi_val = _r(rsi_smooth.iloc[-1], 0)

    # MACD
    _, _, hist_s = _macd_series(close)
    hist_now  = hist_s.iloc[-1]
    hist_prev = hist_s.iloc[-2]
    macd_lbl = _macd_label(
        None if np.isnan(hist_now)  else float(hist_now),
        None if np.isnan(hist_prev) else float(hist_prev),
    )

    # Stoch RSI
    rsi2 = _rsi_series(close, STOCHRSI_RSI_PERIOD)
    rmin = rsi2.rolling(STOCHRSI_STOCH_PERIOD).min()
    rmax = rsi2.rolling(STOCHRSI_STOCH_PERIOD).max()
    stoch = (rsi2 - rmin) / (rmax - rmin) * 100
    k_val = _r(stoch.rolling(STOCHRSI_K).mean().iloc[-1], 1)
    stoch_lbl = _stochrsi_label(k_val)

    # Hull Suite
    hma_s = _hma(close, HMA_PERIOD)
    hma_val  = float(hma_s.iloc[-1])
    hma_prev = float(hma_s.iloc[-2])
    hull_dir = "UP" if hma_val > hma_prev else "DOWN"
    trend_lbl = "YUKARI" if hull_dir == "UP" else "AŞAĞI"
    fiyat_hull_lbl = _hull_fiyat_label(hull_dir, float(close.iloc[-1]), hma_val)

    # Donchian
    upper = df["high"].rolling(DONCHIAN_PERIOD).max()
    lower = df["low"].rolling(DONCHIAN_PERIOD).min()
    mid = (upper + lower) / 2
    donchian_lbl = "YEŞİL" if float(close.iloc[-1]) > float(mid.iloc[-1]) else "KIRMIZI"

    # UT Bot — iki sensitivity
    atr_s = _atr(df, UT_ATR_PERIOD)
    close_arr = close.to_numpy()
    ut_lbl_k1 = _ut_signal(close_arr, (atr_s * UT_KEY1).to_numpy())
    ut_lbl_k2 = _ut_signal(close_arr, (atr_s * UT_KEY2).to_numpy())

    return {
        "donchian":   donchian_lbl,
        "fiyat_hull": fiyat_hull_lbl,
        "rsi":        rsi_val,
        "ut_bot_k1":  ut_lbl_k1,
        "ut_bot_k2":  ut_lbl_k2,
        "macd":       macd_lbl,
        "stochrsi":   stoch_lbl,
        "trend":      trend_lbl,
    }
