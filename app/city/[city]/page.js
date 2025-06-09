'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useCart } from '../../context/CartContext';
import { useSession } from 'next-auth/react';
import './page.css';

export default function CityPage() {
  const params = useParams();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState('');
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { data: session, status } = useSession();

  const calculateRemainingDays = (createdAt, daysFresh, expiresAt) => {
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      const today = new Date();
      // Set both dates to start of day for accurate day calculation
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfExpiration = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
      
      const diffTime = startOfExpiration - startOfToday;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    const createdDate = new Date(createdAt);
    const today = new Date();
    // Set both dates to start of day for accurate day calculation
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfCreation = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
    
    const daysSinceCreation = Math.floor((startOfToday - startOfCreation) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysFresh - daysSinceCreation);
  };

  const isExpired = (createdAt, daysFresh, expiresAt) => {
    return calculateRemainingDays(createdAt, daysFresh, expiresAt) === 0;
  };

  useEffect(() => {
    const city = params.city;
    if (!city) return;

    // Format city name (capitalize first letter) for display only
    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    setCityName(formattedCity);

    try {
      // Query meals for this city using the nested address.city field
      // Get all meals and filter by city case-insensitively
      const q = query(collection(db, 'meals'));
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const mealsList = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .filter(meal => 
              // Case-insensitive city comparison
              meal.address?.city?.toLowerCase() === city.toLowerCase() &&
              !isExpired(meal.createdAt, meal.daysFresh, meal.expiresAt)
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort in memory
          setOfferings(mealsList);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching meals:', error);
          setError('Failed to load meals. Please try again later.');
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up meals listener:', error);
      setError('Failed to load meals. Please try again later.');
      setLoading(false);
    }
  }, [params.city]);

  const handleAddToCart = (offering) => {
    if (!session) {
      alert('Please log in to add items to your cart');
      return;
    }
    addToCart(offering);
    alert('Item added to cart!');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading meals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <br />
      <Link href="/" className="back-link">← Back to Home</Link>
      
      <h1 className="heading">
        {cityName ? `Homemade Food in ${cityName}` : 'Loading...'}
      </h1>
      
      {offerings.length === 0 ? (
        <div className="no-offerings">
          <p>No fresh food offerings available in {cityName} at the moment.</p>
          <p>Check back later or try another city!</p>
        </div>
      ) : (
        <div className="food-offerings">
          <h2 className="offerings-subtitle">
            Available for pickup today:
          </h2>
          
          <div className="offerings-horizontal">
            {offerings.map(offering => (
              <div key={offering.id} className="food-card">
                <Link href={`/food/${offering.id}`} className="food-card-link">
                  {offering.imageUrl ? (
                    <img 
                      src={offering.imageUrl} 
                      alt={offering.name} 
                      className="food-image"
                    />
                  ) : (
                    <div className="food-image-placeholder">
                      <div className="placeholder-text">{offering.name[0]}</div>
                    </div>
                  )}
                  <div className="food-details">
                    <h3 className="food-name">{offering.name}</h3>
                    <p className="food-description">{offering.description}</p>
                    <div className="food-info">
                      <span className="food-price">€{offering.price.toFixed(2)}</span>
                      <span className="food-freshness">
                        Fresh for {calculateRemainingDays(offering.createdAt, offering.daysFresh, offering.expiresAt)} days
                      </span>
                    </div>
                    <div className="food-cook">
                      <p>Cooked by: {offering.userName}</p>
                      {offering.address && (
                        <p className="food-location">
                          {offering.address.city}, {offering.address.postcode}
                        </p>
                      )}
                      {offering.address?.phoneNumber && (
                        <p className="food-phone">
                          Contact: {offering.address.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                <button 
                  className="order-button" 
                  onClick={() => handleAddToCart(offering)}
                >
                  Order Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 