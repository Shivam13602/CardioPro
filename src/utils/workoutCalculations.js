/**
 * Workout calculation utilities
 * This file contains functions for converting between different units of measurement
 * and calculating workout metrics like calories burned.
 */

// MET values for different workout types
const MET_VALUES = {
  Running: 8.0,
  Walking: 4.0,
  Cycling: 6.0,
  HIIT: 7.0,
  Swimming: 6.0,
  Strength: 5.0,
  Yoga: 3.0
};

/**
 * Convert meters to miles
 * @param {number} meters - Distance in meters
 * @returns {number} - Distance in miles
 */
export const metersToMiles = (meters) => {
  return meters / 1609.344;
};

/**
 * Convert meters to kilometers
 * @param {number} meters - Distance in meters
 * @returns {number} - Distance in kilometers
 */
export const metersToKm = (meters) => {
  return meters / 1000;
};

/**
 * Convert kilometers to meters
 * @param {number} km - Distance in kilometers
 * @returns {number} - Distance in meters
 */
export const kmToMeters = (km) => {
  return km * 1000;
};

/**
 * Convert miles to meters
 * @param {number} miles - Distance in miles
 * @returns {number} - Distance in meters
 */
export const milesToMeters = (miles) => {
  return miles * 1609.344;
};

/**
 * Calculate calories burned based on weight, distance, and workout type
 * This is a simplified calculation
 * @param {number} weight - User weight in kg
 * @param {number} distance - Distance in meters
 * @param {string} workoutType - Type of workout (e.g. 'Running', 'Walking')
 * @returns {number} - Estimated calories burned
 */
export const calculateCalories = (weight, distance, workoutType) => {
  // Get MET value for workout type
  const met = MET_VALUES[workoutType] || MET_VALUES.Walking;
  
  // Convert distance to km
  const distanceKm = distance / 1000;
  
  // Rough formula: calories = MET × weight (kg) × duration (hours)
  // We estimate duration based on typical speeds for the activity
  let estimatedHours;
  
  switch (workoutType) {
    case 'Running':
      estimatedHours = distanceKm / 10; // Assume 10 km/h average speed
      break;
    case 'Walking':
      estimatedHours = distanceKm / 5; // Assume 5 km/h average speed
      break;
    case 'Cycling':
      estimatedHours = distanceKm / 15; // Assume 15 km/h average speed
      break;
    case 'Swimming':
      estimatedHours = distanceKm / 2; // Assume 2 km/h average speed
      break;
    default:
      estimatedHours = distanceKm / 5; // Default estimation
  }
  
  // Calculate calories
  const calories = met * weight * estimatedHours;
  
  return calories;
};

/**
 * Calculate calories burned based on weight, duration, and workout type
 * @param {number} weight - User weight in kg
 * @param {number} durationSeconds - Duration in seconds
 * @param {string} workoutType - Type of workout
 * @returns {number} - Estimated calories burned
 */
export const calculateCaloriesByDuration = (weight, durationSeconds, workoutType) => {
  // Get MET value for workout type
  const met = MET_VALUES[workoutType] || MET_VALUES.Walking;
  
  // Convert seconds to hours
  const durationHours = durationSeconds / 3600;
  
  // Calculate calories
  const calories = met * weight * durationHours;
  
  return Math.round(calories);
};

/**
 * Calculate pace (time per distance)
 * @param {number} durationSeconds - Duration in seconds
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} - Pace in MM:SS format
 */
export const calculatePace = (durationSeconds, distanceKm) => {
  if (!distanceKm || distanceKm === 0) return "--:--";
  
  // Calculate seconds per kilometer
  const secondsPerKm = durationSeconds / distanceKm;
  
  // Convert to minutes and seconds
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  
  // Format as MM:SS
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculate average speed
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} durationSeconds - Duration in seconds
 * @returns {number} - Speed in km/h
 */
export const calculateSpeed = (distanceKm, durationSeconds) => {
  if (!durationSeconds || durationSeconds === 0) return 0;
  
  // Calculate km/h
  const speedKmh = (distanceKm / (durationSeconds / 3600));
  
  return speedKmh;
}; 