import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { formatDuration } from '../../utils/workout/calculationUtils';

// Loading component when initializing
export const LoadingScreen = ({ message, subMessage, debugInfo, isDebugMode }) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>{message}</Text>
      {subMessage && <Text style={styles.loadingSubText}>{subMessage}</Text>}
      {isDebugMode && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}
    </View>
  );
};

// Permission error screen
export const PermissionErrorScreen = ({ 
  title, 
  message, 
  buttonText, 
  onButtonPress, 
  secondaryButtonText, 
  onSecondaryButtonPress 
}) => {
  return (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionTitle}>{title}</Text>
      <Text style={styles.permissionText}>{message}</Text>
      
      <TouchableOpacity style={styles.permissionButton} onPress={onButtonPress}>
        <Text style={styles.permissionButtonText}>{buttonText}</Text>
      </TouchableOpacity>
      
      {secondaryButtonText && (
        <TouchableOpacity 
          style={[styles.permissionButton, styles.secondaryButton]}
          onPress={onSecondaryButtonPress}
        >
          <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Map with route tracking
export const WorkoutMap = ({ mapRef, initialRegion, routeCoordinates }) => {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={true}
    >
      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#FF5722"
          strokeWidth={3}
        />
      )}
    </MapView>
  );
};

// Stats panel that shows workout metrics
export const StatsPanel = ({ workoutType, stats }) => {
  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.7)', 'transparent']}
      style={styles.statsPanel}
    >
      <Text style={styles.workoutType}>{workoutType}</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{stats.distance.toFixed(2)} km</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={styles.statValue}>{Math.round(stats.calories)}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Steps</Text>
          <Text style={styles.statValue}>{stats.steps}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

// Debug panel for development
export const DebugPanel = ({ debugInfo }) => {
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugTitle}>Debug Info:</Text>
      <Text style={styles.debugText}>{debugInfo}</Text>
    </View>
  );
};

// Control buttons for workout actions
export const ControlButtons = ({ isTracking, onPauseResume, onStop }) => {
  return (
    <View style={styles.controls}>
      <TouchableOpacity 
        style={[styles.controlButton, styles.pauseButton]} 
        onPress={onPauseResume}
      >
        <Text style={styles.buttonText}>
          {isTracking ? 'Pause' : 'Resume'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.controlButton, styles.stopButton]} 
        onPress={onStop}
      >
        <Text style={styles.buttonText}>End</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles for all components
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  map: {
    flex: 1,
  },
  statsPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
  },
  workoutType: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 15,
  },
  statLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 140,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugContainer: {
    position: 'absolute',
    bottom: 120,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 10,
    maxHeight: 150,
  },
  debugTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    color: '#555',
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 