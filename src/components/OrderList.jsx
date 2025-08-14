import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OrderCard from "./OrderCard";
import TradingStats from "./TradingStats";
import { FaExchangeAlt } from "react-icons/fa";
import axiosInstance from "./axiosInstance";

const OrdersList = () => {
  const DEFAULT_PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [orders, setOrders] = useState([]);
  const [inTrade, setInTrade] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // NEW: global totals (separate from paginated 'orders')
  const [totals, setTotals] = useState(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [totalCount, setTotalCount] = useState(null);
  const [totalPages, setTotalPages] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const navigate = useNavigate();

  const parseTradesResponse = (data) => {
    let trades = [];
    if (!data) return { trades: [], total: null };

    if (Array.isArray(data)) {
      trades = data;
    } else if (Array.isArray(data.trades)) {
      trades = data.trades;
    } else if (Array.isArray(data.results)) {
      trades = data.results;
    } else if (Array.isArray(data.data)) {
      trades = data.data;
    } else if (Array.isArray(data.items)) {
      trades = data.items;
    } else {
      const firstArrayField = Object.values(data).find((v) => Array.isArray(v));
      if (firstArrayField) trades = firstArrayField;
    }

    const total =
      data.count ??
      data.total ??
      data.total_count ??
      data.meta?.total ??
      data.pagination?.total ??
      null;

    return { trades, total };
  };

  // Fetch profile & metrics once — now also storing overall totals separately
  useEffect(() => {
    let mounted = true;
    const loadMeta = async () => {
      try {
        const [metricsRes, profileRes] = await Promise.all([
          axiosInstance.get("/api/v1/trades/metrics/"),
          axiosInstance.get("/accounts/profile/"),
        ]);
        if (!mounted) return;

        // metricsRes should contain metrics such as inTrade, total_trades, wins, losses, win_rate, etc.
        setInTrade(metricsRes.data?.inTrade ?? false);
        setUserProfile(profileRes.data ?? null);

        // Store whatever the metrics endpoint returned as 'totals'
        // Example shapes:
        // { total_trades: 179, wins: 100, losses: 79, win_rate: 55.8, ... }
        setTotals(metricsRes.data ?? null);
      } catch (err) {
        console.error("Meta fetch error:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.message || "Failed to load profile/metrics");
        }
      }
    };

    loadMeta();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const loadTrades = useCallback(
    async (pageToLoad = page, replace = true) => {
      setTradesLoading(true);
      setError(null);

      try {
        const res = await axiosInstance.get("/api/v1/trades/history", {
          params: { page: pageToLoad, page_size: pageSize },
        });

        const { trades: fetchedTrades, total } = parseTradesResponse(res.data);

        setOrders((prev) => (replace ? fetchedTrades : [...prev, ...fetchedTrades]));

        if (typeof total === "number" && !Number.isNaN(total)) {
          setTotalCount(total);
          setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
          setHasMore(pageToLoad < Math.ceil(total / pageSize));

          // If we don't already have a totals object from metrics endpoint,
          // use the paginated total as a fallback for total trades count.
          setTotals((prev) => {
            if (prev && (prev.total_trades || prev.total)) return prev;
            return { ...(prev || {}), total_trades: total };
          });
        } else {
          if (fetchedTrades.length === pageSize) {
            setHasMore(true);
            setTotalPages(null);
            setTotalCount(null);
          } else {
            setHasMore(false);
            setTotalPages(pageToLoad);
            setTotalCount(null);
          }
        }
      } catch (err) {
        console.error("Trades fetch error:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.message || "Failed to load trades");
        }
      } finally {
        setTradesLoading(false);
        setInitialLoading(false);
      }
    },
    [page, pageSize, navigate]
  );

  useEffect(() => {
    setInitialLoading(true);
    loadTrades(1, true);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  useEffect(() => {
    if (initialLoading && page === 1) return;
    loadTrades(page, true);
  }, [page, loadTrades, initialLoading]);

  const handleToggle = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const goToPage = (p) => {
    if (p < 1) return;
    if (totalPages && p > totalPages) return;
    setPage(p);
  };

  const handlePrev = () => goToPage(page - 1);
  const handleNext = () => goToPage(page + 1);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await loadTrades(nextPage, false);
  };

  if (initialLoading) {
    return <div className="text-center p-4">Loading trades & status...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <div>Error: {error}</div>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => {
            setError(null);
            setInitialLoading(true);
            loadTrades(1, true);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Balance and In-Trade Display */}
      <div className="mb-8 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-md">
        <div>
          <span className="text-lg font-semibold text-blue-900">User Balance</span>
          {!userProfile ? (
            <div className="text-gray-500 text-sm">Fetching balance...</div>
          ) : (
            <div className="text-3xl font-bold text-blue-800 mt-1 tracking-tight">
              ${Number(userProfile.balance ?? 0).toFixed(2)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 ${
              inTrade
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            <FaExchangeAlt className="text-base" />
            In Trade: {inTrade ? "True" : "False"}
          </span>
        </div>
      </div>

      {/* Pass global totals separately from paginated orders */}
      <TradingStats orders={orders} totals={totals} />

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-blue-400">
            <FaExchangeAlt className="text-4xl mb-2" />
            <span className="text-lg font-medium">
              No trades yet. Your trades will appear here!
            </span>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={{
                ...order,
                qty: order.quantity,
                displaySide: (order.side || "").toString().toUpperCase(),
              }}
              isExpanded={order.id === expandedOrderId}
              onToggle={() => handleToggle(order.id)}
            />
          ))
        )}
      </div>

      {/* Pagination controls (unchanged) */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              setPage(1);
            }}
            className="border rounded px-2 py-1"
          >
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={30}>30</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={page <= 1 || tradesLoading}
            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
          >
            Prev
          </button>

          {totalPages ? (
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const half = Math.floor(Math.min(totalPages, 7) / 2);
                let start = Math.max(1, page - half);
                if (start + 6 > totalPages) start = Math.max(1, totalPages - 6);
                const pageNum = start + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      pageNum === page ? "bg-blue-600 text-white" : "bg-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-600 px-3 py-1">Page {page}</div>
          )}

          <button
            onClick={handleNext}
            disabled={(totalPages && page >= totalPages) || tradesLoading}
            className="px-3 py-1 rounded border bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          {tradesLoading ? <span className="text-sm text-gray-600">Loading...</span> : null}

          {!totalPages && hasMore ? (
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={tradesLoading}
            >
              Load more
            </button>
          ) : null}

          {totalPages ? (
            <div className="text-sm text-gray-600">
              {totalCount !== null ? `${totalCount} trades • ` : ""}
              Page {page} of {totalPages}
            </div>
          ) : (
            <div className="text-sm text-gray-600">{hasMore ? "More pages available" : "End of trades"}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
