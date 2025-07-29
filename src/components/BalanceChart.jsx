// BalanceChart.jsx
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

export default function BalanceChart() {
  const [period, setPeriod] = useState("7d");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [metrics, setMetrics] = useState({
    total_trades: 0,
    total_wins: 0,
    total_losses: 0,
    winrate_percent: 0,
    money_made: 0,
    accumulated_r: 0,
    inTrade: false,
  });
  const [trades, setTrades] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to normalize dates to current year
  const normalizeDateToCurrentYear = (dateString) => {
    const now = new Date();
    const tradeDate = new Date(dateString);

    return new Date(
      now.getFullYear(), // Use current year
      tradeDate.getMonth(),
      tradeDate.getDate(),
      tradeDate.getHours(),
      tradeDate.getMinutes(),
      tradeDate.getSeconds()
    ).toISOString();
  };

  // Fetch trade data from API
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://46.101.129.205/api/v1/trades/history"
        );
        const data = await response.json();

        if (data.trades && data.trades.length > 0) {
          // Transform trades and calculate profit
          const processedTrades = data.trades.map((trade) => {
            const tradeValue = trade.price * trade.quantity;
            let profit;

            if (trade.side === "BUY") {
              profit =
                trade.status === "win"
                  ? (trade.take_profit - trade.price) * trade.quantity
                  : (trade.stop_loss - trade.price) * trade.quantity;
            } else {
              // SELL
              profit =
                trade.status === "win"
                  ? (trade.price - trade.take_profit) * trade.quantity
                  : (trade.price - trade.stop_loss) * trade.quantity;
            }

            return {
              ...trade,
              profit,
              timestamp: normalizeDateToCurrentYear(trade.created_at),
              tradeValue,
            };
          });

          setTrades(processedTrades);
        } else {
          console.log("No trades found in API response");
        }
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Calculate metrics from trades
  useEffect(() => {
    if (trades.length === 0) return;

    const total_trades = trades.length;
    const total_wins = trades.filter((t) => t.status === "win").length;
    const total_losses = total_trades - total_wins;
    const winrate_percent =
      total_trades > 0 ? (total_wins / total_trades) * 100 : 0;
    const money_made = trades.reduce((sum, trade) => sum + trade.profit, 0);

    // Calculate accumulated R (risk-reward ratio)
    let accumulated_r = 0;
    trades.forEach((trade) => {
      const risk = Math.abs(trade.price - trade.stop_loss) * trade.quantity;
      if (risk > 0) {
        accumulated_r += trade.profit / risk;
      }
    });

    setMetrics({
      total_trades,
      total_wins,
      total_losses,
      winrate_percent,
      money_made,
      accumulated_r,
      inTrade: false, // Not provided in API, set to false
    });
  }, [trades]);

  // Build chart data based on selected period
  useEffect(() => {
    if (trades.length === 0) return;

    const now = new Date();
    let buckets = {};

    if (period === "monthly") {
      // Monthly data for selected year
      const filteredTrades = trades.filter((trade) => {
        const d = new Date(trade.timestamp);
        return d.getFullYear() === selectedYear;
      });

      filteredTrades.forEach((t) => {
        const d = new Date(t.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        buckets[key] = (buckets[key] || 0) + t.profit;
      });

      // Fill in all months for the year
      const yearData = [];
      for (let month = 0; month < 12; month++) {
        const key = `${selectedYear}-${String(month + 1).padStart(2, "0")}`;
        yearData.push({
          label: MONTHS[month].substring(0, 3),
          profit: buckets[key] || 0,
          fullMonth: MONTHS[month],
        });
      }
      setChartData(yearData);
    } else {
      // Daily data
      const days = period === "today" ? 1 : parseInt(period, 10);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }

      trades.forEach((t) => {
        const dateKey = new Date(t.timestamp).toISOString().slice(0, 10);
        if (buckets[dateKey] !== undefined) {
          buckets[dateKey] += t.profit;
        }
      });

      setChartData(
        Object.entries(buckets).map(([date, profit]) => ({
          label: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          profit: Math.round(profit * 100) / 100,
          fullDate: date,
        }))
      );
    }
  }, [trades, period, selectedYear]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-800">
            {period === "monthly" ? data.fullMonth : data.fullDate}
          </p>
          <p
            className={`${
              payload[0].value >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            Profit: ${payload[0].value.toFixed(2)}
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
        <p className="mt-4 text-gray-600">Loading trade data...</p>
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
                  <div className="absolute top-full left-0 mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
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

      {/* Summary cards */}
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
          value={`${metrics.winrate_percent.toFixed(1)}%`}
          valueClass="text-blue-600"
        />
        <StatCard
          label="Money Made"
          value={`$${metrics.money_made.toFixed(2)}`}
          valueClass="text-green-600"
        />
        <StatCard
          label="Accumulated R"
          value={metrics.accumulated_r.toFixed(2)}
          valueClass="text-purple-600"
        />
        <StatCard
          label="In Trade"
          value={metrics.inTrade ? "Yes" : "No"}
          valueClass={metrics.inTrade ? "text-green-600" : "text-gray-600"}
        />
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
