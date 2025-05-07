import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { 
  isRealisticMovement, 
  calculateHaversineDistance 
} from './locationUtils';
import { estimateStepsFromDistance } from './stepUtils';
import { MIN_DISTANCE_CHANGE, MIN_TIME_BETWEEN_UPDATES } from './locationUtils';

// Process new location updates and update metrics
export const processLocationUpdate = ({
  newLocation,
  lastCoordinateRef,
  globalIsTracking,
  isPauseResumeTransition,
  totalDistanceRef,
  stats,
  setStats,
  setRouteCoordinates,
  useGpsForSteps,
  workoutType,
  updateAllStats,
  addDebugInfo,
  lastValidLocationTimestampRef
}) => {
  // Always log the location update for debugging
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Location update received: accuracy ${newLocation.coords.accuracy.toFixed(1)}m`);
  
  // Explicitly check global tracking state
  if (!globalIsTracking) {
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Not tracking - ignoring update`);
    return;
  }
  
  // Skip if accuracy is extremely poor, but use a more relaxed threshold
  if (newLocation.coords.accuracy > 50) { // Increased from 25 to 50
    addDebugInfo(`[${new Date().toLocaleTimeString()}] ❌ Very low accuracy reading: ${newLocation.coords.accuracy.toFixed(1)}m - ignoring`);
    return;
  }
  
  const newCoordinate = {
    latitude: newLocation.coords.latitude,
    longitude: newLocation.coords.longitude,
    timestamp: new Date().getTime(),
    accuracy: newLocation.coords.accuracy
  };
  
  // Log the good reading
  addDebugInfo(`[${new Date().toLocaleTimeString()}] ✓ Good location update: accuracy ${newLocation.coords.accuracy.toFixed(1)}m`);
  
  // Still update route coordinates during transition, just skip distance calculation
  if (isPauseResumeTransition.current) {
    addDebugInfo(`[${new Date().toLocaleTimeString()}] In transition period - updating route but skipping metrics`);
    lastCoordinateRef.current = newCoordinate;
    setRouteCoordinates(prev => [...prev, {
      latitude: newCoordinate.latitude,
      longitude: newCoordinate.longitude
    }]);
    return;
  }
  
  // Calculate distance and update metrics
  if (lastCoordinateRef.current) {
    updateMetricsWithNewLocation(
      lastCoordinateRef.current, 
      newCoordinate, 
      {
        totalDistanceRef,
        useGpsForSteps,
        workoutType,
        updateAllStats,
        setStats, 
        setRouteCoordinates,
        addDebugInfo,
        lastValidLocationTimestampRef
      }
    );
  } else {
    // If this is the first location update, just store it
    addDebugInfo(`[${new Date().toLocaleTimeString()}] First location update - storing as reference`);
    lastCoordinateRef.current = newCoordinate;
    setRouteCoordinates(prev => [...prev, {
      latitude: newCoordinate.latitude,
      longitude: newCoordinate.longitude
    }]);
  }
};

// Update metrics based on new location data
const updateMetricsWithNewLocation = (
  lastCoord, 
  newCoord, 
  {
    totalDistanceRef,
    useGpsForSteps,
    workoutType,
    updateAllStats,
    setStats,
    setRouteCoordinates,
    addDebugInfo,
    lastValidLocationTimestampRef
  }
) => {
  // Time since last update
  const timeDiff = newCoord.timestamp - lastCoord.timestamp;
  
  // Log time difference for debugging
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Time since last update: ${(timeDiff/1000).toFixed(1)}s`);
  
  // Check if update is too soon - use a more lenient time check for better responsiveness
  if (timeDiff < MIN_TIME_BETWEEN_UPDATES) { // Reduced from MIN_TIME_BETWEEN_UPDATES * 2
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Update too soon (${(timeDiff/1000).toFixed(1)}s < ${(MIN_TIME_BETWEEN_UPDATES/1000).toFixed(1)}s) - ignoring`);
    return;
  }
  
  // Calculate distance in meters
  const distanceInMeters = calculateHaversineDistance(
    lastCoord.latitude,
    lastCoord.longitude,
    newCoord.latitude,
    newCoord.longitude
  ) * 1000; // Convert km to meters
  
  // Display the calculated change
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Distance change: ${distanceInMeters.toFixed(1)}m`);
  
  // Always update the last coordinate reference
  lastCoord = newCoord;
  
  // Less strict GPS jump detection - only check if movement speed is reasonable
  if (!isRealisticMovement(lastCoord, newCoord, timeDiff, workoutType, addDebugInfo)) {
    addDebugInfo(`[${new Date().toLocaleTimeString()}] ❌ Unrealistic movement detected - ignoring point`);
    
    // Still add point to route but don't update distance/calories
    setRouteCoordinates(prev => [...prev, {
      latitude: newCoord.latitude,
      longitude: newCoord.longitude
    }]);
    
    return;
  }
  
  // Update route coordinates
  setRouteCoordinates(prev => [...prev, {
    latitude: newCoord.latitude,
    longitude: newCoord.longitude
  }]);
  
  // Lower threshold for considered movement - make more sensitive
  // For walking especially, we want to count small movements
  const moveThreshold = workoutType === 'Walking' ? MIN_DISTANCE_CHANGE * 0.5 : MIN_DISTANCE_CHANGE;
  
  // Only update distance if we've moved at least the minimum distance
  if (distanceInMeters >= moveThreshold) {
    // Update the total distance
    const newTotalDistance = totalDistanceRef.current + (distanceInMeters / 1000); // in km
    totalDistanceRef.current = newTotalDistance;
    
    addDebugInfo(`[${new Date().toLocaleTimeString()}] ✓ Updated total distance: ${newTotalDistance.toFixed(3)} km`);
    
    // Calculate steps based on distance if pedometer is not available
    if (useGpsForSteps) {
      const newSteps = estimateStepsFromDistance(
        distanceInMeters, 
        timeDiff, 
        workoutType, 
        addDebugInfo
      );
      
      // Update steps count
      setStats(prev => ({
        ...prev,
        steps: prev.steps + newSteps
      }));
    }
    
    // Consolidated stats update with all metrics at once
    updateAllStats();
    
    lastValidLocationTimestampRef.current = newCoord.timestamp;
  } else {
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Movement too small (${distanceInMeters.toFixed(1)}m < ${moveThreshold}m) - updating route only`);
    
    // Still update stats periodically even for small movements, with more frequent updates
    const timeSinceLastUpdate = new Date().getTime() - lastValidLocationTimestampRef.current;
    if (timeSinceLastUpdate > 5000) { // Reduced from 10000 to 5000 ms
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Periodic stats update (${(timeSinceLastUpdate/1000).toFixed(1)}s since last update)`);
      updateAllStats();
      lastValidLocationTimestampRef.current = new Date().getTime();
    }
  }
}; 