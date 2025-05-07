import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Platform, Linking, SafeAreaView, Text, AppState, Vibration, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import * as Battery from 'expo-battery';
import { useWorkout } from '../contexts/WorkoutContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTrainingProgram } from '../contexts/TrainingProgramContext';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import WorkoutTypeIcon from '../components/workout/WorkoutTypeIcon';
import WorkoutMetricCard from '../components/workout/WorkoutMetricCard';
import WorkoutCompletionModal from '../components/workout/WorkoutCompletionModal';
import CustomButton from '../components/common/CustomButton';
import { metersToMiles, metersToKm, calculateCalories } from '../utils/workoutCalculations';
import { formatTime, getCurrentDateTime } from '../utils/timeUtils';
import { getRandomMotivationalQuote } from '../utils/motivationalQuotes';
import { UNITS } from '../constants/units';
import { WORKOUT_TYPES } from '../constants/workoutTypes';

// Import utilities
import {
  requestLocationPermissions,
  getBatteryOptimizedTracking,
  getInitialLocation,
  MIN_ACCURACY,
  MIN_DISTANCE_CHANGE,
  MIN_TIME_BETWEEN_UPDATES
} from '../utils/workout/locationUtils';

import {
  initializeStepCounting,
  isPedometerAvailable
} from '../utils/workout/stepUtils';

import {
  calculateEnhancedCalories,
  formatDuration,
  formatWorkoutSummary,
  DEFAULT_USER_PROFILE
} from '../utils/workout/calculationUtils';

import {
  processLocationUpdate
} from '../utils/workout/trackerUtils';

// Import UI components
import {
  LoadingScreen,
  PermissionErrorScreen,
  WorkoutMap,
  StatsPanel,
  DebugPanel,
  ControlButtons
} from '../components/workout/WorkoutTrackingComponents';

// Set this to true to enable debug logging during development, false for production
const DEBUG_MODE = true;

// Global tracking state that can be accessed by all functions
let globalIsTracking = false;

const WorkoutTracking = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { workoutType = 'Running', programId, userProgramId, weekIndex, workoutIndex, duration, description } = route.params || {};
  
  const { user, profileData } = useAuth();
  const { saveWorkout } = useWorkout();
  const { updateProgramProgress } = useTrainingProgram();
  
  // Motion tracking states
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [locationPermission, setLocationPermission] = useState(null);
  
  // Workout data states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [stats, setStats] = useState({
    distance: 0, // meters
    duration: 0, // seconds
    pace: 0, // minutes per km
    calories: 0,
    steps: 0,
    avgSpeed: 0, // km/h
  });
  
  // Program workout info
  const [programWorkout, setProgramWorkout] = useState(null);
  const isProgramWorkout = !!programId && !!userProgramId;
  
  // Map references
  const mapRef = useRef(null);
  const appState = useRef(AppState.currentState);
  
  // Start and pause time references
  const startTimeRef = useRef(null);
  const elapsedTimeRef = useRef(0);
  
  // Motivational messages
  const [motivationalMessage, setMotivationalMessage] = useState(
    getRandomMotivationalQuote()
  );
  
  // Timer for updating duration independently
  const durationTimerRef = useRef(null);
  
  // Track initial position to snap map to user's location
  const initialPositionRef = useRef(null);
  
  // Reference to prevent duplicate modal displays
  const isCompletionModalDisplayedRef = useRef(false);
  
  // Reference for the location watch subscription
  const watchPositionSubscription = useRef(null);
  
  // Reference for tracking pause time
  const pauseStartTimeRef = useRef(null);
  
  // Reference to track workout saving status
  const workoutSavedRef = useRef(false);
  
  // Handle program workout data
  useEffect(() => {
    if (isProgramWorkout) {
      setProgramWorkout({
        programId,
        userProgramId,
        weekIndex,
        workoutIndex,
        recommendedDuration: duration,
        description
      });
    }
  }, [programId, userProgramId, weekIndex, workoutIndex, duration, description]);

  // Request location permissions on component mount
  useEffect(() => {
    const initializeLocationTracking = async () => {
      try {
        console.log("Initializing location tracking...");
        
        // Use the utility function for requesting permissions
        const permissionResult = await requestLocationPermissions(
          (debugInfo) => console.log(debugInfo)
        );
        
        if (!permissionResult.granted) {
          console.log(`Permission error: ${permissionResult.error}`);
          setLocationPermission('denied');
          
          if (permissionResult.error === 'ios_config_error') {
            Alert.alert(
              'Developer Configuration Error',
              'The app is missing required location permission settings. Please contact the developer.',
              [{ text: 'OK' }]
            );
          } else if (permissionResult.error === 'location_services_disabled') {
            Alert.alert(
              'Location Services Disabled',
              'Please enable location services in your device settings to use the workout tracking features.',
              [
                { 
                  text: 'Open Settings', 
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  } 
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          } else {
            Alert.alert(
              'Location Permission Required',
              'This app needs location access to track your workout route. Please enable location permissions in your settings.',
              [
                { 
                  text: 'Open Settings', 
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  } 
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
          return;
        }
        
        setLocationPermission('granted');
        
        // Get initial location using the utility function
        const initialLocation = await getInitialLocation(
          (debugInfo) => console.log(debugInfo)
        );
        
        if (initialLocation) {
          console.log(`Initial location: ${initialLocation.coords.latitude}, ${initialLocation.coords.longitude}`);
          
          initialPositionRef.current = {
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
          };
          
          setCurrentLocation({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
          });
        } else {
          console.log("Could not get initial location");
          Alert.alert(
            'Location Error',
            'Unable to get your current location. Please ensure location services are enabled and try again.',
            [{ text: 'OK' }]
          );
        }
        
      } catch (error) {
        console.error('Error initializing location tracking:', error);
        setLocationPermission('error');
        
        Alert.alert(
          'Location Error',
          'There was an error accessing your location. Please ensure location services are enabled in your device settings.',
          [
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              } 
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeLocationTracking();
    
    // Setup AppState listener for handling app going to background
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      stopLocationTracking();
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, []);
  
  // Function to handle app state changes (background/foreground)
  const handleAppStateChange = (nextAppState) => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to background
      console.log('App going to background, continuing tracking...');
    } else if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App is coming to foreground
      console.log('App returning to foreground');
      
      // Check if we need to refresh location tracking
      if (isTracking && !isPaused && !watchPositionSubscription.current) {
        console.log('Restarting location tracking after returning to foreground');
        startLocationTracking();
      }
    }
    
    appState.current = nextAppState;
  };
  
  // Function to start workout tracking
  const startWorkout = async () => {
    // Reset tracking variables
    startTimeRef.current = new Date();
    elapsedTimeRef.current = 0;
    
    setStats({
      distance: 0,
      duration: 0,
      pace: 0,
      calories: 0,
      steps: 0,
      avgSpeed: 0,
    });
    
    setRouteCoordinates([]);
    setIsTracking(true);
    globalIsTracking = true;
    setIsPaused(false);
    pauseStartTimeRef.current = null;
    isCompletionModalDisplayedRef.current = false;
    
    try {
      await startLocationTracking();
      startDurationTimer();
      
      // Vibrate to confirm start
      Vibration.vibrate(200);
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert('Error', 'Failed to start workout tracking: ' + error.message);
      setIsTracking(false);
      globalIsTracking = false;
    }
  };
  
  // Start a timer to update duration independent of location updates
  const startDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
    }
    
    durationTimerRef.current = setInterval(() => {
      updateStepsAndDistance();
    }, 1000); // Update every second
  };
  
  // Function to update workout stats periodically
  const updateStepsAndDistance = () => {
    if (!globalIsTracking || isPaused || pauseStartTimeRef.current !== null) {
      return;
    }
    
    // Calculate duration directly from time difference
    const now = new Date();
    const newDuration = Math.floor((now - startTimeRef.current) / 1000) + elapsedTimeRef.current;
    
    // Update only duration without affecting other metrics that should only update with movement
    setStats(prevStats => ({
      ...prevStats,
      duration: newDuration,
    }));
    
    console.log('Periodic update - Duration:', newDuration);
  };
  
  // Function to start location tracking
  const startLocationTracking = async () => {
    if (watchPositionSubscription.current) {
      console.log('Cleaning up existing watch position subscription');
      await watchPositionSubscription.current.remove();
    }
    
    try {
      // Get battery-optimized tracking configuration
      const { trackingConfig } = await getBatteryOptimizedTracking(
        (debugInfo) => console.log(debugInfo)
      );
      
      console.log('Starting location tracking with config:', trackingConfig);
      
      watchPositionSubscription.current = await Location.watchPositionAsync(
        trackingConfig,
        updateLocation
      );
      
      console.log('Location tracking started successfully');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      
      // Fallback to default config if the optimized one fails
      console.log('Using fallback location tracking config');
      watchPositionSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5, // meters
          timeInterval: 1000, // ms
        },
        updateLocation
      );
    }
  };
  
  // Function to stop location tracking
  const stopLocationTracking = async () => {
    if (watchPositionSubscription.current) {
      await watchPositionSubscription.current.remove();
      watchPositionSubscription.current = null;
      console.log('Location tracking stopped');
    }
    
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };
  
  // Function to update location and stats
  const updateLocation = (location) => {
    if (!globalIsTracking || isPaused) return;
    
    const { latitude, longitude } = location.coords;
    const newCoord = { latitude, longitude };
    
    setCurrentLocation(newCoord);
    
    // Add to route path if tracking is active and not paused
    setRouteCoordinates((prevCoords) => {
      // Only add coordinates if we have previous coords to compare
      if (prevCoords.length === 0) {
        return [newCoord];
      }
      
      const lastCoord = prevCoords[prevCoords.length - 1];
      
      // Calculate distance from last point
      const distance = calculateDistance(
        lastCoord.latitude,
        lastCoord.longitude,
        latitude,
        longitude
      );
      
      // Only add point if there is a meaningful distance change (2 meters)
      // This helps filter out GPS jitter
      if (distance > 2) {
        // Calculate new stats
        updateWorkoutStats(location, distance);
        return [...prevCoords, newCoord];
      }
      
      return prevCoords;
    });
    
    // Recenter map if needed
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };
  
  // Function to update workout statistics
  const updateWorkoutStats = (location, distanceIncrement) => {
    const { speed } = location.coords;
    
    // Update stats based on new location
    setStats((prevStats) => {
      // Calculate new values
      const newDistance = prevStats.distance + distanceIncrement;
      const newDuration = Math.floor((new Date() - startTimeRef.current) / 1000) + elapsedTimeRef.current;
      
      // Calculate speed (km/h), avoid division by zero
      const avgSpeed = newDuration > 0 ? (newDistance / 1000) / (newDuration / 3600) : 0;
      
      // Calculate pace (min/km), avoid division by zero
      const paceInSeconds = newDistance > 0 ? (newDuration / (newDistance / 1000)) : 0;
      
      // Calculate estimated steps (average stride length is about 0.7m for walking)
      const strideLength = 0.7;
      const newSteps = Math.floor(newDistance / strideLength);
      
      // Calculate calories
      const userWeight = profileData?.weight || 70; // Default weight if not available
      const newCalories = calculateCalories(userWeight, newDistance, workoutType);
      
      return {
        distance: newDistance,
        duration: newDuration,
        pace: paceInSeconds,
        avgSpeed,
        steps: newSteps,
        calories: newCalories,
      };
    });
  };
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // In meters
  };
  
  // Function to handle pause/resume of workout
  const togglePause = () => {
    if (isPaused) {
      // Resume tracking
      const pauseDuration = (new Date() - pauseStartTimeRef.current) / 1000;
      console.log(`Resumed after ${pauseDuration} seconds pause`);
      
      pauseStartTimeRef.current = null;
      setIsPaused(false);
      
      // Restart location tracking
      startLocationTracking();
      startDurationTimer();
    } else {
      // Pause tracking
      setIsPaused(true);
      pauseStartTimeRef.current = new Date();
      stopLocationTracking();
      
      // Store elapsed time up to pause
      elapsedTimeRef.current = stats.duration;
    }
    
    // Vibrate to confirm action
    Vibration.vibrate(100);
  };
  
  // Function to finish workout
  const finishWorkout = async () => {
    try {
      console.log('Finishing workout...');
      
      // If route is too short, show warning
      if (routeCoordinates.length < 5) {
        Alert.alert(
          'Workout Too Short',
          'Your workout is too short to save. Continue a bit longer or discard it.',
          [
            { text: 'Continue', style: 'cancel' },
            { text: 'Discard', onPress: () => discardWorkout() },
            // Add force finish option for testing/debugging
            { text: 'Save Anyway', onPress: () => forceFinishWorkout() }
          ]
        );
        return;
      }
      
      // Stop tracking immediately to prevent further updates
      globalIsTracking = false;
      if (!isPaused) {
        await stopLocationTracking();
      }
      
      // Clear any running timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      // Save final stats
      const finalStats = { ...stats };
      console.log('Final workout stats:', finalStats);
      
      // Set state to show completion modal
      setIsTracking(false);
      isCompletionModalDisplayedRef.current = true;
      setShowCompletionModal(true);
      
      // Provide haptic feedback
      Vibration.vibrate([100, 200, 100]);
    } catch (error) {
      console.error('Error finishing workout:', error);
      Alert.alert('Error', 'Failed to finish your workout: ' + error.message);
      
      // Try to show completion modal anyway as a fallback
      try {
        setShowCompletionModal(true);
      } catch (modalError) {
        console.error('Error showing completion modal:', modalError);
        navigation.goBack();
      }
    }
  };
  
  // Force finish workout for very short workouts (debugging/testing)
  const forceFinishWorkout = async () => {
    try {
      globalIsTracking = false;
      if (!isPaused) {
        await stopLocationTracking();
      }
      
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      setIsTracking(false);
      isCompletionModalDisplayedRef.current = true;
      setShowCompletionModal(true);
      
      Vibration.vibrate([100, 200, 100]);
    } catch (error) {
      console.error('Error force finishing workout:', error);
      navigation.goBack();
    }
  };
  
  // Function to discard workout and go back
  const discardWorkout = async () => {
    try {
      await stopLocationTracking();
      globalIsTracking = false;
      setIsTracking(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error discarding workout:', error);
      // Try to go back anyway
      navigation.goBack();
    }
  };
  
  // Function to save workout and close modal
  const handleSaveWorkout = async () => {
    try {
      console.log('Saving workout...');
      
      // Convert distance to km for display and storage
      const distanceKm = stats.distance / 1000;
      
      // Don't save workouts that are too short, unless it's a program workout
      if (!isProgramWorkout && (stats.duration < 30 || distanceKm < 0.1)) {
        Alert.alert(
          'Workout Too Short',
          'Your workout must be at least 30 seconds and 100 meters to save.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save Anyway', onPress: () => completeSaveWorkout() },
            { text: 'Discard', onPress: () => navigation.goBack() }
          ]
        );
        return;
      }
      
      await completeSaveWorkout();
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert(
        'Save Error',
        'There was an error saving your workout: ' + error.message,
        [
          { text: 'Try Again', onPress: () => handleSaveWorkout() },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    }
  };
  
  // Helper function to complete the save process
  const completeSaveWorkout = async () => {
    try {
      console.log('Starting completeSaveWorkout process...');
      
      const workoutData = {
        userId: user.uid,
        type: workoutType,
        distance: stats.distance,
        duration: stats.duration,
        pace: stats.pace,
        avgSpeed: stats.avgSpeed,
        calories: stats.calories,
        steps: stats.steps,
        routeCoordinates: routeCoordinates,
        date: getCurrentDateTime(),
        notes: ''
      };
      
      // Add program information if this is a program workout
      if (isProgramWorkout && programWorkout) {
        workoutData.programId = programWorkout.programId;
        workoutData.userProgramId = programWorkout.userProgramId;
        workoutData.weekIndex = programWorkout.weekIndex;
        workoutData.workoutIndex = programWorkout.workoutIndex;
      }
      
      console.log('Workout data prepared:', {
        type: workoutData.type,
        distance: workoutData.distance,
        duration: workoutData.duration,
        userId: workoutData.userId
      });
      
      let savedSuccessfully = false;
      
      // Try to save to Firestore
      try {
        const workoutId = await saveWorkout(workoutData);
        console.log('Workout saved to Firestore successfully with ID:', workoutId);
        savedSuccessfully = true;
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        
        // Even if Firestore fails, try to save locally using AsyncStorage directly
        try {
          const { saveRecentWorkout } = require('../services/asyncStorage');
          await saveRecentWorkout({
            ...workoutData,
            id: 'local_' + new Date().getTime()
          });
          console.log('Workout saved to AsyncStorage as fallback');
          savedSuccessfully = true;
        } catch (storageError) {
          console.error('Error saving to AsyncStorage:', storageError);
          // Continue with the rest of the function even if both saves fail
        }
      }
      
      // If this is a program workout, update the program progress
      if (isProgramWorkout && programWorkout) {
        try {
          await updateProgramProgress(
            programWorkout.userProgramId,
            undefined, // Pass undefined for progress to let the function calculate it
            true // Indicate this is a completed workout
          );
          console.log('Program progress updated');
        } catch (progressError) {
          console.error('Error updating program progress:', progressError);
          // Continue even if progress update fails
        }
      }
      
      // Show alert with success or failure message
      if (savedSuccessfully) {
        Alert.alert(
          'Workout Saved',
          'Your workout has been saved successfully!',
          [{ text: 'OK', onPress: () => {
            // Hide completion modal and navigate back
            setShowCompletionModal(false);
            navigation.goBack();
          }}]
        );
      } else {
        Alert.alert(
          'Save Error',
          'There was a problem saving your workout. Do you want to try again?',
          [
            { 
              text: 'Try Again', 
              onPress: () => completeSaveWorkout() 
            },
            { 
              text: 'Go Back', 
              style: 'cancel',
              onPress: () => {
                setShowCompletionModal(false);
                navigation.goBack();
              } 
            }
          ]
        );
      }
      
      // Mark workout as saved
      workoutSavedRef.current = true;
    } catch (error) {
      console.error('Error in completeSaveWorkout:', error);
      Alert.alert(
        'Workout Save Error',
        'Failed to save workout: ' + error.message,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };
  
  // Format pace for display
  const formatPace = (paceInSeconds) => {
    if (!paceInSeconds || isNaN(paceInSeconds) || paceInSeconds === Infinity) {
      return '--:--';
    }
    
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.floor(paceInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Render loading state
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Initializing workout...</Text>
      </View>
    );
  }
  
  // Render permission error
  if (locationPermission === 'denied' || locationPermission === 'error') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="location-slash" size={60} color="#F44336" />
        <Text style={styles.errorTitle}>Location Access Required</Text>
        <Text style={styles.errorText}>
          We need access to your location to track your workout. Please enable
          location access in your settings and try again.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {currentLocation && (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              ...currentLocation,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            showsUserLocation
            followsUserLocation
          >
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="#4CAF50"
              />
            )}
            {routeCoordinates.length > 0 && (
              <Marker
                coordinate={routeCoordinates[0]}
                title="Start"
                pinColor="green"
              />
            )}
          </MapView>
        )}
        
        {/* Workout type and navigation */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (isTracking) {
                Alert.alert(
                  'End Workout?',
                  'Do you want to end your workout?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Discard', onPress: discardWorkout },
                    { text: 'Finish', onPress: finishWorkout },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.workoutTypeContainer}>
            <WorkoutTypeIcon type={workoutType} size={24} />
            <Text style={styles.workoutTypeText}>{workoutType}</Text>
          </View>
        </View>
      </View>
      
      {/* Program workout info */}
      {isProgramWorkout && programWorkout && (
        <View style={styles.programWorkoutInfo}>
          <Text style={styles.programWorkoutTitle}>Program Workout</Text>
          <Text style={styles.programWorkoutDesc}>{programWorkout.description}</Text>
          {programWorkout.recommendedDuration && (
            <Text style={styles.programWorkoutTarget}>
              Target: {programWorkout.recommendedDuration} mins
            </Text>
          )}
        </View>
      )}
      
      {/* Workout stats */}
      <View style={styles.statsContainer}>
        <WorkoutMetricCard
          icon="map-marker-distance"
          value={stats.distance >= 1000 ? (stats.distance / 1000).toFixed(2) : (stats.distance).toFixed(0)}
          unit={stats.distance >= 1000 ? "km" : "m"}
          label="Distance"
        />
        
        <WorkoutMetricCard
          icon="clock-outline"
          value={formatTime(stats.duration)}
          unit=""
          label="Duration"
        />
        
        <WorkoutMetricCard
          icon="speedometer"
          value={stats.pace ? formatPace(stats.pace) : "--:--"}
          unit="min/km"
          label="Pace"
        />
        
        <WorkoutMetricCard
          icon="fire"
          value={Math.round(stats.calories)}
          unit="kcal"
          label="Calories"
        />
      </View>
      
      {/* Motivational message */}
      <View style={styles.motivationalContainer}>
        <Text style={styles.motivationalText}>{motivationalMessage}</Text>
      </View>
      
      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        {!isTracking ? (
          <CustomButton 
            title="Start Workout"
            onPress={startWorkout}
            icon="play"
            color="#4CAF50"
            style={styles.startButton}
          />
        ) : (
          <View style={styles.activeControlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={finishWorkout}
            >
              <Ionicons name="stop" size={32} color="white" />
              <Text style={styles.controlButtonText}>Finish</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, isPaused ? styles.resumeButton : styles.pauseButton]}
              onPress={togglePause}
            >
              <Ionicons name={isPaused ? "play" : "pause"} size={32} color="white" />
              <Text style={styles.controlButtonText}>{isPaused ? "Resume" : "Pause"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Workout completion modal */}
      <WorkoutCompletionModal
        visible={showCompletionModal}
        onClose={() => {
          // Only prompt to discard if workout hasn't been explicitly saved
          if (!workoutSavedRef.current) {
            setShowCompletionModal(false);
            Alert.alert(
              'Discard Workout',
              'Are you sure you want to discard this workout?',
              [
                { text: 'Cancel', onPress: () => setShowCompletionModal(true) },
                { text: 'Discard', onPress: () => navigation.goBack() }
              ]
            );
          } else {
            // If workout was saved, just go back without prompting
            setShowCompletionModal(false);
            navigation.goBack();
          }
        }}
        onSave={handleSaveWorkout}
        workoutSummary={{
          type: workoutType,
          distance: (stats.distance / 1000).toFixed(2), // Convert to km
          duration: stats.duration.toString(),
          avgSpeed: stats.avgSpeed.toFixed(1),
          pace: formatPace(stats.pace),
          calories: Math.round(stats.calories).toString(),
          steps: stats.steps.toString(),
          date: getCurrentDateTime(),
          programId: programWorkout?.programId,
          userProgramId: programWorkout?.userProgramId,
          weekIndex: programWorkout?.weekIndex,
          workoutIndex: programWorkout?.workoutIndex
        }}
        routeCoordinates={routeCoordinates}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  mapContainer: {
    height: '45%',
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  workoutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  workoutTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  programWorkoutInfo: {
    margin: 10,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  programWorkoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  programWorkoutDesc: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  programWorkoutTarget: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4CAF50',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
  },
  motivationalContainer: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    margin: 10,
    borderRadius: 10,
  },
  motivationalText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#555',
    textAlign: 'center',
  },
  controlsContainer: {
    padding: 20,
    marginTop: 'auto',
  },
  startButton: {
    height: 60,
  },
  activeControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    width: 150,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  endButton: {
    backgroundColor: '#F44336',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default WorkoutTracking;