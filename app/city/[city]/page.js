'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { mockFoodOfferings, defaultOfferings } from '../../data/mockData';
import { useCart } from '../../context/CartContext';

export default function CityPage() {
  const params = useParams();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    // Get the city parameter from the URL
    const city = params.city;
    if (!city) return;

    // Format city name (capitalize first letter)
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    setCityName(formattedCity);

    // Get food offerings for this city
    const cityLower = city.toLowerCase();
    const cityOfferings = mockFoodOfferings[cityLower] || defaultOfferings;
    
    // Simulate loading delay
    setTimeout(() => {
      setOfferings(cityOfferings || []); // Ensure we always set an array
      setLoading(false);
    }, 500);
  }, [params.city]);

  const handleAddToCart = (offering) => {
    addToCart(offering);
    alert('Item added to cart!');
  };

  return (
    <div className="container">
      <br />
      <Link href="/" className="back-link">← Back to Home</Link>
      
      <h1 className="heading">
        {cityName ? `Homemade Food in ${cityName}` : 'Loading...'}
      </h1>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading delicious food options...</p>
        </div>
      ) : (
        <div className="food-offerings">
          {offerings && offerings.length > 0 ? (
            <>
              <h2 className="offerings-subtitle">
                Available for pickup today:
              </h2>
              
              <div className="offerings-horizontal">
                {offerings.map(offering => (
                  <div key={offering.id} className="food-card">
                    <Link href={`/food/${offering.id}`} className="food-card-link">
                      <div className="food-image-placeholder">
                        <div className="placeholder-text">{offering.name[0]}</div>
                      </div>
                      <div className="food-details">
                        <h3 className="food-name">{offering.name}</h3>
                        <p className="food-cook">Made by: {offering.cook}</p>
                        <p className="food-cook">{offering.address}</p>
                        <p className="food-price">{offering.price}</p>
                      </div>
                    </Link>
                    <button className="order-button" onClick={() => handleAddToCart(offering)}>Order Now</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-offerings">
              <p>Sorry, we don not have any food offerings in {cityName} yet.</p>
              <p>Check back soon or try another city!</p>
              <Link href="/" className="back-home-button">
                Search Another City
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 