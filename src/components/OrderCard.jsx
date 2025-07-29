import React from 'react';
import { ChevronDown, ChevronUp } from 'react-feather';

const OrderCard = ({ order, isExpanded, onToggle }) => {
  let statusBorderColor;
  let statusBgColor;
  if (order.status === 'win') {
    statusBorderColor = 'border-green-300';
    statusBgColor = 'bg-green-50';
  } else if (order.status === 'in_progress') {
    statusBorderColor = 'border-blue-400';
    statusBgColor = 'bg-blue-50';
  } else {
    statusBorderColor = 'border-gray-300';
    statusBgColor = 'bg-gray-50';
  }

  const sideTextColor = order.side === 'Buy' ? 'text-green-700' : 'text-red-700';

  const formatNumber = (value) => 
    Number(value).toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Convert to GMT+6
    const gmtOffset = 0; // GMT+6
    date.setHours(date.getHours() + gmtOffset); // Adjust time to GMT+6
    
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date).replace(',', '');
  };
  

  return (
    <div 
      className={`rounded-2xl shadow-sm p-5 m-2 border-l-4 ${statusBorderColor} ${statusBgColor} cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]`}
      onClick={onToggle}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-blue-900 tracking-tight">{order.symbol}</h3>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${sideTextColor}`}>{order.side}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold
            ${order.status === 'win' ? 'bg-green-100 text-green-700 border border-green-200' :
              order.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
              'bg-gray-100 text-gray-500 border border-gray-200'}`}
          >
            {order.status.toUpperCase()}
          </span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <p className="text-xs text-gray-500">Price</p>
          <p className="font-medium text-blue-900">${formatNumber(order.price)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Created at</p>
          <p className="font-medium text-blue-900">{formatDate(order.created_at)}</p>
        </div>
      </div>
      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* <div>
              <p className="text-xs text-gray-500">Order Type</p>
              <p className="font-medium text-blue-900">{order.orderType}</p>
            </div> */}
            <div>
              <p className="text-xs text-gray-500">Quantity</p>
              <p className="font-medium text-blue-900">{order.qty}</p>
            </div>
            {/* <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="font-medium text-blue-900">{order.category}</p>
            </div> */}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500">Take Profit</p>
                <p className="font-medium text-green-700">${formatNumber(order.take_profit)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Stop Loss</p>
                <p className="font-medium text-red-600">${formatNumber(order.stop_loss)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderCard;