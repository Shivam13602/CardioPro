import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  RECENT_WORKOUTS: 'cardiopro_recent_workouts',
  USER_PREFERENCES: 'cardiopro_user_preferences',
  LAST_WORKOUT: 'cardiopro_last_workout',
};

// Save recent workouts (keeps only the last 10)
export const saveRecentWorkout = async (workout) => {
  try {
    if (!workout) {
      console.error('Cannot save null or undefined workout');
      return false;
    }
    
    // Ensure workout has an ID
    if (!workout.id) {
      workout.id = 'local_' + new Date().getTime();
    }
    
    // Format numeric fields to display properly
    if (typeof workout.distance === 'number') {
      workout.distance = (workout.distance / 1000).toFixed(2); // Convert to km and format
    }
    
    // Create user-specific key with definite userId
    const userId = workout.userId || 'anonymous';
    const userSpecificKey = `${STORAGE_KEYS.RECENT_WORKOUTS}_${userId}`;
    
    console.log(`Saving workout for user: ${userId} with key: ${userSpecificKey}`);
    
    // Get existing workouts for this specific user
    const existingWorkoutsJSON = await AsyncStorage.getItem(userSpecificKey);
    const existingWorkouts = existingWorkoutsJSON ? JSON.parse(existingWorkoutsJSON) : [];
    
    // Check for duplicate - don't add if same ID already exists
    const isDuplicate = existingWorkouts.some(w => w.id === workout.id);
    if (isDuplicate) {
      console.log(`Workout with ID ${workout.id} already exists, skipping save`);
      return true;
    }
    
    // Add new workout at the beginning and limit to 10
    const updatedWorkouts = [workout, ...existingWorkouts].slice(0, 10);
    
    // Save back to storage with user-specific key
    await AsyncStorage.setItem(userSpecificKey, JSON.stringify(updatedWorkouts));
    
    // Also save as last workout for quick access (with user-specific key)
    const userLastWorkoutKey = `${STORAGE_KEYS.LAST_WORKOUT}_${userId}`;
    await AsyncStorage.setItem(userLastWorkoutKey, JSON.stringify(workout));
    
    // Always log the saved workout for debugging
    console.log('Workout saved successfully:', {
      id: workout.id,
      type: workout.type,
      distance: workout.distance,
      duration: workout.duration,
      date: workout.date,
      userId: workout.userId
    });
    
    return true;
  } catch (error) {
    console.error('Error saving recent workout:', error);
    return false;
  }
};

// Get recent workouts
export const getRecentWorkouts = async (userId) => {
  try {
    // If userId is provided, use user-specific key
    const storageKey = userId 
      ? `${STORAGE_KEYS.RECENT_WORKOUTS}_${userId}` 
      : STORAGE_KEYS.RECENT_WORKOUTS;
      
    console.log(`Fetching workouts with key: ${storageKey}`);
    
    const workoutsJSON = await AsyncStorage.getItem(storageKey);
    const workouts = workoutsJSON ? JSON.parse(workoutsJSON) : [];
    
    console.log(`Found ${workouts.length} workouts for ${userId || 'anonymous'}`);
    return workouts;
  } catch (error) {
    console.error('Error getting recent workouts:', error);
    return [];
  }
};

// Get last workout
export const getLastWorkout = async (userId) => {
  try {
    // If userId is provided, use user-specific key
    const storageKey = userId 
      ? `${STORAGE_KEYS.LAST_WORKOUT}_${userId}` 
      : STORAGE_KEYS.LAST_WORKOUT;
      
    const workoutJSON = await AsyncStorage.getItem(storageKey);
    return workoutJSON ? JSON.parse(workoutJSON) : null;
  } catch (error) {
    console.error('Error getting last workout:', error);
    return null;
  }
};

// Save user preferences
export const saveUserPreferences = async (preferences, userId) => {
  try {
    // Use user-specific key if userId is provided
    const storageKey = userId 
      ? `${STORAGE_KEYS.USER_PREFERENCES}_${userId}` 
      : STORAGE_KEYS.USER_PREFERENCES;
      
    // Get existing preferences
    const existingPrefsJSON = await AsyncStorage.getItem(storageKey);
    const existingPrefs = existingPrefsJSON ? JSON.parse(existingPrefsJSON) : {};
    
    // Merge with new preferences
    const updatedPrefs = { ...existingPrefs, ...preferences };
    
    // Save back to storage
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedPrefs));
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

// Get user preferences
export const getUserPreferences = async (userId) => {
  try {
    // Use user-specific key if userId is provided
    const storageKey = userId 
      ? `${STORAGE_KEYS.USER_PREFERENCES}_${userId}` 
      : STORAGE_KEYS.USER_PREFERENCES;
      
    const preferencesJSON = await AsyncStorage.getItem(storageKey);
    return preferencesJSON ? JSON.parse(preferencesJSON) : {};
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
};

// Clear all app data (for logout, etc.)
export const clearAllData = async (userId) => {
  try {
    if (userId) {
      // If userId is provided, only clear data for that user
      const userKeys = Object.values(STORAGE_KEYS).map(key => `${key}_${userId}`);
      await AsyncStorage.multiRemove(userKeys);
    } else {
      // Otherwise clear all keys
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    }
    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
}; 