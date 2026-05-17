import os
from datetime import datetime

SYMBOL   = "WLD/USDT"
BTC_SYMBOL = "BTC/USDT"
EXCHANGE = "binance"

TIMEFRAMES = ["1m", "5m", "15m", "1h", "1d"]

CANDLE_LIMIT = 150

RSI_PERIOD        = 6
RSI_SMOOTH_PERIOD = 10

MACD_FAST   = 12
MACD_SLOW   = 26
MACD_SIGNAL = 9

STOCHRSI_RSI_PERIOD   = 14
STOCHRSI_STOCH_PERIOD = 14
STOCHRSI_K = 3
STOCHRSI_D = 3

HMA_PERIOD      = 55
DONCHIAN_PERIOD = 20

UT_ATR_PERIOD = 10
UT_KEY1 = 1.0
UT_KEY2 = 2.0

_desktop  = os.path.join(os.path.expanduser("~"), "Desktop")
_tarih    = datetime.now().strftime("%Y_%m")
EXCEL_FILE = os.path.join(_desktop, f"WLD_USDT_Trade_Journal_{_tarih}.xlsx")
