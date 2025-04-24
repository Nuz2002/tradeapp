import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Option 1: Silent validation - just check if token is valid
        // This could be a lightweight API call to verify the token
        await axios.get('http://46.101.129.205:80/auth/validate', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setIsAuthenticated(true);
      } catch (error) {
        // Token invalid or expired, try to refresh
        if (refreshToken) {
          try {
            const response = await axios.post('http://46.101.129.205:80/auth/refresh/', {
              refresh_token: refreshToken
            });
            
            // Save the new tokens
            localStorage.setItem('token', response.data.access_token);
            if (response.data.refresh_token) {
              localStorage.setItem('refreshToken', response.data.refresh_token);
            }
            
            setIsAuthenticated(true);
          } catch (refreshError) {
            // Failed to refresh, user needs to log in again
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
          }
        } else {
          // No refresh token available
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [location.pathname]);

  if (isLoading) {
    // You could add a loading spinner here
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;