import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { Platform } from 'react-native';

// Location tracking constants - Make more sensitive to movement
export const MIN_ACCURACY = Platform.OS === 'ios' ? 50 : 45; // Increased threshold to catch more GPS points
export const MIN_DISTANCE_CHANGE = Platform.OS === 'ios' ? 0.5 : 1; // Reduced distance threshold to detect smaller movements
export const MIN_TIME_BETWEEN_UPDATES = 250; // Reduced time between updates for more responsive tracking

// Default configuration for location tracking
export const getDefaultLocationConfig = () => ({
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 1000, // Reduced from 2000
  distanceInterval: 1 // Reduced from 5
});

// Request location permissions
export const requestLocationPermissions = async (addDebugInfo) => {
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Requesting location permissions...`);
  
  try {
    // Check if location services are enabled
    const locationServicesEnabled = await Location.hasServicesEnabledAsync();
    
    if (!locationServicesEnabled) {
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Location services not enabled`);
      return { granted: false, error: 'location_services_disabled' };
    }
    
    // Request foreground permissions
    const foregroundPermission = await Location.requestForegroundPermissionsAsync();
    
    if (!foregroundPermission.granted) {
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Foreground location permission denied`);
      return { granted: false, error: 'permission_denied' };
    }
    
    // Request background permissions on Android
    if (Platform.OS === 'android') {
      const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
      if (!backgroundPermission.granted) {
        addDebugInfo(`[${new Date().toLocaleTimeString()}] Background location permission denied`);
        // Continue anyway, but log the warning
      }
    }
    
    // Assume permissions are granted if location services are enabled
    return { granted: true };
  } catch (error) {
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Error checking location services: ${error.message}`);
    
    // Handle specific iOS configuration error
    if (error.message && error.message.includes('NSLocation')) {
      return { granted: false, error: 'ios_config_error' };
    }
    
    return { granted: false, error: error.message };
  }
};

// Get battery-optimized tracking configuration
export const getBatteryOptimizedTracking = async (addDebugInfo) => {
  // Get current battery level
  let batteryLevel;
  try {
    batteryLevel = await Battery.getBatteryLevelAsync();
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Battery level: ${Math.round(batteryLevel * 100)}%`);
  } catch (error) {
    batteryLevel = 0.5; // Default to 50% if we can't get battery level
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Error getting battery level: ${error.message}`);
  }
  
  // Configure tracking parameters based on battery level
  let trackingConfig;
  
  if (batteryLevel > 0.5) {
    // Higher battery - use high accuracy
    trackingConfig = {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 1
    };
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Using high accuracy tracking`);
  } else if (batteryLevel > 0.2) {
    // Medium battery - use balanced accuracy
    trackingConfig = {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 2000,
      distanceInterval: 2
    };
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Using balanced accuracy tracking`);
  } else {
    // Low battery - use low power mode
    trackingConfig = {
      accuracy: Location.Accuracy.Low,
      timeInterval: 3000,
      distanceInterval: 5
    };
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Using low power tracking`);
  }
  
  return { trackingConfig, batteryLevel };
};

// Get initial location
export const getInitialLocation = async (addDebugInfo) => {
  let initialLocation = null;
  let attempts = 0;
  const maxAttempts = 3;
  
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Getting initial location...`);
  
  while (!initialLocation && attempts < maxAttempts) {
    attempts++;
    try {
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Attempt ${attempts} to get initial location...`);
      
      // Use progressively lower accuracy with each attempt
      const accuracy = attempts === 1 
        ? Location.Accuracy.BestForNavigation 
        : attempts === 2 
          ? Location.Accuracy.Balanced 
          : Location.Accuracy.Low;
      
      initialLocation = await Location.getCurrentPositionAsync({
        accuracy,
        timeout: 10000 // 10 second timeout
      });
    } catch (error) {
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Attempt ${attempts} failed: ${error.message}`);
      
      // Short delay before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // If all attempts failed, try to get last known position
  if (!initialLocation) {
    addDebugInfo(`[${new Date().toLocaleTimeString()}] All attempts failed, trying last known position...`);
    initialLocation = await Location.getLastKnownPositionAsync();
  }
  
  return initialLocation;
};

// Check if movement is realistic (not a GPS jump)
export const isRealisticMovement = (lastCoord, newCoord, timeDiff, workoutType, addDebugInfo) => {
  if (!lastCoord) return true;
  
  // Calculate speed in m/s
  const distanceInMeters = calculateHaversineDistance(
    lastCoord.latitude,
    lastCoord.longitude,
    newCoord.latitude,
    newCoord.longitude
  ) * 1000; // Convert km to meters
  
  const speed = distanceInMeters / (timeDiff / 1000);
  
  // More reasonable speed thresholds to allow normal walking/running
  const MAX_REASONABLE_SPEED = workoutType === 'Running' ? 9 : 
                              workoutType === 'Walking' ? 3 : 
                              workoutType === 'Cycling' ? 15 : 5; // m/s
  
  const isRealistic = speed <= MAX_REASONABLE_SPEED;
  
  // Log the speed calculation for debugging
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Movement speed: ${speed.toFixed(2)} m/s (max: ${MAX_REASONABLE_SPEED} m/s) - ${isRealistic ? 'realistic' : 'unrealistic'}`);
  
  return isRealistic;
};

// Haversine formula for calculating distance between two points
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}; 