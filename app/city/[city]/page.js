'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useCart } from '../../context/CartContext';
import { useSession } from 'next-auth/react';
import './page.css';
import Image from 'next/image';

export default function CityPage() {
  const params = useParams();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState('');
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { data: session, status } = useSession();
  const [userAddresses, setUserAddresses] = useState({});

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

    // Get unique user emails from offerings
    const userEmails = [...new Set(offerings.map(offering => offering.userEmail))];
    if (userEmails.length > 0) {
      fetchUserAddresses(userEmails);
    }
  }, [offerings]);

  useEffect(() => {
    const city = params.city;
    if (!city) return;

    const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    setCityName(formattedCity);

    try {
      const q = query(collection(db, 'meals'));
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const mealsList = querySnapshot.docs
            .map(doc => {
              const data = doc.data();
              // Debug log for each meal's profile picture data
              console.log('City page meal data:', {
                id: doc.id,
                userName: data.userName,
                profilePicture: data.address?.profilePicture,
                isProfilePublic: data.address?.isProfilePublic,
                address: data.address
              });
              return {
                id: doc.id,
                ...data
              };
            })
            .filter(meal => 
              meal.address?.city?.toLowerCase() === city.toLowerCase() &&
              !isExpired(meal.createdAt, meal.daysFresh, meal.expiresAt)
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOfferings(mealsList);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching meals:', error);
          setError('Failed to load meals. Please try again later.');
          setLoading(false);
        }
      );

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
            {offerings.map(offering => {
              const freshnessStatus = getFreshnessStatus(offering);
              const isWarm = freshnessStatus === 'Fresh & Warm';
              const userAddress = userAddresses[offering.userEmail];
              const shouldShowProfile = userAddress?.profilePicture && userAddress?.isProfilePublic;
              
              return (
                <div key={offering.id} className="food-card">
                  <Link href={`/food/${offering.id}`} className="food-card-link">
                    <div className="relative">
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
                      <div className={`freshness-status ${isWarm ? 'warm' : 'refrigerated'}`}>
                        {freshnessStatus}
                      </div>
                      {/* Debug log for profile picture condition */}
                      {console.log('Profile picture condition:', {
                        hasPicture: !!offering.address?.profilePicture,
                        isPublic: offering.address?.isProfilePublic,
                        shouldShow: !!offering.address?.profilePicture && offering.address?.isProfilePublic
                      })}
                      {shouldShowProfile && (
                        <div className="absolute bottom-2 right-2 w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                          <img 
                            src={userAddress.profilePicture} 
                            alt={`${offering.userName}'s profile`}
                            className="w-full h-full object-cover"
                            onError={(e) => console.error('Error loading profile picture:', e)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="food-details">
                      <h3 className="food-name">{offering.name}</h3>
                      <p className="food-description">{offering.description}</p>
                      <div className="food-info">
                        <div className="food-price-info">
                          <span className="food-price">€{offering.price.toFixed(2)}</span>
                          {offering.quantity && (
                            <span className="food-quantity">{offering.quantity}</span>
                          )}
                        </div>
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 