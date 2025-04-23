import React from 'react';
import { ChevronDown, ChevronUp } from 'react-feather';

const OrderCard = ({ order, isExpanded, onToggle }) => {
  let statusBorderColor;

  if (order.status === 'win') {
    statusBorderColor = 'border-green-500';
  } else if (order.status === 'in_progress') {
    statusBorderColor = 'border-blue-500';
  } else {
    statusBorderColor = 'border-red-500';
  }

  const sideTextColor = order.side === 'Buy' ? 'text-green-700' : 'text-red-700';

  const formatNumber = (value) => 
    Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
      className={`rounded-lg shadow-md p-4 m-2 border-l-4 ${statusBorderColor} cursor-pointer transition-all`}
      onClick={onToggle}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{order.symbol}</h3>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${sideTextColor}`}>{order.side}</span>
          <span className={`text-sm px-2 py-1 rounded ${order.status === 'win' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {order.status.toUpperCase()}
          </span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-sm text-gray-600">Price</p>
          <p className="font-medium">${formatNumber(order.price)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Created at</p>
          <p className="font-medium">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <p className="text-sm text-gray-600">Order Type</p>
              <p className="font-medium">{order.orderType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="font-medium">{order.qty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-medium">{order.category}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Take Profit</p>
                <p className="font-medium text-green-600">${formatNumber(order.takeProfit)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stop Loss</p>
                <p className="font-medium text-red-600">${formatNumber(order.stopLoss)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderCard;