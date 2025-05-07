import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getUserProfile, 
  saveUserProfile, 
  updateUserProfile as updateUserProfileInFirestore
} from '../services/firestoreDatabase';
import { getUserPreferences, saveUserPreferences } from '../services/asyncStorage';

// Default user profile values
export const DEFAULT_USER_PROFILE = {
  weight: 70, // kg
  height: 175, // cm
  age: 30,
  gender: 'male',
  activityLevel: 'moderate', // sedentary, light, moderate, active, very_active
  fitnessGoal: 'general', // general, weight_loss, muscle_gain, cardio, event
  preferredWorkoutTypes: ['Running'], // Preferred workout types
  notificationsEnabled: true,
  shareWorkoutsAutomatically: false,
  theme: 'light',
  measurementUnit: 'metric' // 'metric' or 'imperial'
};

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise 1-3 days/week
  moderate: 1.55,      // Moderate exercise 3-5 days/week
  active: 1.725,       // Active 6-7 days a week
  very_active: 1.9     // Very active (2x per day)
};

// Create context
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile when user changes
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserPreferences();
    } else {
      setProfile(null);
      setPreferences({});
      setLoading(false);
    }
  }, [user]);

  // Load user profile from firestore
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.uid);
      
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // Create a default profile if none exists or if Firebase access fails
        const defaultProfile = {
          ...DEFAULT_USER_PROFILE,
          userId: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          createdAt: new Date().toISOString()
        };
        
        try {
          await saveUserProfile(user.uid, defaultProfile);
        } catch (saveError) {
          console.error('Error saving default profile, using local only:', saveError);
          // Continue with local profile even if saving fails
        }
        
        setProfile(defaultProfile);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Handle permission errors by creating a local-only profile
      if (error.toString().includes('Missing or insufficient permissions')) {
        console.log('Using default local profile due to permission issues');
        const localProfile = {
          ...DEFAULT_USER_PROFILE,
          userId: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          isLocalOnly: true
        };
        setProfile(localProfile);
        setError('Using local profile due to database access issues');
      } else {
        setError('Failed to load profile: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load user preferences from local storage
  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      const userPrefs = await getUserPreferences();
      setPreferences(userPrefs);
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setError('Failed to load preferences: ' + error.message);
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      
      // Update in Firebase
      let success = false;
      try {
        success = await updateUserProfileInFirestore(user.uid, profileData);
      } catch (fbError) {
        console.error('Firebase update failed:', fbError);
        // If Firebase fails but we have a local-only profile, consider it a success
        if (profile && profile.isLocalOnly) {
          success = true;
        } else {
          throw fbError;
        }
      }
      
      // Update local state regardless of Firebase result
      setProfile(prev => ({
        ...prev,
        ...profileData,
        isLocalOnly: prev?.isLocalOnly || false
      }));
      
      return success;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update user preferences
  const updatePreferences = async (newPreferences) => {
    try {
      // Save to AsyncStorage
      await saveUserPreferences(newPreferences);
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        ...newPreferences
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update preferences: ' + error.message);
      return false;
    }
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (!profile || !profile.weight || !profile.height) return null;
    
    const heightInMeters = profile.height / 100;
    const bmi = profile.weight / (heightInMeters * heightInMeters);
    
    return bmi.toFixed(1);
  };

  // Get BMI category
  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    
    if (bmi < 18.5) return { category: 'Underweight', color: '#64B5F6' };
    if (bmi < 25) return { category: 'Normal', color: '#4CAF50' };
    if (bmi < 30) return { category: 'Overweight', color: '#FFA726' };
    return { category: 'Obese', color: '#E53935' };
  };

  // Get daily calorie needs (Basal Metabolic Rate - BMR)
  const calculateBMR = () => {
    if (!profile) return null;
    
    const { weight, height, age, gender } = profile;
    
    if (!weight || !height || !age || !gender) return null;
    
    // Using Mifflin-St Jeor Equation
    if (gender === 'male') {
      return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    } else {
      return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
    }
  };
  
  // Calculate Total Daily Energy Expenditure (TDEE)
  const calculateTDEE = () => {
    const bmr = calculateBMR();
    if (!bmr || !profile || !profile.activityLevel) return null;
    
    const activityMultiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
    return Math.round(bmr * activityMultiplier);
  };

  // Calculate macronutrient recommendations based on fitness goal
  const calculateMacros = () => {
    const tdee = calculateTDEE();
    if (!tdee || !profile || !profile.fitnessGoal) return null;
    
    let proteinPercentage, carbPercentage, fatPercentage;
    let calorieAdjustment = 0;
    
    switch (profile.fitnessGoal) {
      case 'weight_loss':
        // Caloric deficit of 20%
        calorieAdjustment = -0.2;
        proteinPercentage = 0.35; // Higher protein for muscle preservation
        fatPercentage = 0.3;
        carbPercentage = 0.35;
        break;
      case 'muscle_gain':
        // Caloric surplus of 10%
        calorieAdjustment = 0.1;
        proteinPercentage = 0.3;
        fatPercentage = 0.25;
        carbPercentage = 0.45; // Higher carbs for energy
        break;
      case 'cardio':
        // Maintenance calories
        proteinPercentage = 0.25;
        fatPercentage = 0.25;
        carbPercentage = 0.5; // Higher carbs for endurance
        break;
      case 'event':
        // Slight surplus for training
        calorieAdjustment = 0.05;
        proteinPercentage = 0.25;
        fatPercentage = 0.25;
        carbPercentage = 0.5;
        break;
      case 'general':
      default:
        // Balanced macros at maintenance
        proteinPercentage = 0.3;
        fatPercentage = 0.3;
        carbPercentage = 0.4;
    }
    
    const adjustedCalories = Math.round(tdee * (1 + calorieAdjustment));
    
    // Calculate macros in grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
    const protein = Math.round((adjustedCalories * proteinPercentage) / 4);
    const carbs = Math.round((adjustedCalories * carbPercentage) / 4);
    const fat = Math.round((adjustedCalories * fatPercentage) / 9);
    
    return {
      calories: adjustedCalories,
      protein,
      carbs,
      fat,
      proteinPercentage,
      carbPercentage,
      fatPercentage
    };
  };

  // Get user fitness level text
  const getFitnessLevelText = () => {
    if (!profile || !profile.activityLevel) return 'Not specified';
    
    const levels = {
      sedentary: 'Sedentary',
      light: 'Lightly Active',
      moderate: 'Moderately Active',
      active: 'Very Active',
      very_active: 'Extremely Active'
    };
    
    return levels[profile.activityLevel] || 'Moderately Active';
  };

  // Get fitness goal text
  const getFitnessGoalText = () => {
    if (!profile || !profile.fitnessGoal) return 'Not specified';
    
    const goals = {
      general: 'General Fitness',
      weight_loss: 'Weight Loss',
      muscle_gain: 'Build Muscle',
      cardio: 'Improve Cardio',
      event: 'Training for Event'
    };
    
    return goals[profile.fitnessGoal] || 'General Fitness';
  };

  // Format weight for display based on user preferences
  const formatWeight = (weightInKg) => {
    if (!weightInKg) return '0';
    
    if (preferences.measurementUnit === 'imperial') {
      // Convert kg to lbs
      const weightInLbs = weightInKg * 2.20462;
      return weightInLbs.toFixed(1) + ' lbs';
    }
    
    return weightInKg + ' kg';
  };

  // Format height for display based on user preferences
  const formatHeight = (heightInCm) => {
    if (!heightInCm) return '0';
    
    if (preferences.measurementUnit === 'imperial') {
      // Convert cm to feet and inches
      const totalInches = heightInCm * 0.393701;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}"`;
    }
    
    return heightInCm + ' cm';
  };

  // Reset user profile errors
  const resetError = () => {
    setError(null);
  };

  // Check if profile is complete
  const isProfileComplete = () => {
    if (!profile) return false;
    
    const requiredFields = ['displayName', 'weight', 'height', 'age', 'gender'];
    return requiredFields.every(field => !!profile[field]);
  };

  const value = {
    user,
    profile,
    preferences,
    loading,
    error,
    updateUserProfile,
    updatePreferences,
    calculateBMI,
    getBMICategory,
    calculateBMR,
    calculateTDEE,
    calculateMacros,
    getFitnessLevelText,
    getFitnessGoalText,
    resetError,
    refreshProfile: loadUserProfile,
    refreshPreferences: loadUserPreferences,
    formatWeight,
    formatHeight,
    isProfileComplete
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}; 