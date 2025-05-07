import { Pedometer, Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

// Stride length constants for step estimation
export const STRIDE_LENGTH = {
  Running: 0.75, // in meters
  Walking: 0.6, // in meters
  Cycling: 0, // No steps for cycling
  HIIT: 0.65 // Average for HIIT
};

// Check if pedometer is available
export const isPedometerAvailable = async () => {
  try {
    return await Pedometer.isAvailableAsync();
  } catch (error) {
    console.error('Error checking pedometer availability:', error);
    return false;
  }
};

// Initialize step counting using device pedometer
export const initializeStepCounting = async (
  startStepCount, 
  pedometerSubscription, 
  setStats, 
  setUseGpsForSteps, 
  globalIsTracking,
  addDebugInfo
) => {
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Initializing step counting...`);
  
  try {
    // Check if pedometer is available
    const isPedometerAvailable = await Pedometer.isAvailableAsync().catch(() => false);
    
    if (!isPedometerAvailable) {
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Pedometer not available on this device`);
      setUseGpsForSteps(true);
      return false;
    }
    
    // Get initial step count
    const end = new Date();
    const start = new Date();
    start.setHours(start.getHours() - 1);
    
    try {
      const { steps: initialSteps } = await Pedometer.getStepCountAsync(start, end);
      startStepCount.current = initialSteps;
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Initial step count: ${initialSteps}`);
      
      // Subscribe to real-time step updates
      if (pedometerSubscription.current) {
        pedometerSubscription.current.remove();
        pedometerSubscription.current = null;
      }
      
      // Store the first step count we receive to use as a baseline
      let baselineSteps = null;
      let workoutSteps = 0;
      
      pedometerSubscription.current = Pedometer.watchStepCount(result => {
        // Calculate steps since workout started
        const rawSteps = result.steps;
        
        // If this is our first reading, set the baseline
        if (baselineSteps === null) {
          baselineSteps = rawSteps;
          workoutSteps = 0;
          addDebugInfo(`[${new Date().toLocaleTimeString()}] Setting baseline step count: ${baselineSteps}`);
        } else {
          // Calculate steps since baseline
          workoutSteps = Math.max(0, rawSteps - baselineSteps);
        }
        
        addDebugInfo(`[${new Date().toLocaleTimeString()}] Pedometer steps: ${workoutSteps} (raw: ${rawSteps}, baseline: ${baselineSteps})`);
        
        // Always update steps if we're tracking, even during transition
        if (globalIsTracking) {
          setStats(prev => {
            // Only update if the new step count is higher to prevent decreasing counts
            if (workoutSteps > prev.steps) {
              addDebugInfo(`[${new Date().toLocaleTimeString()}] Updating step count to: ${workoutSteps}`);
              return {
                ...prev,
                steps: workoutSteps
              };
            }
            return prev;
          });
        }
      });
      
      setUseGpsForSteps(false);
      return true;
    } catch (error) {
      addDebugInfo(`[${new Date().toLocaleTimeString()}] Error getting initial step count: ${error.message}`);
      setUseGpsForSteps(true);
      return false;
    }
  } catch (error) {
    addDebugInfo(`[${new Date().toLocaleTimeString()}] Pedometer error: ${error.message}`);
    setUseGpsForSteps(true);
    return false;
  }
};

// Estimate steps based on distance and speed
export const estimateStepsFromDistance = (
  distanceInMeters, 
  timeDiff, 
  workoutType, 
  addDebugInfo
) => {
  // Get base stride length for workout type
  let effectiveStrideLength = STRIDE_LENGTH[workoutType] || STRIDE_LENGTH.Walking;
  
  // Adjust stride length based on speed
  const speedInKmh = (distanceInMeters / 1000) / (timeDiff / 3600000);
  
  if (workoutType === 'Running') {
    // Adjust running stride length based on speed
    if (speedInKmh > 12) {
      effectiveStrideLength = 0.95; // Fast running
    } else if (speedInKmh > 8) {
      effectiveStrideLength = 0.85; // Moderate running
    }
  } else if (workoutType === 'Walking') {
    // Adjust walking stride length based on speed
    if (speedInKmh > 6) {
      effectiveStrideLength = 0.75; // Fast walking
    } else if (speedInKmh > 4) {
      effectiveStrideLength = 0.65; // Moderate walking
    } else {
      effectiveStrideLength = 0.55; // Slow walking
    }
  }
  
  const steps = Math.round(distanceInMeters / effectiveStrideLength);
  addDebugInfo(`[${new Date().toLocaleTimeString()}] Estimated ${steps} steps (GPS-based, stride: ${effectiveStrideLength.toFixed(2)}m, speed: ${speedInKmh.toFixed(2)} km/h)`);
  
  return steps;
}; 