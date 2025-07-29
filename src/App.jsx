import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute'; // <-- import it
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import SidebarLayout from './components/SidebarLayout'; // Will create this

function App() {
  return (
    <Router basename="/tradeapp">
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}


export default App;
