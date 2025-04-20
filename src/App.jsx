import React from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import OrdersList from './components/OrderList';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <OrdersList />
    </div>
  );
}

export default App;