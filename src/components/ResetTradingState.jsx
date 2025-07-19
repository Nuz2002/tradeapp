import React, { useState } from 'react';
import axios from 'axios';
import { FaRedo } from 'react-icons/fa';

const ResetTradingState = () => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState(null);

  const handleReset = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        'http://46.101.129.205/api/v1/system/reset-trading-state/',
        { reason },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }
        }
      );
      console.log(res);
      setResponseMsg({ text: 'Reset successful! Trading state has been cleared.', isError: false });
      setReason(''); // Clear input after successful reset
    } catch (err) {
      setResponseMsg({ 
        text: 'Reset failed: ' + (err.response?.data?.detail || err.message),
        isError: true
      });
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <FaRedo className="text-gray-500 text-xl" />
        <h2 className="text-2xl font-bold text-gray-800">Reset Trading State</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <p className="text-gray-600 mb-5">
          This action will clear all trading history and reset the system state. 
          Please provide a detailed reason for this reset.
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Reset
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g Corrupted System"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              disabled={loading}
              className={`
                px-5 py-2.5 rounded-lg font-medium text-white transition-all
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md'
                }`
              }
            >
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>
                    <FaRedo className="text-sm" />
                    Reset Trading State
                  </>
                )}
              </div>
            </button>
          </div>
          
          {responseMsg && (
            <div className={`p-3 rounded-lg text-sm border ${
              responseMsg.isError 
                ? 'bg-red-50 text-red-700 border-red-100' 
                : 'bg-green-50 text-green-700 border-green-100'
            }`}>
              {responseMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetTradingState;