import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import OrderList from './components/OrderList';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute'; // <-- import it

function Layout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <Router basename="/tradeapp">
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Layout Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OrderList />} />
            {/* Add more protected nested routes here */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
