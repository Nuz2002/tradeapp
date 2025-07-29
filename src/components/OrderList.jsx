import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderCard from "./OrderCard";
import TradingStats from "./TradingStats";
import { FaExchangeAlt } from "react-icons/fa";
import axiosInstance from "./axiosInstance";

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [inTrade, setInTrade] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tradesRes, metricsRes, profileRes] = await Promise.all([
          axiosInstance.get("/api/v1/trades/history"),
          axiosInstance.get("/api/v1/trades/metrics/"),
          axiosInstance.get("/accounts/profile/"),
        ]);

        setOrders(tradesRes.data.trades);
        setInTrade(metricsRes.data.inTrade);
        setUserProfile(profileRes.data);
      } catch (err) {
        console.error("Data fetch error:", err);
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.message || "Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleToggle = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  if (loading) {
    return <div className="text-center p-4">Loading trades & status...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <div>Error: {error}</div>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => navigate("/login")}
        >
          Go to Login
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
              ${userProfile.balance.toFixed(2)}
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

      <TradingStats orders={orders} />

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
                displaySide: order.side.toUpperCase(),
              }}
              isExpanded={order.id === expandedOrderId}
              onToggle={() => handleToggle(order.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersList;
