import React, { useState, useEffect } from 'react';
import { FaBars, FaHistory, FaLink, FaBolt, FaSignOutAlt, FaChartLine, FaSyncAlt, FaExchangeAlt } from 'react-icons/fa';
import OrderList from './OrderList';
import { useNavigate } from 'react-router-dom';
import BybitLiveFeed from './BybitLiveFeed';
import BalanceChart from './BalanceChart';
import ResetTradingState from './ResetTradingState';
import BybitTradingWebhook from './BybitTradingWebhook';

const SidebarLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState('trade');
  const [sidebarHeight, setSidebarHeight] = useState('100vh');
  const navigate = useNavigate();

  const menu = [
    { key: 'trade', label: 'Trade History', icon: <FaHistory size={20} /> },
    {
      key: 'bybit_webhook',
      label: 'Bybit Webhook',
      icon: <FaExchangeAlt size={18} className="text-gray-600" />,
      component: <BybitTradingWebhook />
    },
    { key: 'balance', label: 'Balance Chart', icon: <FaChartLine size={20} /> },
    { key: 'webhook', label: 'Webhook History', icon: <FaLink size={20} /> },
    { key: 'bybit', label: 'Bybit Live Feed', icon: <FaBolt size={20} /> },
    { 
      key: 'reset', 
      label: 'Reset System', 
      icon: <FaSyncAlt size={18} className="text-grey-600" />,
      component: <ResetTradingState />
    }
  ];

  // Dummy webhook events
  const webhookEvents = [
    { id: 1, event: 'Order Placed', time: '2024-06-01 12:34', status: 'Success' },
    { id: 2, event: 'Order Cancelled', time: '2024-06-01 13:10', status: 'Failed' },
    { id: 3, event: 'Balance Updated', time: '2024-06-01 14:22', status: 'Success' },
    { id: 4, event: 'Order Filled', time: '2024-06-01 15:05', status: 'Pending' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    navigate('/login');
    window.location.reload();
  };

  // Update sidebar height when window resizes
  useEffect(() => {
    const updateHeight = () => {
      setSidebarHeight(`${window.innerHeight}px`);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div className="flex">
      {/* Fixed Sidebar */}
      <div
        className="fixed top-0 left-0 bottom-0 z-10" // Fixed positioning
        style={{ height: sidebarHeight }}
      >
        <div
          className={`bg-white border-r border-gray-100 shadow-md h-full flex flex-col justify-between transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}
        >
          <div>
            <button
              className="p-4 focus:outline-none hover:bg-gray-50 transition w-full text-left"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
            >
              <FaBars size={22} />
            </button>
            <div className="flex-1 flex flex-col gap-2 mt-4">
              {menu.map((item) => (
                <button
                  key={item.key}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-200 border-l-4
                    ${selected === item.key ? 'border-blue-500 bg-gray-50 text-blue-700' : 'border-transparent hover:bg-gray-100'}
                  `}
                  onClick={() => setSelected(item.key)}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                  {collapsed && (
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 flex flex-col items-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-500 bg-white hover:bg-red-50 font-semibold transition-all w-full justify-center"
            >
              <FaSignOutAlt size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
            <div className="mt-2 text-center text-xs text-gray-400">
              {!collapsed && <span>TradeApp UI</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with sidebar offset */}
      <div 
        className={`flex-1 bg-gray-50 min-h-screen transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}
      >
        {selected === 'trade' && <OrderList />}
        {selected === 'balance' && <BalanceChart />}
        {selected === 'webhook' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Webhook History</h2>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500">
                    <th className="py-2 px-4 font-normal">Event</th>
                    <th className="py-2 px-4 font-normal">Time</th>
                    <th className="py-2 px-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookEvents.map(event => (
                    <tr key={event.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-2 px-4 text-gray-800">{event.event}</td>
                      <td className="py-2 px-4 text-gray-500">{event.time}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border
                          ${event.status === 'Success' ? 'bg-gray-100 text-blue-700 border-blue-200' : 
                            event.status === 'Failed' ? 'bg-gray-100 text-red-500 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                        >
                          {event.status === 'Success' && <span className="text-blue-400">●</span>}
                          {event.status === 'Failed' && <span className="text-red-400">●</span>}
                          {event.status === 'Pending' && <span className="text-gray-400">●</span>}
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {webhookEvents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400">
                        <span className="text-2xl">—</span><br />No webhook events yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selected === 'bybit' && <BybitLiveFeed />}
        {selected === 'reset' && <ResetTradingState />}
        {selected === 'bybit_webhook' && <BybitTradingWebhook />}
      </div>
    </div>
  );
};

export default SidebarLayout;