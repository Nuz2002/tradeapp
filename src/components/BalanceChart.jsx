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
  "January","February","March","April","May","June","July","August",
  "September","October","November","December",
];

export default function BalanceChart() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const YEARS = Array.from({ length: 6 }).map((_, i) => currentYear - i);

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
    _raw: {},
  });

  const [balanceHistory, setBalanceHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  const parseNumber = (v) => {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v;
    const s = String(v).replace(/[,\s\r\n]+/g, "").trim();
    const n = Number(s);
    if (!Number.isFinite(n)) {
      const f = parseFloat(s);
      return Number.isFinite(f) ? f : 0;
    }
    return n;
  };

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const metricsUrl = "/api/v1/trades/metrics/";
        const metricsParams = {};
        if (period === "today") metricsParams.period = "1d";
        if (period === "7d") metricsParams.period = "7d";
        if (period === "monthly") metricsParams.period = "monthly";

        const [metricsRes, balanceRes] = await Promise.all([
          axiosInstance.get(metricsUrl, { params: metricsParams }).catch(() => ({ data: {} })),
          axiosInstance.get("/api/v1/trades/balance-history/").catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const metricsData = metricsRes?.data ?? {};
        setMetrics({
          period: metricsData.period ?? "all",
          total_trades: parseNumber(metricsData.total_trades ?? metricsData.count ?? 0),
          total_wins: parseNumber(metricsData.total_wins ?? metricsData.wins ?? 0),
          total_losses: parseNumber(metricsData.total_losses ?? metricsData.losses ?? 0),
          accumulated_r: parseNumber(metricsData.accumulated_r ?? metricsData.accumulatedR ?? 0),
          money_made: parseNumber(metricsData.money_made ?? metricsData.money ?? metricsData.profit_total ?? 0),
          winrate_percent: parseNumber(metricsData.winrate_percent ?? metricsData.win_rate ?? metricsData.winrate ?? 0),
          inTrade: Boolean(metricsData.inTrade || metricsData.in_trade || metricsData.active_trade),
          _raw: metricsData,
        });

        const rawBalances = Array.isArray(balanceRes.data) ? balanceRes.data : [];
        const processedBalances = rawBalances
          .map((e) => {
            const ts = e.created_at || e.timestamp || e.date;
            return {
              raw: e,
              timestamp: ts,
              dateObj: ts ? new Date(ts) : null,
              balance: parseNumber(e.balance ?? e.balance_usd ?? e.value ?? 0),
            };
          })
          .filter((p) => p.dateObj && !isNaN(p.dateObj.getTime()))
          .sort((a, b) => a.dateObj - b.dateObj);

        setBalanceHistory(processedBalances);
      } catch (err) {
        console.error("[BalanceChart] Failed to fetch metrics or balance-history:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, [period, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!balanceHistory || balanceHistory.length === 0) {
      setChartData([]);
      return;
    }

    const formatHourLabel = (d) =>
      new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

    const formatDayLabel = (d) =>
      new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

    const toDayStart = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const toDayKey = (d) => toDayStart(d).toISOString().slice(0,10);
    const toHourKey = (d) => {
      const x = new Date(d);
      x.setMinutes(0,0,0);
      x.setSeconds(0,0);
      return x.toISOString();
    };

    const dataPoints = [];
    const nowLocal = new Date();

    if (period === "today") {
      const start = new Date(nowLocal);
      start.setHours(0,0,0,0);

      let lastKnown = null;
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(start.getTime() + h * 3600 * 1000);
        const hourEnd = new Date(start.getTime() + (h + 1) * 3600 * 1000 - 1);

        const entriesUpToHour = balanceHistory.filter((b) => b.dateObj <= hourEnd);
        if (entriesUpToHour.length) {
          lastKnown = entriesUpToHour[entriesUpToHour.length - 1].balance;
        }

        const isFuture = hourStart > nowLocal;
        dataPoints.push({
          key: toHourKey(hourStart),
          dateObj: hourStart,
          label: formatHourLabel(hourStart),
          balance: !isFuture && lastKnown !== null ? Number(lastKnown) : null,
        });
      }

      const firstKnownIndex = dataPoints.findIndex(p => p.balance !== null);
      if (firstKnownIndex > 0) {
        const firstVal = dataPoints[firstKnownIndex].balance ?? 0;
        for (let i = 0; i < firstKnownIndex; i++) dataPoints[i].balance = firstVal;
      }
    } else {
      let days = [];
      if (period === "7d") {
        const todayStart = toDayStart(new Date());
        for (let i = 6; i >= 0; i--) days.push(new Date(todayStart.getTime() - i * 24 * 3600 * 1000));
      } else if (period === "monthly") {
        const year = Number(selectedYear);
        const month = Number(selectedMonth);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const isCurrentMonth = year === currentYear && month === currentMonth;
        const lastDay = isCurrentMonth ? Math.min(currentDate, daysInMonth) : daysInMonth;
        const selectedIsFuture = year > currentYear || (year === currentYear && month > currentMonth);
        if (!selectedIsFuture) {
          for (let day = 1; day <= lastDay; day++) days.push(new Date(year, month, day));
        }
      }

      let lastKnown = null;
      days.forEach((d) => {
        const dayEnd = new Date(d);
        dayEnd.setHours(23,59,59,999);
        const entriesUpToDay = balanceHistory.filter((b) => b.dateObj <= dayEnd);
        if (entriesUpToDay.length) lastKnown = entriesUpToDay[entriesUpToDay.length - 1].balance;
        dataPoints.push({
          key: toDayKey(d),
          dateObj: toDayStart(d),
          label: formatDayLabel(d),
          balance: lastKnown !== null ? Number(lastKnown) : null,
        });
      });

      const firstKnownIndex = dataPoints.findIndex(p => p.balance !== null);
      if (firstKnownIndex > 0) {
        const firstVal = dataPoints[firstKnownIndex].balance ?? 0;
        for (let i = 0; i < firstKnownIndex; i++) dataPoints[i].balance = firstVal;
      }
    }

    const hasAnyValue = dataPoints.some((p) => p.balance !== null && p.balance !== undefined);
    const filled = hasAnyValue
      ? dataPoints.map(p => ({ ...p, balance: p.balance === null ? null : Number(Number(p.balance).toFixed(2)) }))
      : [];

    const withDelta = filled.map((p, i) => {
      let prevIndex = -1;
      for (let j = i - 1; j >= 0; j--) if (filled[j].balance !== null && filled[j].balance !== undefined) { prevIndex = j; break; }
      const prevVal = prevIndex >= 0 ? filled[prevIndex].balance : null;
      const delta = (prevVal !== null && p.balance !== null && prevVal !== undefined && p.balance !== undefined) ? Number((p.balance - prevVal)) : 0;
      return { ...p, delta };
    });

    setChartData(withDelta);
  }, [balanceHistory, period, selectedMonth, selectedYear]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const balanceVal = d.balance !== null && d.balance !== undefined ? Number(d.balance) : null;
      const deltaVal = Number(d.delta ?? 0);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-800">
            {d.dateObj ? d.dateObj.toLocaleString() : d.label}
          </p>
          {balanceVal !== null ? (
            <>
              <p className="text-gray-700">Balance: <span className="font-medium">${balanceVal.toFixed(2)}</span></p>
              <p className={`${deltaVal >= 0 ? "text-green-600" : "text-red-600"}`}>
                Change: {deltaVal >= 0 ? "+" : ""}${Math.abs(deltaVal).toFixed(2)}
              </p>
            </>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Y axis rounding & padding helper: if min===max add small padding
  const yDomainMin = (dataMin, dataMax) => {
    if (dataMin === undefined || dataMin === null || isNaN(dataMin)) return 0;
    if (dataMax !== undefined && Math.abs(dataMax - dataMin) < 1e-9) {
      const pad = Math.max(1, Math.abs(dataMin) * 0.01);
      return Math.floor((dataMin - pad) * 100) / 100;
    }
    return Math.floor(dataMin * 100) / 100;
  };
  const yDomainMax = (dataMax, dataMin) => {
    if (dataMax === undefined || dataMax === null || isNaN(dataMax)) return 0;
    if (dataMin !== undefined && Math.abs(dataMax - dataMin) < 1e-9) {
      const pad = Math.max(1, Math.abs(dataMax) * 0.01);
      return Math.ceil((dataMax + pad) * 100) / 100;
    }
    return Math.ceil(dataMax * 100) / 100;
  };

  // simple tick interval to avoid overlap
  const xTickInterval = chartData && chartData.length > 7 ? Math.ceil(chartData.length / 7) - 1 : 0;

  // Determine whether we actually have points to draw
  const hasChartPoints = chartData && chartData.some((p) => p.balance !== null && p.balance !== undefined);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading balance history & metrics...</p>
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
          <p className="text-sm text-gray-500 mt-1">Track your account balance over time (balance-history)</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPeriod(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === o.value ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {period === "monthly" && (
            <div className="flex gap-2">
              <div className="relative">
                <button onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {MONTHS[selectedMonth]} <FaChevronDown className="text-xs" />
                </button>
                {showMonthDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                    {MONTHS.map((month, index) => (
                      <button key={month} onClick={() => { setSelectedMonth(index); setShowMonthDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedMonth === index ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}>
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {selectedYear} <FaChevronDown className="text-xs" />
                </button>
                {showYearDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                    {YEARS.map((year) => (
                      <button key={year} onClick={() => { setSelectedYear(year); setShowYearDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedYear === year ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}>
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
        { !hasChartPoints ? (
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-white/60">
            <div className="text-center px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-3">
                <FaChartLine />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">No balance history</h3>
              <p className="text-sm text-gray-600 mt-2">
                {period === "monthly"
                  ? `No balance history available for ${MONTHS[selectedMonth]} ${selectedYear}.`
                  : "No balance points available for the selected range."}
              </p>

              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => setPeriod("7d")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm shadow-sm hover:opacity-95"
                >
                  View last 7 days
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-3">Tip: choose a different month/year if you think data exists for another period.</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.08} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} interval={xTickInterval} minTickGap={8} />
              <YAxis tickFormatter={(v) => `$${Number(v).toFixed(2)}`} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[yDomainMin, yDomainMax]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} fill="url(#balanceGradient)" activeDot={{ r: 6, fill: "#2563EB" }} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-2">All time stats</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Trades" value={metrics.total_trades} />
          <StatCard label="Wins" value={metrics.total_wins} valueClass="text-green-600" />
          <StatCard label="Losses" value={metrics.total_losses} valueClass="text-red-600" />
          <StatCard label="Win Rate" value={`${Number(metrics.winrate_percent ?? 0).toFixed(1)}%`} valueClass="text-blue-600" />
          <StatCard label="Money Made" value={Number(metrics.money_made ?? 0).toFixed(2)} valueClass={Number(metrics.money_made ?? 0) < 0 ? "text-red-600" : "text-green-600"} />
          <StatCard label="Accumulated R" value={Number(metrics.accumulated_r ?? 0).toFixed(2)} valueClass="text-purple-600" />
          <StatCard label="In Trade" value={metrics.inTrade ? "Yes" : "No"} valueClass={metrics.inTrade ? "text-green-600" : "text-gray-600"} />
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
