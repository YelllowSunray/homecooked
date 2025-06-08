'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import './meals.css';

const Meals = ({ city }) => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

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
    const fetchMeals = async () => {
      try {
        setLoading(true);
        setError(null);

        const mealsRef = collection(db, 'meals');
        let q;

        if (city) {
          // If city is provided, filter by city
          q = query(
            mealsRef,
            where('address.city', '==', city)
          );
        } else {
          // If no city is provided, get all meals
          q = query(mealsRef);
        }

        const querySnapshot = await getDocs(q);

        const mealsData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(meal => !isExpired(meal.createdAt, meal.daysFresh, meal.expiresAt)) // Filter out expired meals
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort in memory

        setMeals(mealsData);
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [city, currentTime]); // Add currentTime as dependency to refresh when time changes

  if (loading) {
    return <div className="meals-loading">Loading meals...</div>;
  }

  if (error) {
    return <div className="meals-error">Error: {error}</div>;
  }

  if (meals.length === 0) {
    return (
      <div className="meals-empty">
        {city ? `No meals available in ${city} yet.` : 'No meals available yet.'}
      </div>
    );
  }

  return (
    <div className="meals-container">
      <h2 className="meals-title">
        {city ? `Meals in ${city}` : 'Available Meals'}
      </h2>
      <div className="meals-grid">
        {meals.map((meal) => (
          <div key={meal.id} className="meal-card">
            {meal.imageUrl && (
              <div className="meal-image">
                <img src={meal.imageUrl} alt={meal.name} />
              </div>
            )}
            <div className="meal-content">
              <h3 className="meal-name">{meal.name}</h3>
              <p className="meal-description">{meal.description}</p>
              <div className="meal-details">
                <span className="meal-price">€{meal.price.toFixed(2)}</span>
                <span className="meal-freshness">
                  Fresh for {calculateRemainingDays(meal.createdAt, meal.daysFresh, meal.expiresAt)} days
                </span>
              </div>
              <div className="meal-cook">
                <p>Cooked by: {meal.userName}</p>
                {meal.address && (
                  <p className="meal-location">
                    {meal.address.city}, {meal.address.postcode}
                  </p>
                )}
                {meal.address?.phoneNumber && (
                  <p className="meal-phone">
                    Contact: {meal.address.phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Meals; 