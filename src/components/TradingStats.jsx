// src/components/TradingStats.jsx
import React from "react";

const TradingStats = ({ orders }) => {
  const totalOrders = orders.length;
  const buyOrders = orders.filter(
    (order) => order.side?.toLowerCase() === "buy"
  ).length;
  const sellOrders = orders.filter(
    (order) => order.side?.toLowerCase() === "sell"
  ).length;

  const winOrders = orders.filter((order) => order.status === "win").length;
  const lossOrders = orders.filter((order) => order.status === "loss").length;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Trading Statistics</h2>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Buy Orders</p>
          <p className="text-2xl font-bold text-green-700">{buyOrders}</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Sell Orders</p>
          <p className="text-2xl font-bold text-red-700">{sellOrders}</p>
        </div>

        <div className="bg-green-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Wins</p>
          <p className="text-2xl font-bold text-green-700">{winOrders}</p>
        </div>

        <div className="bg-red-50 p-3 rounded-md">
          <p className="text-sm text-gray-500">Losses</p>
          <p className="text-2xl font-bold text-red-700">{lossOrders}</p>
        </div>
      </div>
    </div>
  );
};

export default TradingStats;
