'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot, orderBy, deleteDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export default function Dashboard() {
  const router = useRouter();
  const [addressData, setAddressData] = useState({
    streetName: '',
    houseNumber: '',
    postcode: '',
    city: '',
    phoneNumber: ''
  });
  const [mealData, setMealData] = useState({
    name: '',
    price: '',
    description: '',
    daysFresh: '',
    image: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [userMeals, setUserMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [editingMeal, setEditingMeal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      console.log('Current user:', user.email); // Debug log
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchAddress = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching address for user:', user.email); // Debug log

        const addressesRef = collection(db, 'addresses');
        const q = query(addressesRef, where('email', '==', user.email));
        
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              const data = doc.data();
              console.log('Address data:', data); // Debug log
              setAddressData({
                streetName: data.streetName || '',
                houseNumber: data.houseNumber || '',
                postcode: data.postcode || '',
                city: data.city || '',
                phoneNumber: data.phoneNumber || ''
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error in onSnapshot:', error);
            setError(error.message);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching address:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchUserMeals = async () => {
      try {
        setLoadingMeals(true);
        const mealsRef = collection(db, 'meals');
        const q = query(
          mealsRef,
          where('userEmail', '==', user.email)
        );
        const querySnapshot = await getDocs(q);
        
        const meals = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort in memory
        
        setUserMeals(meals);
      } catch (err) {
        console.error('Error fetching user meals:', err);
        setError(err.message);
      } finally {
        setLoadingMeals(false);
      }
    };

    fetchAddress();
    fetchUserMeals();
  }, [user]);

  // Add timer effect for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMealChange = (e) => {
    const { name, value } = e.target;
    setMealData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || '' : value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setMealData(prev => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };

  const startCamera = async () => {
    try {
      // If camera is already showing, stop it first
      if (showCamera) {
        stopCamera();
        return;
      }

      setError(null);
      setShowCamera(true);
      setCameraReady(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check your permissions.');
      setShowCamera(false);
    }
  };

  const activateCamera = async () => {
    try {
      console.log('Starting camera activation...');
      
      // First try to get any camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        console.log('Setting video source...');
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play...');
          videoRef.current.play()
            .then(() => {
              console.log('Video playing successfully');
              setCameraStream(stream);
              setCameraReady(true);
            })
            .catch(err => {
              console.error('Error playing video:', err);
              setError('Failed to start video playback');
            });
        };
      } else {
        console.error('Video element not found');
        setError('Camera initialization failed');
      }
    } catch (err) {
      console.error('Camera activation error:', err);
      setError('Could not activate camera. Please check your permissions.');
      setShowCamera(false);
      setCameraReady(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCameraReady(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame on the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a File object from the blob with a unique name
          const fileName = `meal-${Date.now()}.jpg`;
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          
          // Update the meal data with the new image file
          setMealData(prev => ({
            ...prev,
            image: file
          }));

          // Show success message
          setMessage('Image captured successfully!');
          
          // Stop the camera
          stopCamera();
        } else {
          setError('Failed to capture image. Please try again.');
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to save address information');
      return;
    }

    try {
      setError(null);
      setMessage('');
      setLoading(true);

      const addressesRef = collection(db, 'addresses');
      const q = query(addressesRef, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      const addressDataToSave = {
        email: user.email,
        streetName: addressData.streetName,
        houseNumber: addressData.houseNumber,
        postcode: addressData.postcode,
        city: addressData.city,
        phoneNumber: addressData.phoneNumber,
        updatedAt: new Date().toISOString()
      };

      if (!querySnapshot.empty) {
        const docRef = doc(db, 'addresses', querySnapshot.docs[0].id);
        await updateDoc(docRef, addressDataToSave);
      } else {
        addressDataToSave.createdAt = new Date().toISOString();
        await addDoc(addressesRef, addressDataToSave);
      }
      setMessage('Address information saved successfully!');
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      console.log('Starting upload to Cloudinary...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

      console.log('Upload preset:', CLOUDINARY_CONFIG.uploadPreset);
      console.log('Cloud name:', CLOUDINARY_CONFIG.cloudName);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (data.secure_url) {
        console.log('Upload successful, URL:', data.secure_url);
        return data.secure_url;
      } else {
        console.error('Upload failed, response:', data);
        throw new Error(data.error?.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      setError(`Failed to upload image: ${error.message}`);
      throw error;
    }
  };

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to add a meal');
      return;
    }

    try {
      setError(null);
      setMessage('');
      setLoading(true);

      // Upload image to Cloudinary
      let imageUrl = '';
      if (mealData.image) {
        console.log('Uploading image:', mealData.image); // Debug log
        imageUrl = await uploadToCloudinary(mealData.image);
        console.log('Image URL:', imageUrl); // Debug log
      }

      // Create meal document without the image file
      const { image, ...mealDataWithoutImage } = mealData;

      // Add meal to Firestore
      const mealDoc = {
        ...mealDataWithoutImage,
        price: typeof mealData.price === 'string' ? parseFloat(mealData.price) : mealData.price,
        daysFresh: parseInt(mealData.daysFresh),
        imageUrl,
        createdAt: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        address: addressData
      };

      console.log('Saving meal document:', mealDoc); // Debug log
      const docRef = await addDoc(collection(db, 'meals'), mealDoc);
      console.log('Meal saved with ID:', docRef.id); // Debug log

      setMessage('Meal added successfully!');
      setMealData({
        name: '',
        price: '',
        description: '',
        daysFresh: '',
        image: null
      });
    } catch (err) {
      console.error('Error adding meal:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setMealData({
      name: meal.name,
      price: meal.price.toString(),
      description: meal.description,
      daysFresh: meal.daysFresh.toString(),
      image: null
    });
    setIsEditing(true);
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      setError(null);
      setMessage('');
      setLoading(true);

      // Delete the meal document
      await deleteDoc(doc(db, 'meals', mealId));
      
      // Update the local state
      setUserMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
      setMessage('Meal deleted successfully!');
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeal = async (e) => {
    e.preventDefault();
    if (!user || !editingMeal) {
      setError('You must be logged in to update a meal');
      return;
    }

    try {
      setError(null);
      setMessage('');
      setLoading(true);

      // Upload new image if one was selected
      let imageUrl = editingMeal.imageUrl;
      if (mealData.image) {
        imageUrl = await uploadToCloudinary(mealData.image);
      }

      // Create updated meal data without the image file
      const { image, ...mealDataWithoutImage } = mealData;

      // Update meal in Firestore
      const mealRef = doc(db, 'meals', editingMeal.id);
      const updatedMeal = {
        ...mealDataWithoutImage,
        price: typeof mealData.price === 'string' ? parseFloat(mealData.price) : mealData.price,
        daysFresh: parseInt(mealData.daysFresh),
        imageUrl,
        updatedAt: new Date().toISOString(),
        address: addressData
      };

      await updateDoc(mealRef, updatedMeal);
      
      // Update local state
      setUserMeals(prevMeals => 
        prevMeals.map(meal => 
          meal.id === editingMeal.id 
            ? { ...meal, ...updatedMeal }
            : meal
        )
      );

      setMessage('Meal updated successfully!');
      setEditingMeal(null);
      setIsEditing(false);
      setMealData({
        name: '',
        price: '',
        description: '',
        daysFresh: '',
        image: null
      });
    } catch (err) {
      console.error('Error updating meal:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingMeal(null);
    setIsEditing(false);
    setMealData({
      name: '',
      price: '',
      description: '',
      daysFresh: '',
      image: null
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err.message);
    }
  };

  const calculateRemainingDays = (createdAt, daysFresh) => {
    const createdDate = new Date(createdAt);
    
    // Calculate total days since creation
    const daysSinceCreation = Math.floor((currentTime - createdDate) / (24 * 60 * 60 * 1000));
    
    // Calculate remaining days
    const remainingDays = daysFresh - daysSinceCreation;
    
    return remainingDays;
  };

  const isExpired = (createdAt, daysFresh) => {
    return calculateRemainingDays(createdAt, daysFresh) <= 0;
  };

  const handleExtendFreshness = async (mealId, currentDaysFresh) => {
    try {
      setError(null);
      setMessage('');
      setLoading(true);

      const newDaysFresh = currentDaysFresh + 7; // Add 7 more days
      const mealRef = doc(db, 'meals', mealId);
      
      await updateDoc(mealRef, {
        daysFresh: newDaysFresh,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUserMeals(prevMeals => 
        prevMeals.map(meal => 
          meal.id === mealId 
            ? { ...meal, daysFresh: newDaysFresh, updatedAt: new Date().toISOString() }
            : meal
        )
      );

      setMessage('Freshness period extended successfully!');
    } catch (err) {
      console.error('Error extending freshness:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Welcome, {user?.displayName || user?.email}!</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        {/* Address Information Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Address Information</h2>
          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street Name</label>
                <input
                  type="text"
                  name="streetName"
                  value={addressData.streetName}
                  onChange={handleAddressChange}
                  required
                  placeholder="Enter street name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">House Number</label>
                <input
                  type="text"
                  name="houseNumber"
                  value={addressData.houseNumber}
                  onChange={handleAddressChange}
                  required
                  placeholder="Enter house number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Postcode</label>
                <input
                  type="text"
                  name="postcode"
                  value={addressData.postcode}
                  onChange={handleAddressChange}
                  required
                  placeholder="Enter postcode"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={addressData.city}
                  onChange={handleAddressChange}
                  required
                  placeholder="Enter city name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={addressData.phoneNumber}
                onChange={handleAddressChange}
                required
                placeholder="Enter your phone number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Address Information'}
            </button>
          </form>
        </div>

        {/* User's Posted Meals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Active Meals</h2>
          {loadingMeals ? (
            <div className="text-center py-4">Loading your meals...</div>
          ) : userMeals.filter(meal => !isExpired(meal.createdAt, meal.daysFresh)).length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              You don't have any active meals.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMeals
                .filter(meal => !isExpired(meal.createdAt, meal.daysFresh))
                .map((meal) => {
                  const remainingDays = calculateRemainingDays(meal.createdAt, meal.daysFresh);
                  
                  return (
                    <div key={meal.id} className="border rounded-lg p-4">
                      {meal.imageUrl && (
                        <div className="mb-4">
                          <img 
                            src={meal.imageUrl} 
                            alt={meal.name} 
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold mb-2">{meal.name}</h3>
                      <p className="text-gray-600 mb-2">{meal.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-blue-600">
                          €{meal.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-green-600">
                          {remainingDays} day{remainingDays !== 1 ? 's' : ''} remaining
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        <p>Posted on: {new Date(meal.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditMeal(meal)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>

        {/* Edit Meal Form - Only shows when editing */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Edit Meal</h2>
            <form onSubmit={handleUpdateMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Meal Name</label>
                <input
                  type="text"
                  name="name"
                  value={mealData.name}
                  onChange={handleMealChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Days Fresh</label>
                <input
                  type="number"
                  name="daysFresh"
                  value={mealData.daysFresh}
                  onChange={handleMealChange}
                  required
                  min="1"
                  placeholder="Enter number of days the meal stays fresh"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  name="price"
                  value={mealData.price}
                  onChange={handleMealChange}
                  required
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={mealData.description}
                  onChange={handleMealChange}
                  required
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meal Image</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    {showCamera ? 'Cancel Camera' : 'Take Photo'}
                  </button>
                </div>
                {showCamera && (
                  <div className="mt-4 relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: cameraReady ? 'block' : 'none' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {!cameraReady ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={activateCamera}
                          className="px-6 py-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                        >
                          Activate Camera
                        </button>
                      </div>
                    ) : (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <button
                          type="button"
                          onClick={captureImage}
                          className="px-6 py-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                        >
                          Capture
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {mealData.image && !showCamera && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Image selected: {mealData.image.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Meal'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expired Meals Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Expired Meals</h2>
          {loadingMeals ? (
            <div className="text-center py-4">Loading your meals...</div>
          ) : userMeals.filter(meal => isExpired(meal.createdAt, meal.daysFresh)).length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              You don't have any expired meals.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMeals
                .filter(meal => isExpired(meal.createdAt, meal.daysFresh))
                .map((meal) => {
                  const daysExpired = Math.abs(calculateRemainingDays(meal.createdAt, meal.daysFresh));
                  
                  return (
                    <div key={meal.id} className="border rounded-lg p-4 bg-gray-50">
                      {meal.imageUrl && (
                        <div className="mb-4">
                          <img 
                            src={meal.imageUrl} 
                            alt={meal.name} 
                            className="w-full h-48 object-cover rounded-lg opacity-75"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold mb-2">{meal.name}</h3>
                      <p className="text-gray-600 mb-2">{meal.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-gray-600">
                          €{meal.price.toFixed(2)}
                        </span>
                        <span className="text-sm text-red-600">
                          Expired {daysExpired} day{daysExpired !== 1 ? 's' : ''} ago
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        <p>Posted on: {new Date(meal.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExtendFreshness(meal.id, meal.daysFresh)}
                          className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        >
                          Reactivate Meal
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>

        {/* Add New Meal Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Add New Meal</h2>
          <form onSubmit={handleMealSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Meal Name</label>
              <input
                type="text"
                name="name"
                value={mealData.name}
                onChange={handleMealChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Days Fresh</label>
              <input
                type="number"
                name="daysFresh"
                value={mealData.daysFresh}
                onChange={handleMealChange}
                required
                min="1"
                placeholder="Enter number of days the meal stays fresh"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                name="price"
                value={mealData.price}
                onChange={handleMealChange}
                required
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={mealData.description}
                onChange={handleMealChange}
                required
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Meal Image</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {showCamera ? 'Cancel Camera' : 'Take Photo'}
                </button>
              </div>
              {showCamera && (
                <div className="mt-4 relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ display: cameraReady ? 'block' : 'none' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {!cameraReady ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={activateCamera}
                        className="px-6 py-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                      >
                        Activate Camera
                      </button>
                    </div>
                  ) : (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <button
                        type="button"
                        onClick={captureImage}
                        className="px-6 py-3 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                      >
                        Capture
                      </button>
                    </div>
                  )}
                </div>
              )}
              {mealData.image && !showCamera && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Image selected: {mealData.image.name}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Meal'}
              </button>
            </div>
          </form>
        </div>

        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
