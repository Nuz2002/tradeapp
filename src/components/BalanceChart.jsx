import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { FaChartLine, FaCalendarAlt } from 'react-icons/fa';

const BalanceChart = () => {
  const [timePeriod, setTimePeriod] = useState('7d');

  // Dummy balance data - simulating realistic trading balance changes
  const generateDummyData = (days) => {
    const data = [];
    const baseBalance = 10000;
    let currentBalance = baseBalance;
    
    for (let i = days; i >= 0; i--) {
      // Simulate realistic balance fluctuations
      const change = (Math.random() - 0.5) * 200; // Random change between -100 and +100
      currentBalance += change;
      
      // Ensure balance doesn't go negative
      currentBalance = Math.max(currentBalance, 1000);
      
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          ...(days > 7 && { year: '2-digit' })
        }),
        balance: Math.round(currentBalance * 100) / 100,
        timestamp: date.getTime()
      });
    }
    
    return data;
  };

  const getData = () => {
    const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
    return generateDummyData(days);
  };

  const data = getData();
  const currentBalance = data[data.length - 1]?.balance || 0;
  const previousBalance = data[data.length - 2]?.balance || 0;
  const change = currentBalance - previousBalance;
  const changePercent = previousBalance ? ((change / previousBalance) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-lg font-semibold text-gray-800">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FaChartLine className="text-gray-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-800">Balance Overview</h2>
        </div>
        
        {/* Time Period Filter */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1">
          {['7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                timePeriod === period
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Current Balance</p>
          <p className="text-2xl font-bold text-gray-800">${currentBalance.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Change</p>
          <p className={`text-lg font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}${change.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Change %</p>
          <p className={`text-lg font-semibold ${changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Highest Balance</span>
              <span className="font-medium text-gray-800">
                ${Math.max(...data.map(d => d.balance)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lowest Balance</span>
              <span className="font-medium text-gray-800">
                ${Math.min(...data.map(d => d.balance)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Average Balance</span>
              <span className="font-medium text-gray-800">
                ${(data.reduce((sum, d) => sum + d.balance, 0) / data.length).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Trading Activity</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Trades</span>
              <span className="font-medium text-gray-800">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Win Rate</span>
              <span className="font-medium text-green-600">68%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active Positions</span>
              <span className="font-medium text-blue-600">2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceChart; 