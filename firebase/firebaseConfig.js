// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // Changed here
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
  onSnapshot,
  Timestamp,
  increment
} from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field =>
    !firebaseConfig[field] || firebaseConfig[field].includes('your-')
  );

  if (missingFields.length > 0) {
    console.error('Firebase configuration error - missing fields:', missingFields);
    console.error('Please update firebaseConfig.js with your actual Firebase project credentials');
    return false;
  }
  return true;
};

// Initialize Firebase only if config is valid
let app, auth, firestore, analytics;

try {
  if (validateFirebaseConfig()) {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);

    // Initialize Firebase Auth with AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

    // Initialize Firestore
    firestore = getFirestore(app);

    // Only use analytics on web platforms
    analytics = Platform.OS === "web" ? getAnalytics(app) : null;

    console.log('Firebase initialized successfully');
  } else {
    console.error('Firebase initialization skipped due to missing configuration');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

// Export with null checks
export { auth, firestore };

// Export commonly used Firestore functions
export {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  addDoc,
  onSnapshot,
  Timestamp,
  increment
};

// Export the app instance as default
export default app;
