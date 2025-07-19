import React, { useEffect, useState } from 'react';
import { FaBolt } from 'react-icons/fa';

const BYBIT_WS_URL = 'wss://stream.bybit.com/v5/public/spot';

const BybitLiveFeed = () => {
  const [trades, setTrades] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(BYBIT_WS_URL);

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: ['publicTrade.BTCUSDT'] // You can change the symbol/channel later
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.topic && data.topic.startsWith('publicTrade')) {
        setTrades(prev => [
          ...data.data,
          ...prev
        ].slice(0, 20)); // Keep only the latest 20 trades
      }
    };

    ws.onerror = (err) => {
      setConnected(false);
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => ws.close();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-4">
        <FaBolt className="text-gray-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-800">Bybit Live Trades (BTCUSDT)</h2>
      </div>
      <div className="mb-2 text-xs text-gray-500">
        WebSocket status: <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ml-1
          ${connected ? 'bg-gray-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6">
        <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {trades.length === 0 && <li className="py-8 text-center text-gray-400">No trades yet. Waiting for live data…</li>}
          {trades.map((trade, idx) => (
            <li key={trade.T + idx} className="py-2 flex justify-between items-center hover:bg-gray-50 transition rounded">
              <span className={`font-semibold text-xs ${trade.S === 'Buy' ? 'text-blue-700' : 'text-red-500'}`}>{trade.S}</span>
              <span className="mx-2 text-sm">{trade.v} @ <span className="font-mono">{trade.p}</span></span>
              <span className="text-xs text-gray-400">{new Date(trade.T).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BybitLiveFeed; 