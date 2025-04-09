// src/App.tsx
import { useState, useEffect } from 'react';
import './App.css';

interface TickerData {
  daysAbove: number;
  weeksAbove: number;
  error?: string;
}

function App() {
  const [tickersData, setTickersData] = useState<Record<string, TickerData>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const initialTickers: string[] = [
    'SPX', 'DJI', 'NDX', 'IWM', 'DAX', 'ESX50', 'URTH', 'DBC', 'Bitcoin', 'Ethereum', 'DJT', 'GSCI',
    'FTSE', 'NIKKEI', 'SSEC', 'HSI', 'VIX', 'GLD', 'SLV', 'USO', 'TLT', 'DXY', 'EURUSD=X', 'JPY=X',
    'AAPL', 'MSFT', 'XOM', 'JPM', 'WMT', 'GDX', 'XLF'
  ];
  const [tickers, setTickers] = useState<string[]>(initialTickers);

  useEffect(() => {
    fetchAllTickers();
  }, []);

  const fetchAllTickers = async () => {
    setLoading(true);
    setError(null);
    try {
      const results: Record<string, TickerData> = {};
      for (const ticker of tickers) {
        try {
          const response = await fetch(`${API_URL}/api/ticker/${ticker}`);
          const data: TickerData = await response.json();
          if (!data.error) {
            results[ticker] = data;
          }
        } catch (err) {
          console.error(`Fetch error for ${ticker}:`, err);
        }
      }
      setTickersData(results);
      if (Object.keys(results).length === 0) {
        setError('No valid data received for any ticker');
      }
    } catch (err) {
      const error = err as Error;
      setError('Failed to fetch data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addTicker = async () => {
    if (!searchInput.trim()) return;
    const newTicker = searchInput.trim().toUpperCase();
    
    if (tickers.includes(newTicker)) {
      setError('Ticker already in list');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/ticker/${newTicker}`);
      if (!response.ok) throw new Error(`HTTP error for ${newTicker}: ${response.status}`);
      const data: TickerData = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTickersData(prev => ({ ...prev, [newTicker]: data }));
        setTickers(prev => [...prev, newTicker]);
        setSearchInput('');
      }
    } catch (err) {
      const error = err as Error;
      setError('Failed to add ticker: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTicker();
    }
  };

  return (
    <div className="center-wrapper">
      <div className="app">
        <h1>Market Ticker Dashboard</h1>

        <div className="controls">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add ticker (e.g., GME)"
            disabled={loading}
          />
          <button onClick={addTicker} disabled={loading}>
            Add
          </button>
          <button onClick={fetchAllTickers} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh All'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {loading && <p>Loading tickers...</p>}

        {!loading && Object.keys(tickersData).length > 0 && (
          <div className="table-container">
            <table className="ticker-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Days Above/Below 21-Day SMA (Daily)</th>
                  <th>Weeks Above/Below 21-Week SMA (Weekly)</th>
                </tr>
              </thead>
              <tbody>
                {tickers.map((ticker) => {
                  const data = tickersData[ticker];
                  if (!data) return null;
                  return (
                    <tr key={ticker}>
                      <td>{ticker}</td>
                      <td className={data.daysAbove > 0 ? 'positive' : data.daysAbove < 0 ? 'negative' : 'neutral'}>
                        {data.daysAbove}
                      </td>
                      <td className={data.weeksAbove > 0 ? 'positive' : data.weeksAbove < 0 ? 'negative' : 'neutral'}>
                        {data.weeksAbove}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && Object.keys(tickersData).length === 0 && !error && (
          <p>No data available. Click "Refresh All" to load tickers.</p>
        )}
      </div>
    </div>
  );
}

export default App;