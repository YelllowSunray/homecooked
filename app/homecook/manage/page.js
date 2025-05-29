'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '../../../firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function ManageMeals() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meals, setMeals] = useState([]);
  const [newMeal, setNewMeal] = useState({
    name: '',
    price: '',
    description: '',
    city: '',
    image: null
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchMeals();
  }, [user]);

  const fetchMeals = async () => {
    try {
      const q = query(collection(db, 'meals'), where('cookId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const mealsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMeals(mealsList);
    } catch (err) {
      console.error('Error fetching meals:', err);
      setError('Failed to load meals');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setNewMeal({ ...newMeal, image: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imageUrl = '';
      if (newMeal.image) {
        const imageRef = ref(storage, `meals/${user.uid}/${Date.now()}_${newMeal.image.name}`);
        await uploadBytes(imageRef, newMeal.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const mealData = {
        name: newMeal.name,
        price: parseFloat(newMeal.price),
        description: newMeal.description,
        city: newMeal.city.toLowerCase(),
        image: imageUrl,
        cookId: user.uid,
        cookName: user.displayName || 'Anonymous Cook',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'meals'), mealData);
      setNewMeal({
        name: '',
        price: '',
        description: '',
        city: '',
        image: null
      });
      fetchMeals();
    } catch (err) {
      console.error('Error adding meal:', err);
      setError('Failed to add meal');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container">
      <h1 className="heading">Manage Your Meals</h1>
      
      <div className="meal-form-container">
        <h2>Add New Meal</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="meal-form">
          <div className="form-group">
            <label htmlFor="name">Meal Name</label>
            <input
              type="text"
              id="name"
              value={newMeal.name}
              onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (€)</label>
            <input
              type="number"
              id="price"
              value={newMeal.price}
              onChange={(e) => setNewMeal({ ...newMeal, price: e.target.value })}
              required
              min="0"
              step="0.01"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              value={newMeal.city}
              onChange={(e) => setNewMeal({ ...newMeal, city: e.target.value })}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={newMeal.description}
              onChange={(e) => setNewMeal({ ...newMeal, description: e.target.value })}
              required
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Meal Image</label>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              accept="image/*"
              className="form-input"
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Adding Meal...' : 'Add Meal'}
          </button>
        </form>
      </div>

      <div className="meals-list">
        <h2>Your Meals</h2>
        <div className="meals-grid">
          {meals.map((meal) => (
            <div key={meal.id} className="meal-card">
              {meal.image && (
                <img src={meal.image} alt={meal.name} className="meal-image" />
              )}
              <div className="meal-details">
                <h3>{meal.name}</h3>
                <p className="meal-price">€{meal.price.toFixed(2)}</p>
                <p className="meal-city">{meal.city}</p>
                <p className="meal-description">{meal.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 