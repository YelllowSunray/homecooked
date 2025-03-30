'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { mockFoodOfferings, defaultOfferings } from '../../data/mockData';
import { useCart } from '../../context/CartContext';

export default function FoodItemPage() {
  const params = useParams();
  const [foodItem, setFoodItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    // Get the food item ID from the URL
    const id = params.id;
    if (!id) return;

    // Find the food item with the matching ID
    const allFoodItems = [
      ...Object.values(mockFoodOfferings).flat(),
      ...defaultOfferings
    ];
    
    const item = allFoodItems.find(item => item.id.toString() === id);
    
    // Simulate loading delay
    setTimeout(() => {
      setFoodItem(item || null);
      setLoading(false);
    }, 300);
  }, [params.id]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading food details...</p>
        </div>
      </div>
    );
  }

  if (!foodItem) {
    return (
      <div className="container">
        <div className="not-found">
          <h1>Food Item Not Found</h1>
          <p>Sorry, we couldn't find the food item you're looking for.</p>
          <Link href="/" className="back-home-button">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(foodItem);
    alert('Item added to cart!');
  };

  return (
    <div className="container">
      <Link href="/" className="back-link">← Back to Home</Link>
      
      <div className="food-detail-container">
        <div className="food-detail-image">
          <div className="food-image-placeholder">
            <div className="placeholder-text">{foodItem.name[0]}</div>
          </div>
        </div>
        
        <div className="food-detail-info">
          <h1 className="food-detail-title">{foodItem.name}</h1>
          <p className="food-detail-cook">Made with ❤️ by: {foodItem.cook}</p>
          <p className="food-detail-price">{foodItem.price}</p>
          
          <div className="food-detail-description">
            <h2>About this dish</h2>
            <p>This delicious homemade {foodItem.name} is prepared with fresh ingredients by {foodItem.cook}, one of our community's talented home cooks.</p>
          </div>
          
          <div className="food-detail-ingredients">
            <h2>Ingredients</h2>
            <p>Fresh, locally-sourced ingredients</p>
          </div>
          
          <button className="order-button large" onClick={handleAddToCart}>Order Now</button>
        </div>
      </div>
    </div>
  );
} 