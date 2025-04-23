import React, { useEffect, useState } from 'react';
import OrderCard from './OrderCard';
import TradingStats from './TradingStats';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://46.101.129.205:80/order');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        const sortedOrders = data.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleToggle = (orderId) => {
    setExpandedOrderId(prevId => prevId === orderId ? null : orderId);
  };

  if (loading) {
    return <div className="text-center p-4">Loading orders...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <TradingStats orders={orders} />
      <div className="mt-4 space-y-3">
        {orders.map(order => (
          <OrderCard 
            key={order.id}
            order={order}
            isExpanded={order.id === expandedOrderId}
            onToggle={() => handleToggle(order.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default OrdersList;