// src/components/Header.jsx
import React from 'react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Trading Strategy Dashboard</h1>
            <p className="text-sm opacity-80">PineScript Signal Testing Results</p>
          </div>
          {/* <div className="flex space-x-2">
            <button className="bg-white text-blue-800 px-4 py-2 rounded-md shadow hover:bg-blue-50 transition-colors">
              Refresh Data
            </button>
            <button className="bg-blue-700 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600 transition-colors">
              Settings
            </button>
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Header;