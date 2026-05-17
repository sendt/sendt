import numpy as np
import pandas as pd
from config import (
    RSI_PERIOD,
    MACD_FAST, MACD_SLOW, MACD_SIGNAL,
    STOCHRSI_RSI_PERIOD, STOCHRSI_STOCH_PERIOD, STOCHRSI_K, STOCHRSI_D,
    HMA_PERIOD,
    DONCHIAN_PERIOD,
    UT_ATR_PERIOD, UT_ATR_MULT,
)


def _r(val, decimals=4):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return None
    return round(float(val), decimals)


# ── RSI ──────────────────────────────────────────────────────────────────────

def _rsi_series(close: pd.Series, period: int) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)


def calc_rsi(df: pd.DataFrame) -> dict:
    rsi = _rsi_series(df["close"], RSI_PERIOD)
    return {"rsi": _r(rsi.iloc[-1], 2)}


# ── MACD ─────────────────────────────────────────────────────────────────────

def calc_macd(df: pd.DataFrame) -> dict:
    close = df["close"]
    ema_fast = close.ewm(span=MACD_FAST, adjust=False).mean()
    ema_slow = close.ewm(span=MACD_SLOW, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=MACD_SIGNAL, adjust=False).mean()
    hist = macd_line - signal_line
    return {
        "macd": _r(macd_line.iloc[-1]),
        "macd_signal": _r(signal_line.iloc[-1]),
        "macd_hist": _r(hist.iloc[-1]),
    }


# ── Stoch RSI ─────────────────────────────────────────────────────────────────

def calc_stochrsi(df: pd.DataFrame) -> dict:
    rsi = _rsi_series(df["close"], STOCHRSI_RSI_PERIOD)
    rsi_min = rsi.rolling(STOCHRSI_STOCH_PERIOD).min()
    rsi_max = rsi.rolling(STOCHRSI_STOCH_PERIOD).max()
    stoch = (rsi - rsi_min) / (rsi_max - rsi_min) * 100
    k = stoch.rolling(STOCHRSI_K).mean()
    d = k.rolling(STOCHRSI_D).mean()
    return {
        "stochrsi_k": _r(k.iloc[-1], 2),
        "stochrsi_d": _r(d.iloc[-1], 2),
    }


# ── Hull Suite ────────────────────────────────────────────────────────────────

def _wma(series: pd.Series, period: int) -> pd.Series:
    weights = np.arange(1, period + 1)
    return series.rolling(period).apply(lambda x: np.dot(x, weights) / weights.sum(), raw=True)


def _hma(series: pd.Series, period: int) -> pd.Series:
    half = max(1, period // 2)
    sqrt_p = max(1, int(np.sqrt(period)))
    return _wma(2 * _wma(series, half) - _wma(series, period), sqrt_p)


def calc_hull_suite(df: pd.DataFrame) -> dict:
    hma = _hma(df["close"], HMA_PERIOD)
    val = hma.iloc[-1]
    prev = hma.iloc[-2]
    direction = "UP" if val > prev else "DOWN"
    return {
        "hull_hma": _r(val),
        "hull_dir": direction,
    }


# ── Donchian Trend Ribbon ─────────────────────────────────────────────────────

def calc_donchian(df: pd.DataFrame) -> dict:
    upper = df["high"].rolling(DONCHIAN_PERIOD).max()
    lower = df["low"].rolling(DONCHIAN_PERIOD).min()
    mid = (upper + lower) / 2
    close = df["close"].iloc[-1]
    trend = "BULL" if close > mid.iloc[-1] else "BEAR"
    return {
        "donchian_upper": _r(upper.iloc[-1]),
        "donchian_mid": _r(mid.iloc[-1]),
        "donchian_lower": _r(lower.iloc[-1]),
        "donchian_trend": trend,
    }


# ── UT Bot Alert ──────────────────────────────────────────────────────────────

def _atr(df: pd.DataFrame, period: int) -> pd.Series:
    high = df["high"]
    low = df["low"]
    close = df["close"]
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    return tr.ewm(com=period - 1, min_periods=period).mean()


def calc_ut_bot(df: pd.DataFrame) -> dict:
    close = df["close"]
    atr = _atr(df, UT_ATR_PERIOD)
    n_loss = atr * UT_ATR_MULT

    trail = np.zeros(len(close))
    close_arr = close.to_numpy()
    nloss_arr = n_loss.to_numpy()

    for i in range(1, len(close_arr)):
        prev = trail[i - 1]
        c = close_arr[i]
        nl = nloss_arr[i]
        if np.isnan(nl):
            trail[i] = c
            continue
        if c > prev:
            trail[i] = max(prev, c - nl)
        else:
            trail[i] = min(prev, c + nl)

    c_now = close_arr[-1]
    c_prev = close_arr[-2]
    t_now = trail[-1]
    t_prev = trail[-2]

    if c_prev <= t_prev and c_now > t_now:
        signal = "BUY"
    elif c_prev >= t_prev and c_now < t_now:
        signal = "SELL"
    else:
        signal = "NEUTRAL"

    return {
        "ut_trail_stop": _r(t_now),
        "ut_signal": signal,
        "ut_above_trail": bool(c_now > t_now),
    }


# ── Tümü ──────────────────────────────────────────────────────────────────────

def get_all(df: pd.DataFrame) -> dict:
    result = {}
    result.update(calc_rsi(df))
    result.update(calc_macd(df))
    result.update(calc_stochrsi(df))
    result.update(calc_hull_suite(df))
    result.update(calc_donchian(df))
    result.update(calc_ut_bot(df))
    return result
