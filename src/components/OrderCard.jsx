// src/components/OrderCard.jsx
import React from 'react';

const OrderCard = ({ order }) => {
  // Determine colors based on order status
  const statusBgColor = order.status === 'win' ? 'bg-green-100' : 'bg-red-100';
  const statusBorderColor = order.status === 'win' ? 'border-green-500' : 'border-red-500';
  
  // Side indicator color
  const sideTextColor = order.side === 'Buy' ? 'text-green-700' : 'text-red-700';

  const formatNumber = (value) => 
    Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 });

  return (
    <div className={`rounded-lg shadow-md p-4 m-2 ${statusBgColor} border-l-4 ${statusBorderColor}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{order.symbol}</h3>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${sideTextColor}`}>{order.side}</span>
          <span className={`text-sm px-2 py-1 rounded ${order.status === 'win' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
            {order.status.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-sm text-gray-600">Order Type</p>
          <p className="font-medium">{order.orderType}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Quantity</p>
          <p className="font-medium">{order.qty}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Price</p>
          <p className="font-medium">${formatNumber(order.price)}</p>
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
    </div>
  );
};

export default OrderCard;