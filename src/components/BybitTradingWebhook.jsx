import React, { useState, useEffect } from "react";
import { FaExchangeAlt, FaInfoCircle } from "react-icons/fa";
import axiosInstance from "./axiosInstance";

const BybitTradingWebhook = () => {
  const [formData, setFormData] = useState({
    symbol: "SOLUSDT",
    side: "",
    price: "",
    user_email: "",
    order_id: "",
    status: "in_progress",
    take_profit: "",
    stop_loss: "",
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/accounts/profile/");
        setFormData((prev) => ({
          ...prev,
          user_email: res.data.email,
        }));
      } catch (err) {
        console.error(
          "Profile fetch error:",
          err.response?.data || err.message
        );
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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
      if (!formData[field]?.toString().trim()) {
        newErrors[field] = "This field is required";
      }
    });

    const numericFields = ["price", "take_profit", "stop_loss"];
    numericFields.forEach((field) => {
      if (formData[field] && isNaN(parseFloat(formData[field]))) {
        newErrors[field] = "Must be a valid number";
      }
    });

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

    const payload = {
      symbol: formData.symbol,
      side: formData.side,
      price: parseFloat(formData.price),
      user_email: formData.user_email,
      order_id: formData.order_id,
      status: formData.status,
      ...(formData.take_profit && {
        take_profit: parseFloat(formData.take_profit),
      }),
      ...(formData.stop_loss && { stop_loss: parseFloat(formData.stop_loss) }),
    };

    try {
      const res = await axiosInstance.post("/api/v1/trading/", payload);

      setResponseMsg({
        text: "Webhook processed successfully!",
        isError: false,
        data: res.data,
      });

      setFormData((prev) => ({
        ...prev,
        side: "",
        price: "",
        order_id: "",
        take_profit: "",
        stop_loss: "",
      }));
    } catch (err) {
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
    <div className="p-6 max-w-4xl mx-auto">


      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Trade Configuration Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-gray-200 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                1
              </span>
              Trade Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Symbol *"
                name="symbol"
                value="SOLUSDT"
                disabled
              />

              <SelectField
                label="Side *"
                name="side"
                value={formData.side}
                onChange={handleChange}
                error={errors.side}
                options={[
                  { label: "Select trading side", value: "" },
                  { label: "Buy", value: "BUY" },
                  { label: "Sell", value: "SELL" },
                ]}
              />

              <InputField
                label="Price *"
                name="price"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
                type="number"
                step="0.0001"
                min="0"
                placeholder="Enter trade price"
              />

              <InputField
                label="Order ID *"
                name="order_id"
                value={formData.order_id}
                onChange={handleChange}
                error={errors.order_id}
                placeholder="Unique order identifier"
              />
            </div>
          </div>

          {/* Risk Management Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-gray-200 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                2
              </span>
              Risk Management (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Take Profit"
                name="take_profit"
                value={formData.take_profit}
                onChange={handleChange}
                error={errors.take_profit}
                type="number"
                step="0.0001"
                min="0"
                placeholder="Profit target price"
              />

              <InputField
                label="Stop Loss"
                name="stop_loss"
                value={formData.stop_loss}
                onChange={handleChange}
                error={errors.stop_loss}
                type="number"
                step="0.0001"
                min="0"
                placeholder="Risk limit price"
              />
            </div>
          </div>

          {/* System Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-gray-200 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                3
              </span>
              System Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Status"
                name="status"
                value="In Progress"
                disabled
              />

              <InputField
                label="User Account"
                name="user_email"
                value={formData.user_email}
                disabled
              />
            </div>
          </div>

          {/* Action Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div>
                {responseMsg && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      responseMsg.isError
                        ? "bg-red-50 text-red-700"
                        : "bg-green-50 text-green-700"
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
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`px-5 py-2.5 rounded-lg font-medium text-white transition-all flex items-center gap-2 min-w-[150px] justify-center ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <FaExchangeAlt className="text-sm" />
                    Execute Webhook
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, error, ...rest }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 border ${
        error ? "border-red-300" : "border-gray-300"
      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
      {...rest}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

const SelectField = ({ label, name, value, onChange, error, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 border ${
        error ? "border-red-300" : "border-gray-300"
      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiAjdjQ2NTc1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+")] bg-no-repeat bg-[right:0.75rem_center] bg-[length:1.25rem]`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default BybitTradingWebhook;