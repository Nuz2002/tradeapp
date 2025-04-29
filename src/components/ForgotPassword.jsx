import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// Forgot Password Component
export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

   // Inside your handleSubmit function:
    try {
        await axios.post('http://207.154.244.239/users/request-password-reset/', { email });
        setSuccess(true);
    } catch (err) {
        setError(
        err.response?.data?.message ||
        err.response?.data?.detail || // use 'detail' if your backend uses DRF-style error messages
        'Password reset failed'
        );
    }
  
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-start pt-24 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 px-4 sm:px-0">
        {/* Logo Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h2 className="text-3xl font-light text-gray-900">
            Reset Your Password
          </h2>
        </div>

        {/* Form Container */}
        <div className="bg-white p-8 shadow-xl rounded-2xl transition-all duration-300 hover:shadow-2xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="text-gray-600">Password reset instructions sent to your email.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Reset Password'}
              </button>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Remember your password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

