import { initializeApp, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBgsw0XV_1MlIhv1whgbJuu3s0mBUqApEA",
  authDomain: "homecookedlive.firebaseapp.com",
  projectId: "homecookedlive",
  storageBucket: "homecookedlive.appspot.com",
  messagingSenderId: "537991850995",
  appId: "1:537991850995:web:09d489fa108fec79178086",
  measurementId: "G-V5GSY5WZSM"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    app = getApp();
  } else {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Initialize Firestore with persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize other services
export const auth = getAuth(app);
export const storage = getStorage(app);

// Set up auth persistence
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}

// Initialize Analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

export { db, analytics }; 