// MET values for different workout types
export const MET_VALUES = {
  Running: 8.0,
  Walking: 4.0,
  Cycling: 6.0,
  HIIT: 7.0
};

// Default user profile
export const DEFAULT_USER_PROFILE = {
  weight: 70, // kg
  height: 175, // cm
  age: 30, // years
  gender: 'male',
  fitnessLevel: 2 // 0-5 scale
};

// Format duration from seconds to HH:MM:SS
export const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format pace from mins/km to MM:SS display
export const formatPace = (pace) => {
  if (pace === 0) return '--:--';
  
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Enhanced calorie calculation
export const calculateEnhancedCalories = (
  distance, 
  duration, 
  steps, 
  elevationGain, 
  workoutType, 
  userProfile = DEFAULT_USER_PROFILE
) => {
  // Extract user metrics
  const { weight, height, age, gender, fitnessLevel } = userProfile;
  
  // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  
  // Calculate calories per minute at rest
  const caloriesPerMinuteRest = bmr / 1440; // 1440 minutes in a day
  
  // Use a fixed MET value based on workout type instead of pace
  const baseMET = MET_VALUES[workoutType] || MET_VALUES.Walking;
  
  // Add elevation factor
  const elevationFactor = 1 + (elevationGain / 100) * 0.2;
  
  // Adjust MET based on fitness level (fitter people burn fewer calories)
  const adjustedMET = baseMET * (1 - (fitnessLevel * 0.05)); // fitnessLevel from 0-5
  
  // Calculate calories burned during activity
  const activeCalories = caloriesPerMinuteRest * adjustedMET * (duration / 60) * elevationFactor;
  
  return Math.round(activeCalories);
};

// Simplified calorie calculation fallback
export const calculateSimpleCalories = (distance, duration, workoutType, weight = 70) => {
  // Use fixed MET values based on workout type
  const MET = MET_VALUES[workoutType] || MET_VALUES.Walking;
  
  // Formula: calories = MET * weight(kg) * duration(hours)
  return Math.round((duration / 3600) * MET * weight);
};

// Create formatted workout summary for display
export const formatWorkoutSummary = (stats, workoutType, routeCoordinates) => {
  const currentDate = new Date().toISOString();
  
  // Format workout summary data
  const workoutSummary = {
    type: workoutType,
    distance: stats.distance.toFixed(2),
    duration: stats.duration,
    calories: Math.round(stats.calories),
    steps: stats.steps,
    date: currentDate,
    routeCoordinates: JSON.stringify(routeCoordinates)
  };
  
  // Format for display
  const displaySummary = {
    type: workoutType,
    distance: stats.distance.toFixed(2) + ' km',
    duration: formatDuration(stats.duration),
    calories: Math.round(stats.calories) + ' kcal',
    steps: stats.steps,
    date: new Date(currentDate).toLocaleDateString()
  };
  
  return { workoutSummary, displaySummary };
}; 