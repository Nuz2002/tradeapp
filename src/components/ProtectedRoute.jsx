import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Just attempt a real, protected API call to verify token validity
        // http://46.101.129.205/
        await axios.get('http://207.154.244.239/webhook/orders/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setIsAuthenticated(true);
      } catch (error) {
        // If token is invalid or expired, try refresh
        if (refreshToken) {
          try {
            const response = await axios.post('http://207.154.244.239/users/refresh-token/', {
              refresh_token: refreshToken
            });

            // Save new tokens
            localStorage.setItem('token', response.data.access_token);
            if (response.data.refresh_token) {
              localStorage.setItem('refreshToken', response.data.refresh_token);
            }

            setIsAuthenticated(true);
          } catch (refreshError) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
          }
        } else {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
