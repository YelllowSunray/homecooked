'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, query, getDocs, orderBy, where, onSnapshot } from 'firebase/firestore';
import './meals.css';
import Image from 'next/image';

const Meals = ({ city }) => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userAddresses, setUserAddresses] = useState({}); // Store address data for each user

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

  const getFreshnessStatus = (meal) => {
    const now = new Date();
    
    // Check if meal was reactivated
    if (meal.updatedAt) {
      const reactivationTime = new Date(meal.updatedAt);
      const hoursSinceReactivation = (now - reactivationTime) / (1000 * 60 * 60);
      
      // If reactivated within last 3 hours, it's warm
      if (hoursSinceReactivation <= 3) {
        return 'Fresh & Warm';
      }
    }
    
    // If not reactivated or reactivation is older than 3 hours, check creation time
    const createdTime = new Date(meal.createdAt);
    const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
    
    return hoursSinceCreation <= 3 ? 'Fresh & Warm' : 'Fresh & Refrigerated';
  };

  // Fetch address data for all users who have meals
  useEffect(() => {
    const fetchUserAddresses = async (userEmails) => {
      try {
        const addressesRef = collection(db, 'addresses');
        const q = query(addressesRef, where('email', 'in', userEmails));
        const querySnapshot = await getDocs(q);
        
        const addresses = {};
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          addresses[data.email] = data;
        });
        
        setUserAddresses(addresses);
      } catch (err) {
        console.error('Error fetching user addresses:', err);
      }
    };

    // Get unique user emails from meals
    const userEmails = [...new Set(meals.map(meal => meal.userEmail))];
    if (userEmails.length > 0) {
      fetchUserAddresses(userEmails);
    }
  }, [meals]);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true);
        setError(null);

        const mealsRef = collection(db, 'meals');
        let q;

        if (city) {
          q = query(
            mealsRef,
            where('address.city', '==', city)
          );
        } else {
          q = query(mealsRef);
        }

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const mealsData = querySnapshot.docs
              .map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data
                };
              })
              .filter(meal => !isExpired(meal.createdAt, meal.daysFresh, meal.expiresAt))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setMeals(mealsData);
          },
          (error) => {
            console.error('Error in meals snapshot:', error);
            setError(error.message);
          }
        );

        setLoading(false);
        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching meals:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMeals();
  }, [city]);

  // Add debug log for meals state
  useEffect(() => {
    console.log('Current meals state:', meals);
  }, [meals]);

  if (loading) {
    return <div className="meals-loading">Loading meals...</div>;
  }

  if (error) {
    return <div className="meals-error">Error: {error}</div>;
  }

  if (meals.length === 0) {
    console.log('No meals to display');
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
        {meals.map((meal) => {
          const freshnessStatus = getFreshnessStatus(meal);
          const isWarm = freshnessStatus === 'Fresh & Warm';
          const userAddress = userAddresses[meal.userEmail];
          const shouldShowProfile = userAddress?.profilePicture && userAddress?.isProfilePublic;
          
          // Debug log for each meal being rendered
          console.log('Rendering meal:', {
            id: meal.id,
            userName: meal.userName,
            hasProfilePicture: !!meal.address?.profilePicture,
            isProfilePublic: meal.address?.isProfilePublic,
            address: meal.address
          });
          
          return (
            <div key={meal.id} className="meal-card">
              <div className="relative">
                {meal.imageUrl && (
                  <div className="meal-image">
                    <img src={meal.imageUrl} alt={meal.name} />
                  </div>
                )}
                <div className={`freshness-status ${isWarm ? 'warm' : 'refrigerated'}`}>
                  {freshnessStatus}
                </div>
                {shouldShowProfile && (
                  <div className="absolute bottom-2 right-2 w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                    <img 
                      src={userAddress.profilePicture} 
                      alt={`${meal.userName}'s profile`}
                      className="w-full h-full object-cover"
                      onError={(e) => console.error('Error loading profile picture:', e)}
                    />
                  </div>
                )}
              </div>
              <div className="meal-content">
                <h3 className="meal-name">{meal.name}</h3>
                <p className="meal-description">{meal.description}</p>
                <div className="meal-details">
                  <div className="meal-price-info">
                    <span className="meal-price">€{meal.price.toFixed(2)}</span>
                    {meal.quantity && (
                      <span className="meal-quantity">{meal.quantity}</span>
                    )}
                  </div>
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
          );
        })}
      </div>
    </div>
  );
};

export default Meals; 