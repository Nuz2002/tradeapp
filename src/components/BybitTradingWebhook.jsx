import React, { useState } from "react";
import axios from "axios";
import { FaExchangeAlt } from "react-icons/fa";

const BybitTradingWebhook = () => {
  const [formData, setFormData] = useState({
    symbol: "",
    side: "",
    price: "",
    quantity: "",
    user_email: "",
    order_id: "",
    status: "in_progress",
    take_profit: "",
    stop_loss: "",
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "symbol",
      "side",
      "price",
      "user_email",
      "order_id",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        newErrors[field] = "This field is required";
      }
    });

    // Validate numeric fields
    const numericFields = ["price", "quantity", "take_profit", "stop_loss"];
    numericFields.forEach((field) => {
      if (formData[field] && isNaN(parseFloat(formData[field]))) {
        newErrors[field] = "Must be a valid number";
      }
    });

    // Validate email format
    if (formData.user_email && !/^\S+@\S+\.\S+$/.test(formData.user_email)) {
      newErrors.user_email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setResponseMsg({ text: "Please fix form errors", isError: true });
      return;
    }

    setLoading(true);

    // Prepare payload with proper number conversion
    const payload = {
      symbol: formData.symbol,
      side: formData.side,
      price: parseFloat(formData.price),
      user_email: formData.user_email,
      order_id: formData.order_id,
      status: formData.status,
      ...(formData.quantity && { quantity: parseFloat(formData.quantity) }),
      ...(formData.take_profit && {
        take_profit: parseFloat(formData.take_profit),
      }),
      ...(formData.stop_loss && { stop_loss: parseFloat(formData.stop_loss) }),
    };

    try {
      const res = await axios.post(
        "http://46.101.129.205/api/v1/trading/",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Webhook Response:", res);
      setResponseMsg({
        text: "Webhook processed successfully!",
        isError: false,
        data: res.data,
      });
      setFormData({
        symbol: "",
        side: "",
        price: "",
        quantity: "",
        user_email: "",
        order_id: "",
        status: "",
        take_profit: "",
        stop_loss: "",
      });
    } catch (err) {
      console.error("Webhook Error:", err);

      // Extract detailed error message if available
      const errorDetail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message;

      setResponseMsg({
        text: `Webhook failed: ${errorDetail}`,
        isError: true,
        data: err.response?.data,
      });
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <FaExchangeAlt className="text-gray-500 text-xl" />
        <h2 className="text-2xl font-bold text-gray-800">
          Bybit Trading Webhook
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <p className="text-gray-600 mb-5">
          Simulate Bybit trading webhooks. Fields marked with * are required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol *
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.symbol ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="e.g., BTCUSDT"
              />
              {errors.symbol && (
                <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Side *
              </label>
              <select
                name="side"
                value={formData.side}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.side ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">Select side</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
              {errors.side && (
                <p className="mt-1 text-sm text-red-600">{errors.side}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.0001"
                min="0"
                className={`w-full px-4 py-3 border ${
                  errors.price ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Trade price"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.0001"
                min="0"
                className={`w-full px-4 py-3 border ${
                  errors.quantity ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Trade quantity"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email *
              </label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.user_email ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="user@example.com"
              />
              {errors.user_email && (
                <p className="mt-1 text-sm text-red-600">{errors.user_email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID *
              </label>
              <input
                type="text"
                name="order_id"
                value={formData.order_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.order_id ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Order identifier"
              />
              {errors.order_id && (
                <p className="mt-1 text-sm text-red-600">{errors.order_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <input
                type="text"
                name="status"
                value="In Progress"
                readOnly
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Optional Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Take Profit
              </label>
              <input
                type="number"
                name="take_profit"
                value={formData.take_profit}
                onChange={handleChange}
                step="0.0001"
                min="0"
                className={`w-full px-4 py-3 border ${
                  errors.take_profit ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Take profit price"
              />
              {errors.take_profit && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.take_profit}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stop Loss
              </label>
              <input
                type="number"
                name="stop_loss"
                value={formData.stop_loss}
                onChange={handleChange}
                step="0.0001"
                min="0"
                className={`w-full px-4 py-3 border ${
                  errors.stop_loss ? "border-red-300" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Stop loss price"
              />
              {errors.stop_loss && (
                <p className="mt-1 text-sm text-red-600">{errors.stop_loss}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`
                px-5 py-2.5 rounded-lg font-medium text-white transition-all
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                }`}
            >
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <FaExchangeAlt className="text-sm" />
                    Send Webhook
                  </>
                )}
              </div>
            </button>
          </div>

          {responseMsg && (
            <div
              className={`p-3 rounded-lg text-sm border ${
                responseMsg.isError
                  ? "bg-red-50 text-red-700 border-red-100"
                  : "bg-green-50 text-green-700 border-green-100"
              }`}
            >
              {responseMsg.text}
              {responseMsg.data && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(responseMsg.data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BybitTradingWebhook;
