// // src/components/BalanceChart.jsx
// import React, { useEffect, useState } from "react";
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";
// import { FaChartLine, FaChevronDown } from "react-icons/fa";
// import axiosInstance from "./axiosInstance";

// const PERIODS = [
//   { label: "Today", value: "today" },
//   { label: "Last 7d", value: "7d" },
//   { label: "Monthly", value: "monthly" },
// ];

// const MONTHS = [
//   "January","February","March","April","May","June","July","August",
//   "September","October","November","December",
// ];

// const PAGE_SIZE = 50;
// const MISMATCH_THRESHOLD = 0.5; // dollars — threshold to trigger adjustment

// export default function BalanceChart() {
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const YEARS = Array.from({ length: 6 }).map((_, i) => currentYear - i);

//   const [period, setPeriod] = useState("7d");
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
//   const [selectedYear, setSelectedYear] = useState(currentYear);

//   const [metrics, setMetrics] = useState({
//     period: "all",
//     total_trades: 0,
//     total_wins: 0,
//     total_losses: 0,
//     winrate_percent: 0,
//     money_made: 0,
//     accumulated_r: 0,
//     inTrade: false,
//     _raw: {},
//   });

//   const [trades, setTrades] = useState([]);
//   const [chartData, setChartData] = useState([]);
//   const [showMonthDropdown, setShowMonthDropdown] = useState(false);
//   const [showYearDropdown, setShowYearDropdown] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [loadingHistory, setLoadingHistory] = useState(true);

//   const parseNumber = (v) => {
//     if (v === undefined || v === null) return 0;
//     if (typeof v === "number") return v;
//     const s = String(v).replace(/[,\s\r\n]+/g, "").trim();
//     const n = Number(s);
//     if (!Number.isFinite(n)) {
//       const f = parseFloat(s);
//       return Number.isFinite(f) ? f : 0;
//     }
//     return n;
//   };

//   const normalizeDateToCurrentYear = (dateString) => {
//     if (!dateString) return null;
//     const tradeDate = new Date(dateString);
//     if (isNaN(tradeDate.getTime())) return dateString;
//     const now = new Date();
//     const normalized = new Date(
//       now.getFullYear(),
//       tradeDate.getMonth(),
//       tradeDate.getDate(),
//       tradeDate.getHours(),
//       tradeDate.getMinutes(),
//       tradeDate.getSeconds(),
//       tradeDate.getMilliseconds()
//     );
//     return normalized.toISOString();
//   };

//   const extractTradesArray = (data) => {
//     if (!data) return [];
//     if (Array.isArray(data)) return data;
//     if (Array.isArray(data.trades)) return data.trades;
//     if (Array.isArray(data.results)) return data.results;
//     if (Array.isArray(data.data)) return data.data;
//     if (Array.isArray(data.items)) return data.items;
//     const firstArray = Object.values(data).find((v) => Array.isArray(v));
//     return firstArray || [];
//   };

//   const calcProfit = (trade) => {
//     const explicitKeys = [
//       "profit","pnl","pl","realized_pnl","realizedPnl","profit_amount",
//       "gain","money_made","profit_usd","pnl_usd",
//     ];
//     for (const k of explicitKeys) {
//       if (trade[k] !== undefined && trade[k] !== null && trade[k] !== "") {
//         const parsed = parseNumber(trade[k]);
//         if (Number.isFinite(parsed)) return parsed;
//       }
//     }

//     const price = parseNumber(trade.price ?? trade.entry_price ?? 0);
//     const qty = parseNumber(trade.quantity ?? trade.qty ?? 0);
//     const take = parseNumber(trade.take_profit ?? trade.tp ?? 0);
//     const stop = parseNumber(trade.stop_loss ?? trade.sl ?? 0);
//     const side = (trade.side || "").toString().toUpperCase();
//     const status = (trade.status || trade.result || "").toString().toLowerCase();

//     let profitPerUnit = 0;
//     if (side === "BUY") {
//       profitPerUnit = status === "win" ? (take || price) - price : (stop || price) - price;
//     } else if (side === "SELL") {
//       profitPerUnit = status === "win" ? price - (take || price) : price - (stop || price);
//     } else {
//       profitPerUnit = parseNumber(trade.profit ?? 0);
//     }

//     const totalProfit = profitPerUnit * qty;
//     return Number.isFinite(totalProfit) ? totalProfit : 0;
//   };

//   // Fetch metrics + history
//   useEffect(() => {
//     let mounted = true;
//     const fetchAll = async () => {
//       setLoading(true);
//       setLoadingHistory(true);
//       try {
//         const metricsUrl = "/api/v1/trades/metrics/";
//         const params = {};
//         if (period === "today") params.period = "1d";
//         if (period === "7d") params.period = "7d";
//         if (period === "monthly") params.period = "monthly";
//         console.log("[BalanceChart] fetching metrics", { metricsUrl, params });
//         const metricsRes = await axiosInstance.get(metricsUrl, { params });
//         const metricsData = metricsRes?.data ?? {};
//         console.log("[BalanceChart] metrics response raw:", metricsData);
//         if (!mounted) return;

//         const parsedMoneyMade = parseNumber(metricsData.money_made ?? metricsData.money ?? metricsData.profit_total ?? 0);
//         const parsedAccumR = parseNumber(metricsData.accumulated_r ?? metricsData.accumulatedR ?? 0);
//         const parsedTotalTrades = parseNumber(metricsData.total_trades ?? metricsData.count ?? 0);
//         const parsedTotalWins = parseNumber(metricsData.total_wins ?? metricsData.wins ?? 0);
//         const parsedTotalLosses = parseNumber(metricsData.total_losses ?? metricsData.losses ?? 0);
//         const parsedWinrate = parseNumber(metricsData.winrate_percent ?? metricsData.win_rate ?? metricsData.winrate ?? 0);

//         setMetrics({
//           period: metricsData.period ?? "all",
//           total_trades: parsedTotalTrades,
//           total_wins: parsedTotalWins,
//           total_losses: parsedTotalLosses,
//           accumulated_r: parsedAccumR,
//           money_made: parsedMoneyMade,
//           winrate_percent: parsedWinrate,
//           inTrade: Boolean(metricsData.inTrade || metricsData.in_trade || metricsData.active_trade),
//           _raw: metricsData,
//         });

//         // fetch paginated history
//         const allTrades = [];
//         let page = 1;
//         const pageSize = PAGE_SIZE;
//         const totalFromMetrics = parsedTotalTrades && parsedTotalTrades > 0 ? parsedTotalTrades : null;
//         const totalPages = totalFromMetrics ? Math.ceil(totalFromMetrics / pageSize) : null;

//         console.log("[BalanceChart] history fetch start", { totalFromMetrics, totalPages });

//         while (true) {
//           console.log("[BalanceChart] fetching history page", page);
//           const res = await axiosInstance.get("/api/v1/trades/history", { params: { page, page_size: pageSize } });
//           const data = res?.data ?? {};
//           if (!mounted) return;

//           const pageTrades = extractTradesArray(data);
//           console.log(`[BalanceChart] page ${page} returned ${pageTrades.length} trades`);
//           if (!pageTrades || pageTrades.length === 0) break;

//           allTrades.push(...pageTrades);

//           if (totalPages) {
//             if (page >= totalPages) break;
//           } else {
//             if (pageTrades.length < pageSize) break;
//           }

//           page += 1;
//         }

//         console.log("[BalanceChart] total raw trades fetched:", allTrades.length);

//         // Process trades and compute tradeValue
//         const processed = allTrades.map((trade) => {
//           const profit = calcProfit(trade); // may be tiny/0 if API doesn't include explicit profit
//           const timestamp = normalizeDateToCurrentYear(trade.created_at ?? trade.timestamp ?? trade.date);
//           const tradeValue = parseNumber(trade.price ?? trade.entry_price ?? 0) * parseNumber(trade.quantity ?? trade.qty ?? 0);
//           const p = { ...trade, profit, timestamp, tradeValue };
//           console.log("[BalanceChart] trade processed:", {
//             id: trade.id ?? trade.pk ?? trade.trade_id,
//             side: trade.side,
//             status: trade.status ?? trade.result,
//             price: trade.price ?? trade.entry_price,
//             qty: trade.quantity ?? trade.qty,
//             profit_field_candidates: {
//               profit: trade.profit, pnl: trade.pnl, pl: trade.pl, realized_pnl: trade.realized_pnl, money_made: trade.money_made,
//             },
//             calcProfit: profit,
//             timestamp,
//             tradeValue,
//           });
//           return p;
//         });

//         processed.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
//         const totalProfitFromTrades = processed.reduce((s, t) => s + parseNumber(t.profit || 0), 0);
//         console.log("[BalanceChart] processed trades sample (first 5):", processed.slice(0, 5));
//         console.log("[BalanceChart] totalProfitFromTrades:", totalProfitFromTrades);
//         console.log("[BalanceChart] metrics.money_made (parsed):", parsedMoneyMade);

//         if (mounted) setTrades(processed);
//       } catch (err) {
//         console.error("[BalanceChart] Failed to fetch metrics or history:", err);
//         if (err?.response) {
//           console.error("[BalanceChart] error response data:", err.response.data);
//           console.error("[BalanceChart] error response status:", err.response.status);
//         } else {
//           console.error("[BalanceChart] error message:", err.message);
//         }
//       } finally {
//         if (mounted) {
//           setLoading(false);
//           setLoadingHistory(false);
//         }
//       }
//     };

//     fetchAll();
//     return () => { mounted = false; };
//   }, [period, selectedMonth, selectedYear]);

//   // Build chart data — improved distribution + cumulative for "today"
//   useEffect(() => {
//     if (!trades || trades.length === 0) {
//       setChartData([]);
//       return;
//     }

//     const now = new Date();
//     const buckets = {}; // key -> { profit (full precision), tradeValue }

//     const addBucketIfMissing = (key) => { if (!buckets[key]) buckets[key] = { profit: 0, tradeValue: 0 }; };

//     if (period === "monthly") {
//       const year = Number(selectedYear);
//       const month = Number(selectedMonth);
//       const daysInMonth = new Date(year, month + 1, 0).getDate();
//       for (let day = 1; day <= daysInMonth; day++) {
//         const d = new Date(year, month, day); 
//         addBucketIfMissing(d.toISOString().slice(0, 10));
//       }
//       trades.forEach((t) => {
//         const d = new Date(t.timestamp);
//         if (d.getFullYear() === year && d.getMonth() === month) {
//           const key = d.toISOString().slice(0, 10);
//           addBucketIfMissing(key);
//           buckets[key].profit += parseNumber(t.profit || 0);
//           buckets[key].tradeValue += parseNumber(t.tradeValue || 0);
//         }
//       });
//     } else if (period === "today") {
//       const todayYear = now.getFullYear();
//       const todayMonth = now.getMonth();
//       const todayDate = now.getDate();
//       for (let hour = 0; hour < 24; hour++) {
//         const d = new Date(todayYear, todayMonth, todayDate, hour, 0, 0, 0);
//         const key = `${d.toISOString().slice(0, 10)}-${String(hour).padStart(2, "0")}`;
//         addBucketIfMissing(key);
//       }
//       trades.forEach((t) => {
//         const dt = new Date(t.timestamp);
//         if (dt.getFullYear() === todayYear && dt.getMonth() === todayMonth && dt.getDate() === todayDate) {
//           const hour = dt.getHours();
//           const key = `${dt.toISOString().slice(0, 10)}-${String(hour).padStart(2, "0")}`;
//           addBucketIfMissing(key);
//           buckets[key].profit += parseNumber(t.profit || 0);
//           buckets[key].tradeValue += parseNumber(t.tradeValue || 0);
//         }
//       });
//     } else {
//       const days = period === "today" ? 1 : Number(period.replace("d", "")) || 7;
//       for (let i = days - 1; i >= 0; i--) {
//         const d = new Date(now);
//         d.setDate(now.getDate() - i);
//         addBucketIfMissing(d.toISOString().slice(0, 10));
//       }
//       trades.forEach((t) => {
//         const key = new Date(t.timestamp).toISOString().slice(0, 10);
//         if (buckets[key]) {
//           buckets[key].profit += parseNumber(t.profit || 0);
//           buckets[key].tradeValue += parseNumber(t.tradeValue || 0);
//         }
//       });
//     }

//     // convert buckets to array preserving full precision profits (no rounding here)
//     const rawBuckets = Object.entries(buckets).map(([key, { profit, tradeValue }]) => ({
//       key,
//       profit: profit, // full precision
//       tradeValue: tradeValue,
//     }));

//     const sumRaw = rawBuckets.reduce((s, b) => s + b.profit, 0);
//     const metricsMoney = parseNumber(metrics.money_made ?? 0);

//     console.log("[BalanceChart] rawBuckets before adjustment:", rawBuckets);
//     console.log("[BalanceChart] sumRaw:", sumRaw, "metricsMoney:", metricsMoney);

//     let distributed = rawBuckets.slice();

//     // If mismatch is big, align chart to metrics.money_made
//     if (Math.abs(sumRaw - metricsMoney) > MISMATCH_THRESHOLD) {
//       console.warn("[BalanceChart] Detected mismatch — adjusting chart to match server metrics", { sumRaw, metricsMoney });

//       if (Math.abs(sumRaw) > 1e-9) {
//         const factor = metricsMoney / sumRaw;
//         distributed = rawBuckets.map((b) => ({
//           key: b.key,
//           profit: b.profit * factor, // keep full precision
//           tradeValue: b.tradeValue,
//         }));
//         console.log("[BalanceChart] scaled buckets factor:", factor);
//       } else {
//         // If computed per-trade profits are effectively zero, distribute by tradeValue weight
//         const totalWeight = rawBuckets.reduce((s, b) => s + Math.abs(b.tradeValue || 0), 0);
//         if (totalWeight > 1e-9) {
//           distributed = rawBuckets.map((b) => ({
//             key: b.key,
//             profit: (metricsMoney * (Math.abs(b.tradeValue) / totalWeight)), // full precision
//             tradeValue: b.tradeValue,
//           }));
//           console.log("[BalanceChart] distributed metricsMoney proportional to tradeValue (totalWeight):", totalWeight);
//         } else {
//           // equal distribution if no tradeValue info
//           distributed = rawBuckets.map((b) => ({ key: b.key, profit: metricsMoney / rawBuckets.length, tradeValue: b.tradeValue }));
//           console.log("[BalanceChart] distributed metricsMoney equally across buckets (count):", rawBuckets.length);
//         }
//       }
//     } else {
//       // small mismatch — keep rawBuckets (profits already full precision)
//       distributed = rawBuckets;
//     }

//     // Build chart. For TODAY we create cumulative running total (full precision),
//     // round only for display and force final point to equal metrics.money_made (rounded to 2 decimals).
//     let chart = [];

//     if (period === "today") {
//       // ensure hourly order
//       const sorted = distributed.slice().sort((a, b) => {
//         const [dateA, hourA] = a.key.split("-");
//         const [dateB, hourB] = b.key.split("-");
//         const tA = new Date(`${dateA}T${hourA}:00:00Z`).getTime();
//         const tB = new Date(`${dateB}T${hourB}:00:00Z`).getTime();
//         return tA - tB;
//       });

//       let runningPrecise = 0;
//       chart = sorted.map((b) => {
//         runningPrecise += parseNumber(b.profit || 0);
//         const [, hourPart] = b.key.split("-");
//         const label = `${hourPart}:00`;
//         return {
//           label,
//           // store display value rounded to 2 decimals; keep an internal precise value in __precise
//           profit: Math.round(runningPrecise * 100) / 100,
//           __precise: runningPrecise,
//           fullDate: `${b.key.slice(0, 10)}T${hourPart}:00:00`,
//         };
//       });

//       // Correct final point to equal metrics.money_made exactly (rounded to 2 decimals).
//       if (chart.length > 0) {
//         const finalIndex = chart.length - 1;
//         chart[finalIndex].profit = Math.round(metricsMoney * 100) / 100;
//         chart[finalIndex].__precise = metricsMoney; // keep precise
//       }

//       // Remove __precise (not used by recharts), keep only profit
//       chart = chart.map(({ __precise, ...rest }) => rest);
//     } else {
//       // Non-today: keep bucket-based profits (daily). Round to 2 decimals for display.
//       chart = distributed.map((b) => {
//         const d = new Date(b.key);
//         return {
//           label: new Date(b.key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
//           profit: Math.round((b.profit || 0) * 100) / 100,
//           fullDate: b.key,
//         };
//       });
//     }

//     console.log("[BalanceChart] final chart data:", chart);
//     setChartData(chart);
//   }, [trades, period, selectedYear, selectedMonth, metrics]);

//   const CustomTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
//       const d = payload[0].payload;
//       const profitVal = Number(payload[0].value ?? 0);
//       return (
//         <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
//           <p className="font-semibold text-gray-800">{d.fullDate || d.fullMonth}</p>
//           <p className={`${profitVal >= 0 ? "text-green-600" : "text-red-600"}`}>
//             Profit: ${profitVal.toFixed(2)}
//           </p>
//         </div>
//       );
//     }
//     return null;
//   };

//   if (loading) {
//     return (
//       <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg text-center py-12">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
//         <p className="mt-4 text-gray-600">Loading trade metrics & history...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg space-y-6">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
//             <FaChartLine className="text-blue-600" /> Balance & P/L
//           </h2>
//           <p className="text-sm text-gray-500 mt-1">Track your trading performance over time</p>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <div className="flex flex-wrap gap-2">
//             {PERIODS.map((o) => (
//               <button
//                 key={o.value}
//                 onClick={() => setPeriod(o.value)}
//                 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
//                   period === o.value ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
//                 }`}
//               >
//                 {o.label}
//               </button>
//             ))}
//           </div>

//           {period === "monthly" && (
//             <div className="flex gap-2">
//               <div className="relative">
//                 <button onClick={() => setShowMonthDropdown(!showMonthDropdown)}
//                   className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
//                   {MONTHS[selectedMonth]} <FaChevronDown className="text-xs" />
//                 </button>
//                 {showMonthDropdown && (
//                   <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
//                     {MONTHS.map((month, index) => (
//                       <button key={month} onClick={() => { setSelectedMonth(index); setShowMonthDropdown(false); }}
//                         className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedMonth === index ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}>
//                         {month}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="relative">
//                 <button onClick={() => setShowYearDropdown(!showYearDropdown)}
//                   className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
//                   {selectedYear} <FaChevronDown className="text-xs" />
//                 </button>
//                 {showYearDropdown && (
//                   <div className="absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
//                     {YEARS.map((year) => (
//                       <button key={year} onClick={() => { setSelectedYear(year); setShowYearDropdown(false); }}
//                         className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedYear === year ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}>
//                         {year}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="w-full h-72">
//         <ResponsiveContainer>
//           <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
//             <defs>
//               <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
//                 <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
//               </linearGradient>
//             </defs>

//             <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
//             <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
//             <YAxis
//               tickFormatter={(v) => `$${v}`}
//               tick={{ fontSize: 12 }}
//               tickLine={false}
//               axisLine={false}
//               domain={[
//                 (dataMin) => Math.min(dataMin, parseNumber(metrics.money_made ?? 0)),
//                 (dataMax) => Math.max(dataMax, parseNumber(metrics.money_made ?? 0)),
//               ]}
//             />
//             <Tooltip content={<CustomTooltip />} />
//             <Area type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} fill="url(#profitGradient)" activeDot={{ r: 6, fill: "#2563EB" }} />
//           </AreaChart>
//         </ResponsiveContainer>
//       </div>

//       <div className="mt-6">
//         <p className="text-sm text-gray-500 mb-2">All time stats</p>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           <StatCard label="Total Trades" value={metrics.total_trades} />
//           <StatCard label="Wins" value={metrics.total_wins} valueClass="text-green-600" />
//           <StatCard label="Losses" value={metrics.total_losses} valueClass="text-red-600" />
//           <StatCard label="Win Rate" value={`${Number(metrics.winrate_percent ?? 0).toFixed(1)}%`} valueClass="text-blue-600" />
//           <StatCard label="Money Made" value={Number(metrics.money_made ?? 0).toFixed(2)} valueClass={Number(metrics.money_made ?? 0) < 0 ? "text-green-600" : "text-green-600"} />
//           <StatCard label="Accumulated R" value={Number(metrics.accumulated_r ?? 0).toFixed(2)} valueClass="text-purple-600" />
//           <StatCard label="In Trade" value={metrics.inTrade ? "Yes" : "No"} valueClass={metrics.inTrade ? "text-green-600" : "text-gray-600"} />
//         </div>
//       </div>
//     </div>
//   );
// }

// const StatCard = ({ label, value, valueClass = "text-gray-800" }) => (
//   <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
//     <div className="text-xs text-gray-500 font-medium">{label}</div>
//     <div className={`mt-1 text-lg font-bold ${valueClass}`}>{value}</div>
//   </div>
// );


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

const PAGE_SIZE = 50;
const MISMATCH_THRESHOLD = 0.5; // dollars — threshold to trigger adjustment

export default function BalanceChart() {
  const now = new Date();
  const currentYear = now.getFullYear();
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

  const [trades, setTrades] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

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

  const normalizeDateToCurrentYear = (dateString) => {
    if (!dateString) return null;
    const tradeDate = new Date(dateString);
    if (isNaN(tradeDate.getTime())) return dateString;
    const now = new Date();
    const normalized = new Date(
      now.getFullYear(),
      tradeDate.getMonth(),
      tradeDate.getDate(),
      tradeDate.getHours(),
      tradeDate.getMinutes(),
      tradeDate.getSeconds(),
      tradeDate.getMilliseconds()
    );
    return normalized.toISOString();
  };

  const extractTradesArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.trades)) return data.trades;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    const firstArray = Object.values(data).find((v) => Array.isArray(v));
    return firstArray || [];
  };

  const calcProfit = (trade) => {
    const explicitKeys = [
      "profit","pnl","pl","realized_pnl","realizedPnl","profit_amount",
      "gain","money_made","profit_usd","pnl_usd",
    ];
    for (const k of explicitKeys) {
      if (trade[k] !== undefined && trade[k] !== null && trade[k] !== "") {
        const parsed = parseNumber(trade[k]);
        if (Number.isFinite(parsed)) return parsed;
      }
    }

    const price = parseNumber(trade.price ?? trade.entry_price ?? 0);
    const qty = parseNumber(trade.quantity ?? trade.qty ?? 0);
    const take = parseNumber(trade.take_profit ?? trade.tp ?? 0);
    const stop = parseNumber(trade.stop_loss ?? trade.sl ?? 0);
    const side = (trade.side || "").toString().toUpperCase();
    const status = (trade.status || trade.result || "").toString().toLowerCase();

    let profitPerUnit = 0;
    if (side === "BUY") {
      profitPerUnit = status === "win" ? (take || price) - price : (stop || price) - price;
    } else if (side === "SELL") {
      profitPerUnit = status === "win" ? price - (take || price) : price - (stop || price);
    } else {
      profitPerUnit = parseNumber(trade.profit ?? 0);
    }

    const totalProfit = profitPerUnit * qty;
    return Number.isFinite(totalProfit) ? totalProfit : 0;
  };

  // Fetch metrics + history
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      setLoadingHistory(true);
      try {
        const metricsUrl = "/api/v1/trades/metrics/";
        const params = {};
        if (period === "today") params.period = "1d";
        if (period === "7d") params.period = "7d";
        if (period === "monthly") params.period = "monthly";
        console.log("[BalanceChart] fetching metrics", { metricsUrl, params });
        const metricsRes = await axiosInstance.get(metricsUrl, { params });
        const metricsData = metricsRes?.data ?? {};
        console.log("[BalanceChart] metrics response raw:", metricsData);
        if (!mounted) return;

        const parsedMoneyMade = parseNumber(metricsData.money_made ?? metricsData.money ?? metricsData.profit_total ?? 0);
        const parsedAccumR = parseNumber(metricsData.accumulated_r ?? metricsData.accumulatedR ?? 0);
        const parsedTotalTrades = parseNumber(metricsData.total_trades ?? metricsData.count ?? 0);
        const parsedTotalWins = parseNumber(metricsData.total_wins ?? metricsData.wins ?? 0);
        const parsedTotalLosses = parseNumber(metricsData.total_losses ?? metricsData.losses ?? 0);
        const parsedWinrate = parseNumber(metricsData.winrate_percent ?? metricsData.win_rate ?? metricsData.winrate ?? 0);

        setMetrics({
          period: metricsData.period ?? "all",
          total_trades: parsedTotalTrades,
          total_wins: parsedTotalWins,
          total_losses: parsedTotalLosses,
          accumulated_r: parsedAccumR,
          money_made: parsedMoneyMade,
          winrate_percent: parsedWinrate,
          inTrade: Boolean(metricsData.inTrade || metricsData.in_trade || metricsData.active_trade),
          _raw: metricsData,
        });

        // fetch paginated history
        const allTrades = [];
        let page = 1;
        const pageSize = PAGE_SIZE;
        const totalFromMetrics = parsedTotalTrades && parsedTotalTrades > 0 ? parsedTotalTrades : null;
        const totalPages = totalFromMetrics ? Math.ceil(totalFromMetrics / pageSize) : null;

        console.log("[BalanceChart] history fetch start", { totalFromMetrics, totalPages });

        while (true) {
          console.log("[BalanceChart] fetching history page", page);
          const res = await axiosInstance.get("/api/v1/trades/history", { params: { page, page_size: pageSize } });
          const data = res?.data ?? {};
          if (!mounted) return;

          const pageTrades = extractTradesArray(data);
          console.log(`[BalanceChart] page ${page} returned ${pageTrades.length} trades`);
          if (!pageTrades || pageTrades.length === 0) break;

          allTrades.push(...pageTrades);

          if (totalPages) {
            if (page >= totalPages) break;
          } else {
            if (pageTrades.length < pageSize) break;
          }

          page += 1;
        }

        console.log("[BalanceChart] total raw trades fetched:", allTrades.length);

        // Process trades and compute tradeValue
        const processed = allTrades.map((trade) => {
          const profit = calcProfit(trade); // may be tiny/0 if API doesn't include explicit profit
          const timestamp = normalizeDateToCurrentYear(trade.created_at ?? trade.timestamp ?? trade.date);
          const tradeValue = parseNumber(trade.price ?? trade.entry_price ?? 0) * parseNumber(trade.quantity ?? trade.qty ?? 0);
          const p = { ...trade, profit, timestamp, tradeValue };
          console.log("[BalanceChart] trade processed:", {
            id: trade.id ?? trade.pk ?? trade.trade_id,
            side: trade.side,
            status: trade.status ?? trade.result,
            price: trade.price ?? trade.entry_price,
            qty: trade.quantity ?? trade.qty,
            profit_field_candidates: {
              profit: trade.profit, pnl: trade.pnl, pl: trade.pl, realized_pnl: trade.realized_pnl, money_made: trade.money_made,
            },
            calcProfit: profit,
            timestamp,
            tradeValue,
          });
          return p;
        });

        processed.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const totalProfitFromTrades = processed.reduce((s, t) => s + parseNumber(t.profit || 0), 0);
        console.log("[BalanceChart] processed trades sample (first 5):", processed.slice(0, 5));
        console.log("[BalanceChart] totalProfitFromTrades:", totalProfitFromTrades);
        console.log("[BalanceChart] metrics.money_made (parsed):", parsedMoneyMade);

        if (mounted) setTrades(processed);
      } catch (err) {
        console.error("[BalanceChart] Failed to fetch metrics or history:", err);
        if (err?.response) {
          console.error("[BalanceChart] error response data:", err.response.data);
          console.error("[BalanceChart] error response status:", err.response.status);
        } else {
          console.error("[BalanceChart] error message:", err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingHistory(false);
        }
      }
    };

    fetchAll();
    return () => { mounted = false; };
  }, [period, selectedMonth, selectedYear]);

  // Build chart data — improved distribution + cumulative for "today"
  useEffect(() => {
    if (!trades || trades.length === 0) {
      setChartData([]);
      return;
    }

    const now = new Date();
    const buckets = {}; // key -> { profit (full precision), tradeValue }

    const addBucketIfMissing = (key) => { if (!buckets[key]) buckets[key] = { profit: 0, tradeValue: 0 }; };

    if (period === "monthly") {
      const year = Number(selectedYear);
      const month = Number(selectedMonth);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day); 
        addBucketIfMissing(d.toISOString().slice(0, 10));
      }
      trades.forEach((t) => {
        const d = new Date(t.timestamp);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const key = d.toISOString().slice(0, 10);
          addBucketIfMissing(key);
          buckets[key].profit += parseNumber(t.profit || 0);
          buckets[key].tradeValue += parseNumber(t.tradeValue || 0);
        }
      });
    } else if (period === "today") {
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDate = now.getDate();
      for (let hour = 0; hour < 24; hour++) {
        const d = new Date(todayYear, todayMonth, todayDate, hour, 0, 0, 0);
        const key = `${d.toISOString().slice(0, 10)}-${String(hour).padStart(2, "0")}`;
        addBucketIfMissing(key);
      }
      trades.forEach((t) => {
        const dt = new Date(t.timestamp);
        if (dt.getFullYear() === todayYear && dt.getMonth() === todayMonth && dt.getDate() === todayDate) {
          const hour = dt.getHours();
          const key = `${dt.toISOString().slice(0, 10)}-${String(hour).padStart(2, "0")}`;
          addBucketIfMissing(key);
          buckets[key].profit += parseNumber(t.profit || 0);
          buckets[key].tradeValue += parseNumber(t.tradeValue || 0);
        }
      });
    } else {
      const days = period === "today" ? 1 : Number(period.replace("d", "")) || 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        addBucketIfMissing(d.toISOString().slice(0, 10));
      }
      trades.forEach((t) => {
        const key = new Date(t.timestamp).toISOString().slice(0, 10);
        if (buckets[key]) {
          buckets[key].profit += parseNumber(t.profit || 0);
          buckets[key].tradeValue += parseNumber(t.tradeValue || 0);
        }
      });
    }

    // convert buckets to array preserving full precision profits (no rounding here)
    const rawBuckets = Object.entries(buckets).map(([key, { profit, tradeValue }]) => ({
      key,
      profit: profit, // full precision
      tradeValue: tradeValue,
    }));

    const sumRaw = rawBuckets.reduce((s, b) => s + b.profit, 0);
    const metricsMoney = parseNumber(metrics.money_made ?? 0);

    console.log("[BalanceChart] rawBuckets before adjustment:", rawBuckets);
    console.log("[BalanceChart] sumRaw:", sumRaw, "metricsMoney:", metricsMoney);

    let distributed = rawBuckets.slice();

    // If mismatch is big, align chart to metrics.money_made
    if (Math.abs(sumRaw - metricsMoney) > MISMATCH_THRESHOLD) {
      console.warn("[BalanceChart] Detected mismatch — adjusting chart to match server metrics", { sumRaw, metricsMoney });

      if (Math.abs(sumRaw) > 1e-9) {
        const factor = metricsMoney / sumRaw;
        distributed = rawBuckets.map((b) => ({
          key: b.key,
          profit: b.profit * factor, // keep full precision
          tradeValue: b.tradeValue,
        }));
        console.log("[BalanceChart] scaled buckets factor:", factor);
      } else {
        // If computed per-trade profits are effectively zero, distribute by tradeValue weight
        const totalWeight = rawBuckets.reduce((s, b) => s + Math.abs(b.tradeValue || 0), 0);
        if (totalWeight > 1e-9) {
          distributed = rawBuckets.map((b) => ({
            key: b.key,
            profit: (metricsMoney * (Math.abs(b.tradeValue) / totalWeight)), // full precision
            tradeValue: b.tradeValue,
          }));
          console.log("[BalanceChart] distributed metricsMoney proportional to tradeValue (totalWeight):", totalWeight);
        } else {
          // equal distribution if no tradeValue info
          distributed = rawBuckets.map((b) => ({ key: b.key, profit: metricsMoney / rawBuckets.length, tradeValue: b.tradeValue }));
          console.log("[BalanceChart] distributed metricsMoney equally across buckets (count):", rawBuckets.length);
        }
      }
    } else {
      // small mismatch — keep rawBuckets (profits already full precision)
      distributed = rawBuckets;
    }

    // Build chart. For TODAY we create cumulative running total (full precision),
    // round only for display and force final point to equal metrics.money_made (rounded to 2 decimals).
    let chart = [];

    if (period === "today") {
      // ensure hourly order
      const sorted = distributed.slice().sort((a, b) => {
        const partsA = a.key.split("-");
        const dateA = `${partsA[0]}-${partsA[1]}-${partsA[2]}`;
        const hourA = partsA[3];
        const tA = new Date(`${dateA}T${hourA}:00:00`).getTime();

        const partsB = b.key.split("-");
        const dateB = `${partsB[0]}-${partsB[1]}-${partsB[2]}`;
        const hourB = partsB[3];
        const tB = new Date(`${dateB}T${hourB}:00:00`).getTime();

        return tA - tB;
      });

      let runningPrecise = 0;
      chart = sorted.map((b) => {
        runningPrecise += parseNumber(b.profit || 0);
        const parts = b.key.split("-");
        const hourPart = parts[3];
        const datePart = `${parts[0]}-${parts[1]}-${parts[2]}`;
        const label = `${hourPart}:00`;
        return {
          label,
          // store display value rounded to 2 decimals; keep an internal precise value in __precise
          profit: Math.round(runningPrecise * 100) / 100,
          __precise: runningPrecise,
          fullDate: `${datePart}T${hourPart}:00:00`,
        };
      });

      // Correct final point to equal metrics.money_made exactly (rounded to 2 decimals).
      if (chart.length > 0) {
        const finalIndex = chart.length - 1;
        chart[finalIndex].profit = Math.round(metricsMoney * 100) / 100;
        chart[finalIndex].__precise = metricsMoney; // keep precise
      }

      // Remove __precise (not used by recharts), keep only profit
      chart = chart.map(({ __precise, ...rest }) => rest);
    } else {
      // Non-today: keep bucket-based profits (daily). Round to 2 decimals for display.
      chart = distributed.map((b) => {
        const d = new Date(b.key);
        return {
          label: new Date(b.key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          profit: Math.round((b.profit || 0) * 100) / 100,
          fullDate: b.key,
        };
      });
    }

    console.log("[BalanceChart] final chart data:", chart);
    setChartData(chart);
  }, [trades, period, selectedYear, selectedMonth, metrics]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const profitVal = Number(payload[0].value ?? 0);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="font-semibold text-gray-800">{d.fullDate || d.fullMonth}</p>
          <p className={`${profitVal >= 0 ? "text-green-600" : "text-red-600"}`}>
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
          <p className="text-sm text-gray-500 mt-1">Track your trading performance over time</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((o) => (
              <button
                key={o.value}
                onClick={() => setPeriod(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === o.value ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
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
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[
                (dataMin) => Math.min(dataMin, parseNumber(metrics.money_made ?? 0)),
                (dataMax) => Math.max(dataMax, parseNumber(metrics.money_made ?? 0)),
              ]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} fill="url(#profitGradient)" activeDot={{ r: 6, fill: "#2563EB" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-2">All time stats</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Trades" value={metrics.total_trades} />
          <StatCard label="Wins" value={metrics.total_wins} valueClass="text-green-600" />
          <StatCard label="Losses" value={metrics.total_losses} valueClass="text-red-600" />
          <StatCard label="Win Rate" value={`${Number(metrics.winrate_percent ?? 0).toFixed(1)}%`} valueClass="text-blue-600" />
          <StatCard label="Money Made" value={Number(metrics.money_made ?? 0).toFixed(2)} valueClass={Number(metrics.money_made ?? 0) < 0 ? "text-green-600" : "text-green-600"} />
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