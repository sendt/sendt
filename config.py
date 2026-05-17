SYMBOL = "WLD/USDT"
EXCHANGE = "binance"

TIMEFRAMES = ["1m", "5m", "15m", "1h"]

CANDLE_LIMIT = 300

# RSI — TradingView ayarları: period 6, kaynak OHLC4, EMA smooth 10
RSI_PERIOD = 6
RSI_SMOOTH_PERIOD = 10   # EMA smoothing

MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9

STOCHRSI_RSI_PERIOD = 14
STOCHRSI_STOCH_PERIOD = 14
STOCHRSI_K = 3
STOCHRSI_D = 3

HMA_PERIOD = 55

DONCHIAN_PERIOD = 20

# UT Bot — iki ayrı sensitivity
UT_ATR_PERIOD = 10
UT_KEY1 = 1.0   # düşük hassasiyet
UT_KEY2 = 2.0   # yüksek hassasiyet

import os
from datetime import datetime

_desktop = os.path.join(os.path.expanduser("~"), "Desktop")
_tarih   = datetime.now().strftime("%Y_%m")          # örn: 2026_05
EXCEL_FILE = os.path.join(_desktop, f"degerler_{_tarih}.xlsx")
