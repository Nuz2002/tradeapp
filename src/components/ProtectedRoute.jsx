import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axiosInstance from "./axiosInstance"; // your custom axios with interceptors

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");

      // Basic presence check before sending API calls
      if (!token || !refreshToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Let axiosInstance handle token and refresh logic
        await axiosInstance.get("/api/v1/system/status/");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
