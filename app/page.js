'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const cityInputRef = useRef(null);
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!city.trim()) {
      return; // Don't submit if empty
    }
    
    setIsLoading(true);
    
    // Navigate to the city page
    const citySlug = city.trim().toLowerCase();
    router.push(`/city/${citySlug}`);
  };

  return (
    <div className="container">
      <br />
      <h1 className="heading">
        Delicious Homemade Food, Ready for Pickup
      </h1>
      <h3 className="menuDescription">
        Discover amazing home-cooked meals from local cooks in your community. Order now for convenient pickup.
      </h3>
      
      {/* City Form */}
      <form className="address-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="city" className="address-label">Which city are you in?</label>
          <div className="input-wrapper">
            <input 
              type="text" 
              id="city" 
              name="city" 
              placeholder="Enter your city" 
              className="address-input" 
              ref={cityInputRef}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <p className="help-text">We will show you delicious homemade food available in your area</p>
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Find Food Near Me'}
        </button>
      </form>
      
      {/* Popular Cities Section */}
      <div className="popular-cities">
        <h2 className="popular-cities-title">Popular Cities</h2>
        <div className="cities-grid">
          {['Hilversum', 'Rotterdam', 'Utrecht', 'Eindhoven'].map(city => (
            <div 
              key={city} 
              className="city-card" 
              onClick={() => {
                setCity(city);
                router.push(`/city/${city.toLowerCase()}`);
              }}
            >
              <div className="city-name">{city}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimplerAddressForm() {
  return (
    <form className="address-form">
      <div className="form-group">
        <label>Street Address</label>
        <input type="text" className="address-input" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>City</label>
          <input type="text" className="address-input" />
        </div>
        <div className="form-group">
          <label>State</label>
          <input type="text" className="address-input" />
        </div>
        <div className="form-group">
          <label>ZIP</label>
          <input type="text" className="address-input" />
        </div>
      </div>
      <button type="submit">Find Food Near Me</button>
    </form>
  );
}
