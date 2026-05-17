SYMBOL = "WLD/USDT"
EXCHANGE = "binance"

TIMEFRAMES = ["1m", "5m", "15m"]

# Kaç mum verisi çekilsin (indikatörler için yeterli geçmiş)
CANDLE_LIMIT = 300

# İndikatör parametreleri
RSI_PERIOD = 14

MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9

STOCHRSI_RSI_PERIOD = 14
STOCHRSI_STOCH_PERIOD = 14
STOCHRSI_K = 3
STOCHRSI_D = 3

HMA_PERIOD = 55          # Hull Suite

DONCHIAN_PERIOD = 20     # Donchian Trend Ribbon

UT_ATR_PERIOD = 1        # UT Bot Alert
UT_ATR_MULT = 2.0        # UT Bot Alert key multiplier

CSV_FILE = "trades.csv"
