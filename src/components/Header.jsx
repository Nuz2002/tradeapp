import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  return (
    <header className="bg-gradient-to-r from-cyan-700 to-blue-600 text-white p-4 shadow-xl">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-cyan-100 drop-shadow-md">
              Trading Strategy Dashboard
            </h1>
            <p className="text-sm text-cyan-50 mt-1">
              PineScript Signal Testing Results for Solana
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg
              hover:bg-cyan-500 transition duration-300
              shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;