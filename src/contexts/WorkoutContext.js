import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

import { 
  addWorkout as addWorkoutToDb, 
  getWorkouts as getWorkoutsFromDb,
  getWorkoutsByType as getWorkoutsByTypeFromDb,
  getWorkoutStats as getWorkoutStatsFromDb,
  addGoal as addGoalToDb,
  getGoals as getGoalsFromDb,
  updateGoalStatus as updateGoalStatusFromDb
} from '../services/firestoreDatabase';

// Create a context for workout data
const WorkoutContext = createContext();

// Custom hook to use the workout context
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load workouts when user changes
  useEffect(() => {
    if (user) {
      loadWorkouts();
      loadGoals();
    } else {
      setWorkouts([]);
      setGoals([]);
    }
  }, [user]);

  // Load all workouts for the current user
  const loadWorkouts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let fetchedWorkouts = [];
      
      try {
        fetchedWorkouts = await getWorkoutsFromDb(user.uid);
      } catch (firestoreError) {
        console.error('Error fetching workouts from Firestore:', firestoreError);
        
        // If Firebase fails, use sample workouts or empty array
        if (firestoreError.toString().includes('Missing or insufficient permissions')) {
          console.log('Using empty workout list due to Firebase permission issues');
          fetchedWorkouts = [];
          setError('Using local data due to database access issues');
        } else {
          throw firestoreError;
        }
      }
      
      setWorkouts(fetchedWorkouts);
      setError(null);
    } catch (error) {
      console.error('Error loading workouts:', error);
      setError('Failed to load workouts: ' + error.message);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load all goals for the current user
  const loadGoals = async () => {
    if (!user) return;
    
    try {
      const fetchedGoals = await getGoalsFromDb(user.uid);
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
      setError('Failed to load goals: ' + error.message);
    }
  };

  // Add a new workout
  const addWorkout = async (workoutData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const workout = {
        ...workoutData,
        userId: user.uid,
        date: new Date().toISOString(),
      };
      
      const workoutId = await addWorkoutToDb(workout);
      
      const newWorkout = { ...workout, id: workoutId };
      setWorkouts(prev => [newWorkout, ...prev]);
      
      return workoutId;
    } catch (error) {
      console.error('Error adding workout:', error);
      setError('Failed to add workout: ' + error.message);
      throw error;
    }
  };

  // Save workout - alias for addWorkout for backward compatibility
  const saveWorkout = async (workoutData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const workout = {
        ...workoutData,
        userId: user.uid,
        date: new Date().toISOString(),
      };
      
      // Import AsyncStorage functions
      const { saveRecentWorkout } = require('../services/asyncStorage');
      
      let workoutId = null;
      try {
        // Try to save to Firebase first
        workoutId = await addWorkoutToDb(workout);
        console.log('Workout saved to Firebase with ID:', workoutId);
      } catch (firestoreError) {
        console.error('Error saving workout to Firebase:', firestoreError);
        
        // Generate a local ID if Firebase fails
        workoutId = 'local_' + new Date().getTime();
        console.log('Using local workout ID:', workoutId);
        
        if (firestoreError.toString().includes('Missing or insufficient permissions')) {
          setError('Using local storage due to database access issues');
        } else {
          setError('Failed to save to database: ' + firestoreError.message);
        }
      }
      
      // Even if Firebase fails, always save to local storage
      const newWorkout = { ...workout, id: workoutId };
      
      // Save to local AsyncStorage unconditionally
      try {
        await saveRecentWorkout(newWorkout);
        console.log('Workout saved to AsyncStorage');
      } catch (storageError) {
        console.error('Error saving workout to AsyncStorage:', storageError);
      }
      
      // Update workouts state
      setWorkouts(prev => [newWorkout, ...prev]);
      
      return workoutId;
    } catch (error) {
      console.error('Error saving workout:', error);
      setError('Failed to save workout: ' + error.message);
      throw error;
    }
  };

  // Get workouts by type
  const getWorkoutsByType = async (type) => {
    if (!user) return [];
    
    try {
      return await getWorkoutsByTypeFromDb(user.uid, type);
    } catch (error) {
      console.error(`Error getting ${type} workouts:`, error);
      setError(`Failed to get ${type} workouts: ` + error.message);
      return [];
    }
  };

  // Get workout statistics for a period
  const getWorkoutStats = async (startDate, endDate) => {
    if (!user) return null;
    
    try {
      let stats = null;
      
      try {
        stats = await getWorkoutStatsFromDb(user.uid, startDate, endDate);
      } catch (firestoreError) {
        console.error('Error fetching workout stats from Firestore:', firestoreError);
        
        // If Firebase fails, calculate stats from local workouts if available
        if (firestoreError.toString().includes('Missing or insufficient permissions')) {
          console.log('Calculating workout stats locally due to Firebase permission issues');
          
          // Try to calculate stats from local workouts data
          if (workouts && workouts.length > 0) {
            const filteredWorkouts = workouts.filter(w => {
              const workoutDate = new Date(w.date);
              return workoutDate >= new Date(startDate) && workoutDate <= new Date(endDate);
            });
            
            let totalDistance = 0;
            let totalDuration = 0;
            let totalCalories = 0;
            
            filteredWorkouts.forEach(workout => {
              totalDistance += Number(workout.distance) || 0;
              totalDuration += Number(workout.duration) || 0;
              totalCalories += Number(workout.calories) || 0;
            });
            
            stats = {
              totalDistance,
              totalDuration,
              totalCalories,
              workoutCount: filteredWorkouts.length
            };
          } else {
            // Default empty stats
            stats = {
              totalDistance: 0,
              totalDuration: 0,
              totalCalories: 0,
              workoutCount: 0
            };
          }
        } else {
          throw firestoreError;
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting workout stats:', error);
      setError('Failed to get workout statistics: ' + error.message);
      
      // Return default stats on error
      return {
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        workoutCount: 0
      };
    }
  };

  // Add a new goal
  const addGoal = async (goalData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const goal = {
        ...goalData,
        userId: user.uid,
        created: new Date().toISOString(),
      };
      
      const goalId = await addGoalToDb(goal);
      
      const newGoal = { ...goal, id: goalId, completed: false };
      setGoals(prev => [newGoal, ...prev]);
      
      return goalId;
    } catch (error) {
      console.error('Error adding goal:', error);
      setError('Failed to add goal: ' + error.message);
      throw error;
    }
  };

  // Update goal completion status
  const updateGoalStatus = async (goalId, completed) => {
    try {
      const success = await updateGoalStatusFromDb(goalId, completed);
      
      if (success) {
        setGoals(prev => 
          prev.map(goal => 
            goal.id === goalId ? { ...goal, completed } : goal
          )
        );
      }
      
      return success;
    } catch (error) {
      console.error('Error updating goal status:', error);
      setError('Failed to update goal: ' + error.message);
      return false;
    }
  };

  // Clear all workout data (for logout)
  const clearWorkoutData = () => {
    setWorkouts([]);
    setGoals([]);
    setError(null);
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        goals,
        loading,
        error,
        addWorkout,
        saveWorkout,
        getWorkoutsByType,
        getWorkoutStats,
        addGoal,
        updateGoalStatus,
        refreshWorkouts: loadWorkouts,
        refreshGoals: loadGoals,
        clearWorkoutData,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}; 