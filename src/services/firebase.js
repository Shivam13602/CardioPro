import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyClvlMwcu-K5VUsMSZyZVxQQS87pfhNLws",
    authDomain: "cardiopro-f4448.firebaseapp.com",
    projectId: "cardiopro-f4448",
    storageBucket: "cardiopro-f4448.appspot.com", 
    messagingSenderId: "208170132638",
    appId: "1:208170132638:android:ad31afd3357911cc4a478f"
};

// Initialize Firebase with error handling
let app, auth, firestore;

try {
  console.log('Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  // Initialize Firebase Auth with AsyncStorage persistence
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('Firebase Auth initialized successfully');
  } catch (authError) {
    console.error('Error initializing Firebase Auth:', authError);
    auth = null;
  }
  
  // Initialize Firestore
  try {
    firestore = getFirestore(app);
    console.log('Firestore initialized successfully');
  } catch (firestoreError) {
    console.error('Error initializing Firestore:', firestoreError);
    firestore = null;
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  app = null;
  auth = null;
  firestore = null;
}

export { auth, firestore };
export default app; 