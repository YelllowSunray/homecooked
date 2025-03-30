'use client';

import { useState } from 'react';
import Link from 'next/link';
import './page.css';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      // Here you would typically call your registration API
      // For demo purposes, we'll just simulate a registration
      setTimeout(() => {
        console.log('Registering with:', { email, password });
        // Simulate successful registration
        alert('Registration successful! You can now log in.');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      setLoading(false);
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="container">
      <div className="signup-container">
        <h1 className="signup-title">Sign Up for HomeCook</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="signup-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="signup-input"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="login-prompt">
          Already have an account? <Link href="/login" className="login-link">Login</Link>
        </div>
      </div>
    </div>
  );
}
