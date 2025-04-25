import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OrderCard from './OrderCard';
import TradingStats from './TradingStats';
import { useNavigate } from 'react-router-dom';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const navigate = useNavigate();

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('http://46.101.129.205:80/user/refresh_token/', {
        refresh_token: refreshToken
      });

      // Save the new access token
      localStorage.setItem('token', response.data.access_token);
      
      // Optionally update refresh token if returned by API
      if (response.data.refresh_token) {
        localStorage.setItem('refreshToken', response.data.refresh_token);
      }
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      navigate('/login');
      throw error;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      let token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://46.101.129.205/webhook/orders/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const sortedOrders = response.data.orders.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        
        // Check if error is due to unauthorized (token expired)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          try {
            // Try to refresh the token
            const newToken = await refreshAccessToken();
            
            // Retry the request with new token
            const retryResponse = await axios.get('http://46.101.129.205/webhook/orders/', {
              headers: {
                Authorization: `Bearer ${newToken}`
              }
            });
            
            const sortedOrders = response.data.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
            
            setOrders(sortedOrders);
          } catch (refreshError) {
            setError('Authentication failed. Please login again.');
          }
        } else {
          setError(error.message || 'Failed to fetch orders');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [navigate]);

  const handleToggle = (orderId) => {
    setExpandedOrderId(prevId => prevId === orderId ? null : orderId);
  };

  if (loading) {
    return <div className="text-center p-4">Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <div>Error: {error}</div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
      </div>
    );
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