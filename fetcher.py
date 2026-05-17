import ccxt
import pandas as pd
from config import EXCHANGE, CANDLE_LIMIT


def fetch_ohlcv(symbol: str, timeframe: str) -> pd.DataFrame:
    exchange = getattr(ccxt, EXCHANGE)({"enableRateLimit": True})
    raw = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=CANDLE_LIMIT)
    df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df.set_index("timestamp", inplace=True)
    return df
