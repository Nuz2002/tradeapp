// src/components/TradingStats.jsx
import React from "react";

const TradingStats = ({ orders = [], totals = null }) => {
  // computed values from the current page (fallbacks)
  const computedTotal = Array.isArray(orders) ? orders.length : 0;
  const computedBuy = orders.filter((o) => (o.side || "").toString().toLowerCase() === "buy").length;
  const computedSell = orders.filter((o) => (o.side || "").toString().toLowerCase() === "sell").length;
  const computedWins = orders.filter(
    (o) =>
      (o.status || "").toString().toLowerCase() === "win" ||
      (o.result || "").toString().toLowerCase() === "win" ||
      o.is_win === true
  ).length;
  const computedLosses = orders.filter(
    (o) =>
      (o.status || "").toString().toLowerCase() === "loss" ||
      (o.result || "").toString().toLowerCase() === "loss" ||
      o.is_loss === true
  ).length;

  // helper to coerce values safely to numbers
  const safeNum = (val, fallback = 0) => {
    if (val === undefined || val === null) return fallback;
    if (typeof val === "number") return Number.isFinite(val) ? val : fallback;
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  // Prefer server-provided totals when available, otherwise fall back to computed values
  const totalOrders = safeNum(
    totals?.total_trades ?? totals?.total ?? totals?.count ?? totals?.totalOrders ?? computedTotal,
    computedTotal
  );

  const buyOrders = safeNum(
    totals?.buy_orders ?? totals?.buys ?? totals?.buy_count ?? totals?.buys_total ?? computedBuy,
    computedBuy
  );

  const sellOrders = safeNum(
    totals?.sell_orders ?? totals?.sells ?? totals?.sell_count ?? totals?.sells_total ?? computedSell,
    computedSell
  );

  const winOrders = safeNum(
    totals?.wins ?? totals?.win_count ?? totals?.wins_count ?? totals?.wins_total ?? computedWins,
    computedWins
  );

  const lossOrders = safeNum(
    totals?.losses ?? totals?.loss_count ?? totals?.losses_count ?? totals?.losses_total ?? computedLosses,
    computedLosses
  );

  // win rate: accept server-provided formats (decimal fraction or percentage), otherwise compute
  const computeWinRateFromTotals = (wr) => {
    if (wr === undefined || wr === null) return null;
    const n = Number(wr);
    if (!Number.isFinite(n)) return null;
    // if value looks like fraction (0..1) convert to percent, otherwise assume percent
    if (n >= 0 && n <= 1) return +(n * 100).toFixed(1);
    return +n.toFixed(1);
  };

  let winRate = null;
  if (totals?.win_rate !== undefined) {
    winRate = computeWinRateFromTotals(totals.win_rate);
  } else if (totals?.win_pct !== undefined) {
    winRate = computeWinRateFromTotals(totals.win_pct);
  } else if (totalOrders > 0) {
    winRate = +((winOrders / totalOrders) * 100).toFixed(1);
  } else {
    winRate = 0;
  }

  // small label to indicate whether numbers are global or page-only
  const usingGlobalTotals = !!(
    totals &&
    (totals.total_trades ?? totals.total ?? totals.count ?? totals.wins ?? totals.losses)
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-semibold mb-2">Trading Statistics</h2>
        <div className="text-sm text-gray-500 mt-1">
          {usingGlobalTotals ? "Showing overall totals" : "Showing current page totals"}
        </div>
      </div>

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

      <div className="mt-4 flex items-center justify-between">

        <div className="text-sm text-gray-500">
          {/* Helpful breakdown if server provided more details */}
          {totals?.avg_profit !== undefined && (
            <div>
              <p className="text-sm text-gray-500">Avg Profit</p>
              <p className="font-medium">{String(totals.avg_profit)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradingStats;
