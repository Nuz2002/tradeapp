// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import TradingStats from './TradingStats';

const Dashboard = () => {
  // In a real app, you'd fetch this from your backend
  const [orders, setOrders] = useState([
    {
      "category": "linear",
      "symbol": "BTCUSDT",
      "side": "Sell",
      "orderType": "Limit",
      "qty": 0.01,
      "price": 63000,
      "reduceOnly": false,
      "closeOnTrigger": false,
      "takeProfit": 64000,
      "stopLoss": 62000
    },
    {
      "category": "linear",
      "symbol": "ETHUSDT",
      "side": "Buy",
      "orderType": "Limit",
      "qty": 0.15,
      "price": 3200,
      "reduceOnly": true,
      "closeOnTrigger": true,
      "takeProfit": 3500,
      "stopLoss": 3000
    },
    {
      "category": "linear",
      "symbol": "BTCUSDT",
      "side": "Buy",
      "orderType": "Market",
      "qty": 0.02,
      "price": 62500,
      "reduceOnly": false,
      "closeOnTrigger": false,
      "takeProfit": 65000,
      "stopLoss": 60000
    }
  ]);

  // Filter states
  const [filterSymbol, setFilterSymbol] = useState('All');
  const [filterSide, setFilterSide] = useState('All');
  
  // Get unique symbols for filter dropdown
  const symbols = ['All', ...new Set(orders.map(order => order.symbol))];
  
  // Apply filters
  const filteredOrders = orders.filter(order => {
    const matchesSymbol = filterSymbol === 'All' || order.symbol === filterSymbol;
    const matchesSide = filterSide === 'All' || order.side === filterSide;
    return matchesSymbol && matchesSide;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <TradingStats orders={orders} />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Orders</h2>
          
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Symbol</label>
              <select 
                className="border rounded px-3 py-1"
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
              >
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Side</label>
              <select 
                className="border rounded px-3 py-1"
                value={filterSide}
                onChange={(e) => setFilterSide(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order, index) => (
            <OrderCard key={index} order={order} />
          ))}
        </div> */}
        
        {/* {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No orders match your filter criteria
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Dashboard;
