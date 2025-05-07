import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, getDoc, deleteDoc, serverTimestamp, documentId, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';

// Collection references
const WORKOUTS_COLLECTION = 'workouts';
const GOALS_COLLECTION = 'goals';
const USER_PROFILES_COLLECTION = 'user_profiles';

// Add a new workout
export const addWorkout = async (workout) => {
  try {
    const workoutData = {
      ...workout,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(firestore, WORKOUTS_COLLECTION), workoutData);
    console.log('Workout added with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding workout:', error);
    throw error;
  }
};

// Get all workouts for a user
export const getWorkouts = async (userId) => {
  try {
    const q = query(
      collection(firestore, WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const workouts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Parse route coordinates if needed
      if (data.routeCoordinates && typeof data.routeCoordinates === 'string') {
        try {
          data.routeCoordinates = JSON.parse(data.routeCoordinates);
        } catch (e) {
          console.error('Error parsing route coordinates:', e);
        }
      }
      
      workouts.push({
        id: doc.id,
        ...data
      });
    });
    
    return workouts;
  } catch (error) {
    console.error('Error getting workouts:', error);
    throw error;
  }
};

// Get workouts for a specific type
export const getWorkoutsByType = async (userId, type) => {
  try {
    const q = query(
      collection(firestore, WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      where('type', '==', type),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const workouts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Parse route coordinates if needed
      if (data.routeCoordinates && typeof data.routeCoordinates === 'string') {
        try {
          data.routeCoordinates = JSON.parse(data.routeCoordinates);
        } catch (e) {
          console.error('Error parsing route coordinates:', e);
        }
      }
      
      workouts.push({
        id: doc.id,
        ...data
      });
    });
    
    return workouts;
  } catch (error) {
    console.error('Error getting workouts by type:', error);
    throw error;
  }
};

// Get workout stats (total distance, duration, calories for a specific time period)
export const getWorkoutStats = async (userId, startDate, endDate) => {
  try {
    const q = query(
      collection(firestore, WORKOUTS_COLLECTION),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    
    let totalDistance = 0;
    let totalDuration = 0;
    let totalCalories = 0;
    let workoutCount = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalDistance += Number(data.distance) || 0;
      totalDuration += Number(data.duration) || 0;
      totalCalories += Number(data.calories) || 0;
      workoutCount++;
    });
    
    return {
      totalDistance,
      totalDuration,
      totalCalories,
      workoutCount
    };
  } catch (error) {
    console.error('Error getting workout stats:', error);
    throw error;
  }
};

// USER PROFILE FUNCTIONS

// Create or update a user profile
export const saveUserProfile = async (userId, profileData) => {
  try {
    // Use user ID as document ID for easy retrieval
    const userProfileRef = doc(firestore, USER_PROFILES_COLLECTION, userId);
    
    // Merge with any existing data
    await setDoc(userProfileRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log('User profile saved for ID:', userId);
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Get a user profile
export const getUserProfile = async (userId) => {
  try {
    const userProfileRef = doc(firestore, USER_PROFILES_COLLECTION, userId);
    const userProfileSnap = await getDoc(userProfileRef);
    
    if (userProfileSnap.exists()) {
      return {
        id: userProfileSnap.id,
        ...userProfileSnap.data()
      };
    } else {
      console.log('No profile found for user:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update specific user profile fields
export const updateUserProfile = async (userId, updates) => {
  try {
    const userProfileRef = doc(firestore, USER_PROFILES_COLLECTION, userId);
    
    await updateDoc(userProfileRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('User profile updated for ID:', userId);
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Add a new goal
export const addGoal = async (goal) => {
  try {
    const goalData = {
      ...goal,
      completed: false,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(firestore, GOALS_COLLECTION), goalData);
    console.log('Goal added with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

// Get all goals for a user
export const getGoals = async (userId) => {
  try {
    const q = query(
      collection(firestore, GOALS_COLLECTION),
      where('userId', '==', userId),
      orderBy('created', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const goals = [];
    
    querySnapshot.forEach((doc) => {
      goals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return goals;
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
};

// Update goal status
export const updateGoalStatus = async (goalId, completed) => {
  try {
    const goalRef = doc(firestore, GOALS_COLLECTION, goalId);
    await updateDoc(goalRef, {
      completed: completed
    });
    
    console.log('Goal updated');
    return true;
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
}; 