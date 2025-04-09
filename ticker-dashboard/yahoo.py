# yahoo.py
from flask import Flask, jsonify
import yfinance as yf
from flask_cors import CORS
import logging

app = Flask(__name__)

# Set up logging to debug issues
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Enable CORS for all routes, specifically allowing localhost:5173
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

TICKERS = {
    "SPX": "^GSPC",
    "DJI": "^DJI",
    "NDX": "^NDX",
    "IWM": "IWM",
    "DAX": "^GDAXI",
    "ESX50": "^STOXX50E",
    "URTH": "URTH",
    "DBC": "DBC",
    "Bitcoin": "BTC-USD",
    "Ethereum": "ETH-USD",
    "DJT": "DJT",
    "GSCI": "^SPGSCI"
}

def fetch_ticker_data(ticker):
    try:
        logger.debug(f"Fetching data for ticker: {ticker}")
        asset = yf.Ticker(ticker)
        
        # Daily data for 21-day MA
        hist_daily = asset.history(period="1mo", interval="1d")
        if hist_daily.empty or len(hist_daily) < 21:
            logger.warning(f"Not enough daily data for {ticker}: {len(hist_daily)} days")
            return {"error": "Not enough daily data"}
        
        current_price = hist_daily['Close'].iloc[-1]
        ma_21_day = hist_daily['Close'][-21:].mean()
        days_count = 0
        is_above_day = current_price > ma_21_day
        for price in hist_daily['Close'].iloc[-2::-1]:
            if (is_above_day and price <= ma_21_day) or (not is_above_day and price >= ma_21_day):
                break
            days_count += 1
        days_above = (days_count + 1) if is_above_day else -(days_count + 1)

        # Weekly data for 21-week MA
        hist_weekly = asset.history(period="6mo", interval="1wk")
        if hist_weekly.empty or len(hist_weekly) < 21:
            logger.warning(f"Not enough weekly data for {ticker}: {len(hist_weekly)} weeks")
            return {"error": "Not enough weekly data"}
        
        current_price_weekly = hist_weekly['Close'].iloc[-1]
        ma_21_week = hist_weekly['Close'][-21:].mean()
        weeks_count = 0
        is_above_week = current_price_weekly > ma_21_week
        for price in hist_weekly['Close'].iloc[-2::-1]:
            if (is_above_week and price <= ma_21_week) or (not is_above_week and price >= ma_21_week):
                break
            weeks_count += 1
        weeks_above = (weeks_count + 1) if is_above_week else -(weeks_count + 1)

        return {
            "daysAbove": days_above,
            "weeksAbove": weeks_above
        }
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {str(e)}", exc_info=True)
        return {"error": f"Server error: {str(e)}"}

@app.route('/api/ticker/<ticker_name>', methods=['GET'])
def get_ticker_data(ticker_name):
    logger.debug(f"Received request for ticker: {ticker_name}")
    ticker_symbol = TICKERS.get(ticker_name, ticker_name)
    data = fetch_ticker_data(ticker_symbol)
    return jsonify(data)

@app.route('/test', methods=['GET'])
def test_endpoint():
    logger.debug("Test endpoint accessed")
    return jsonify({"message": "Backend is running"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=3000)