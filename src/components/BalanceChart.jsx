// src/components/BalanceChart.jsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { FaChartLine, FaChevronDown } from "react-icons/fa";
import axiosInstance from "./axiosInstance";

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "Last 7d", value: "7d" },
  { label: "Monthly", value: "monthly" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PAGE_SIZE = 50; // fetch 50 trades per request when loading history (adjustable)

export default function BalanceChart() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const YEARS = Array.from({ length: 6 }).map((_, i) => currentYear - i); // current year and last 5 years

  const [period, setPeriod] = useState("7d");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [metrics, setMetrics] = useState({
    period: "all",
    total_trades: 0,
    total_wins: 0,
    total_losses: 0,
    winrate_percent: 0,
    money_made: 0,
    accumulated_r: 0,
    inTrade: false,
  });

  const [trades, setTrades] = useState([]); // full fetched trades (all pages)
  const [chartData, setChartData] = useState([]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Normalize a trade date into current year (keeps month/day/time but forces current year)
  const normalizeDateToCurrentYear = (dateString) => {
    if (!dateString) return null;
    const tradeDate = new Date(dateString);
    if (isNaN(tradeDate.getTime())) return dateString; // fallback
    const now = new Date();
    const normalized = new Date(
      now.getFullYear(),
      tradeDate.getMonth(),
      tradeDate.getDate(),
      tradeDate.getHours(),
      tradeDate.getMinutes(),
      tradeDate.getSeconds()
    );
    return normalized.toISOString();
  };

  // Helper to extract trades array from different response shapes
  const extractTradesArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.trades)) return data.trades;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    // fallback: find first array value
    const firstArray = Object.values(data).find((v) => Array.isArray(v));
    return firstArray || [];
  };

  // Build profit for a trade (robust to missing fields)
  const calcProfit = (trade) => {
    const price = Number(trade.price ?? trade.entry_price ?? 0);
    const qty = Number(trade.quantity ?? trade.qty ?? 0);
    const take = Number(trade.take_profit ?? trade.tp ?? 0);
    const stop = Number(trade.stop_loss ?? trade.sl ?? 0);
    const side = (trade.side || "").toString().toUpperCase();
    const status = (trade.status || trade.result || "")
      .toString()
      .toLowerCase();

    let profit = 0;
    if (side === "BUY") {
      if (status === "win") {
        profit = (take || price) - price;
      } else {
        profit = (stop || price) - price;
      }
    } else if (side === "SELL") {
      if (status === "win") {
        profit = price - (take || price);
      } else {
        profit = price - (stop || price);
      }
    } else {
      profit = Number(trade.profit ?? 0);
    }

    return profit * qty;
  };

  // Fetch metrics and full history (paginated)
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setLoadingHistory(true);
      try {
        // 1) fetch metrics
        const metricsRes = await axiosInstance.get("/api/v1/trades/metrics/");
        const metricsData = metricsRes?.data ?? {};
        if (!mounted) return;
        const safeNum = (v) =>
          v === undefined || v === null || Number.isNaN(Number(v))
            ? 0
            : Number(v);
        setMetrics({
          period: metricsData.period ?? "all",
          total_trades: safeNum(metricsData.total_trades),
          total_wins: safeNum(metricsData.total_wins),
          total_losses: safeNum(metricsData.total_losses),
          accumulated_r: safeNum(metricsData.accumulated_r),
          money_made: Number(metricsData.money_made ?? 0),
          winrate_percent: Number(metricsData.winrate_percent ?? 0),
          inTrade: Boolean(metricsData.inTrade),
          _raw: metricsData,
        });

        // 2) fetch paginated history until done
        const allTrades = [];
        let page = 1;
        const pageSize = PAGE_SIZE;
        const totalFromMetrics = metricsData?.total_trades
          ? Number(metricsData.total_trades)
          : null;
        const totalPages =
          totalFromMetrics && totalFromMetrics > 0
            ? Math.ceil(totalFromMetrics / pageSize)
            : null;

        while (true) {
          const res = await axiosInstance.get("/api/v1/trades/history", {
            params: { page, page_size: pageSize },
          });
          const data = res?.data ?? {};
          if (!mounted) return;

          const pageTrades = extractTradesArray(data);
          if (!pageTrades || pageTrades.length === 0) break;

          allTrades.push(...pageTrades);

          if (totalPages) {
            if (page >= totalPages) break;
          } else {
            if (pageTrades.length < pageSize) break;
          }

          page += 1;
        }

        // Process and normalize trades
        const processed = allTrades.map((trade) => {
          const profit = calcProfit(trade);
          const timestamp = normalizeDateToCurrentYear(
            trade.created_at ?? trade.timestamp ?? trade.date
          );
          const tradeValue =
            Number(trade.price ?? 0) * Number(trade.quantity ?? 0);
          return {
            ...trade,
            profit,
            timestamp,
            tradeValue,
          };
        });

        // sort by timestamp ascending
        processed.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (mounted) {
          setTrades(processed);
        }
      } catch (err) {
        console.error("Failed to fetch metrics or history:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingHistory(false);
        }
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  // Build chart data (monthly now renders days of selected month)
  useEffect(() => {
    if (!trades || trades.length === 0) {
      setChartData([]);
      return;
    }

    const now = new Date();
    const buckets = {};

    if (period === "monthly") {
      // Build daily buckets for the selected month/year only
      const year = Number(selectedYear);
      const month = Number(selectedMonth); // 0-based
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // initialize each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        buckets[key] = 0;
      }

      // Aggregate trades that fall into that month/year
      trades.forEach((t) => {
        const d = new Date(t.timestamp);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const key = d.toISOString().slice(0, 10);
          if (buckets[key] !== undefined) {
            buckets[key] += Number(t.profit || 0);
          }
        }
      });

      // Map to chart data (day labels)
      const monthData = Object.entries(buckets).map(([date, profit]) => {
        const d = new Date(date);
        return {
          label: d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }), // e.g. "Aug 05"
          profit: Math.round(profit * 100) / 100,
          fullDate: date,
        };
      });

      setChartData(monthData);
    } else {
      // period is "today" or "7d" etc. Interpret "today" as 1 day, "7d" as 7 days
      const days =
        period === "today" ? 1 : Number(period.replace("d", "")) || 7;

      // initialize last `days` buckets (oldest -> newest)
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets[key] = 0;
      }

      trades.forEach((t) => {
        const dKey = new Date(t.timestamp).toISOString().slice(0, 10);
        if (buckets.hasOwnProperty(dKey)) {
          buckets[dKey] += Number(t.profit || 0);
        }
      });

      const dailyData = Object.entries(buckets).map(([date, profit]) => ({
        label: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        profit: Math.round(profit * 100) / 100,
        fullDate: date,
      }));
      setChartData(dailyData);
    }
  }, [trades, period, selectedYear, selectedMonth]);

  // Tooltip for the chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const profitVal = Number(payload[0].value ?? 0);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-800">
            {d.fullDate || d.fullMonth}
          </p>
          <p
            className={`${profitVal >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            Profit: ${profitVal.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading trade metrics & history...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <FaChartLine className="text-blue-600" /> Balance & P/L
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your trading performance over time
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPeriod(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === o.value
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {period === "monthly" && (
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {MONTHS[selectedMonth]} <FaChevronDown className="text-xs" />
                </button>
                {showMonthDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(index);
                          setShowMonthDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          selectedMonth === index
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {selectedYear} <FaChevronDown className="text-xs" />
                </button>
                {showYearDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                    {YEARS.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          selectedYear === year
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#f0f0f0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#profitGradient)"
              activeDot={{ r: 6, fill: "#2563EB" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* All-time stats (server metrics) */}
      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-2">All time stats</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Trades" value={metrics.total_trades} />
          <StatCard
            label="Wins"
            value={metrics.total_wins}
            valueClass="text-green-600"
          />
          <StatCard
            label="Losses"
            value={metrics.total_losses}
            valueClass="text-red-600"
          />
          <StatCard
            label="Win Rate"
            value={`${Number(metrics.winrate_percent ?? 0).toFixed(1)}%`}
            valueClass="text-blue-600"
          />
          <StatCard
            label="Money Made"
            value={Number(metrics.money_made ?? 0).toFixed(2)}
            valueClass="text-green-600"
          />
          <StatCard
            label="Accumulated R"
            value={Number(metrics.accumulated_r ?? 0).toFixed(2)}
            valueClass="text-purple-600"
          />
          <StatCard
            label="In Trade"
            value={metrics.inTrade ? "Yes" : "No"}
            valueClass={metrics.inTrade ? "text-green-600" : "text-gray-600"}
          />
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, valueClass = "text-gray-800" }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="text-xs text-gray-500 font-medium">{label}</div>
    <div className={`mt-1 text-lg font-bold ${valueClass}`}>{value}</div>
  </div>
);
