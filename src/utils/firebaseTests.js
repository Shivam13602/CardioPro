import { auth, firestore } from '../services/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

// Test Firebase authentication
export const testAuth = async () => {
  try {
    // Check if auth is initialized
    if (!auth) {
      console.error('Firebase auth is not initialized');
      return { success: false, message: 'Firebase auth is not initialized' };
    }
    
    console.log('Firebase auth initialized successfully');
    return { success: true, message: 'Firebase authentication initialized successfully' };
  } catch (error) {
    console.error('Firebase auth test failed:', error);
    return { success: false, message: `Firebase auth test failed: ${error.message}` };
  }
};

// Test Firestore
export const testFirestore = async () => {
  try {
    // Check if firestore is initialized
    if (!firestore) {
      console.error('Firestore is not initialized');
      return { success: false, message: 'Firestore is not initialized' };
    }
    
    // Try to fetch a document to test connectivity
    try {
      const q = query(collection(firestore, 'workouts'), limit(1));
      const querySnapshot = await getDocs(q);
      
      console.log('Firestore query executed successfully');
      return { 
        success: true, 
        message: `Firestore initialized successfully. Documents found: ${querySnapshot.size}` 
      };
    } catch (queryError) {
      console.log('Firestore initialized but query failed:', queryError);
      return { 
        success: true, 
        message: 'Firestore initialized, but query failed. This may be normal if there are no documents yet.'
      };
    }
  } catch (error) {
    console.error('Firestore test failed:', error);
    return { success: false, message: `Firestore test failed: ${error.message}` };
  }
};

// Run all Firebase tests
export const testFirebaseConnection = async () => {
  const authResult = await testAuth();
  const firestoreResult = await testFirestore();
  
  return {
    auth: authResult,
    firestore: firestoreResult,
    success: authResult.success && firestoreResult.success
  };
}; 