import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useWorkout } from '../contexts/WorkoutContext';
import { Ionicons } from '@expo/vector-icons';
import SocialShareModal from '../components/workout/SocialShareModal';

const { width } = Dimensions.get('window');

const WorkoutDetails = ({ route, navigation }) => {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [mapSnapshot, setMapSnapshot] = useState(null);
  
  const mapRef = useRef(null);
  const { workouts } = useWorkout();

  useEffect(() => {
    // Get workout data
    if (workoutId && workouts.length > 0) {
      const foundWorkout = workouts.find(w => w.id === workoutId);
      if (foundWorkout) {
        setWorkout(foundWorkout);
        // Calculate achievements
        detectAchievements(foundWorkout);
      }
    }
    setLoading(false);
  }, [workoutId, workouts]);

  const detectAchievements = (workout) => {
    const newAchievements = [];
    
    // First workout achievement
    if (workouts.length === 1) {
      newAchievements.push({
        title: "First Workout",
        description: "You completed your first workout!",
        icon: "trophy"
      });
    }
    
    // Distance achievements
    if (workout.distance >= 5) {
      newAchievements.push({
        title: "5K Club",
        description: "You completed a 5K or longer workout!",
        icon: "ribbon"
      });
    }
    
    if (workout.distance >= 10) {
      newAchievements.push({
        title: "10K Master",
        description: "You completed a 10K or longer workout!",
        icon: "medal"
      });
    }
    
    // Duration achievements
    const durationInMinutes = workout.duration / 60;
    if (durationInMinutes >= 30) {
      newAchievements.push({
        title: "Endurance Builder",
        description: "You worked out for 30 minutes or more!",
        icon: "time"
      });
    }
    
    setAchievements(newAchievements);
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let result = '';
    if (hrs > 0) {
      result += `${hrs}h `;
    }
    if (mins > 0 || hrs > 0) {
      result += `${mins}m `;
    }
    result += `${secs}s`;
    
    return result;
  };

  const calculatePace = (distance, duration) => {
    if (!distance || !duration) return "0:00";
    
    // Calculate minutes per kilometer
    const totalMinutes = duration / 60;
    const pace = totalMinutes / distance;
    
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const shareWorkout = async () => {
    if (!workout) return;
    
    // Try to take a snapshot of the map
    if (mapRef.current && routeCoordinates.length > 0) {
      try {
        const uri = await mapRef.current.takeSnapshot({
          format: 'jpg',
          quality: 0.8,
          result: 'file'
        });
        setMapSnapshot(uri);
      } catch (error) {
        console.error('Error capturing map:', error);
      }
    }
    
    setShowShareModal(true);
  };
  
  const handleRequestMapSnapshot = async () => {
    if (mapRef.current && routeCoordinates.length > 0) {
      try {
        const uri = await mapRef.current.takeSnapshot({
          format: 'jpg',
          quality: 0.8,
          result: 'file'
        });
        setMapSnapshot(uri);
        return uri;
      } catch (error) {
        console.error('Error capturing map:', error);
        return null;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading workout details...</Text>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Workout Details</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout not found</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Parse route coordinates
  let routeCoordinates = [];
  try {
    if (workout.routeCoordinates) {
      if (typeof workout.routeCoordinates === 'string') {
        routeCoordinates = JSON.parse(workout.routeCoordinates);
      } else {
        routeCoordinates = workout.routeCoordinates;
      }
    }
  } catch (e) {
    console.error('Error parsing route coordinates:', e);
  }

  // Calculate map region from route
  const mapRegion = routeCoordinates.length > 0 ? {
    latitude: routeCoordinates[0].latitude,
    longitude: routeCoordinates[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  } : null;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{workout.type} Details</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareWorkout}
          >
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Map Section */}
        {routeCoordinates.length > 0 && mapRegion && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              onMapReady={() => setMapReady(true)}
              scrollEnabled={true}
              zoomEnabled={true}
            >
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="#4CAF50"
              />
              {routeCoordinates.length > 0 && (
                <>
                  <Marker 
                    coordinate={routeCoordinates[0]} 
                    title="Start"
                    pinColor="green"
                  />
                  <Marker 
                    coordinate={routeCoordinates[routeCoordinates.length - 1]} 
                    title="Finish"
                    pinColor="red"
                  />
                </>
              )}
            </MapView>
          </View>
        )}

        {/* Workout Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>
            {new Date(workout.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.distance} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{calculatePace(workout.distance, workout.duration)}</Text>
              <Text style={styles.statLabel}>Pace (min/km)</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.steps}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(workout.distance / (workout.duration / 3600)).toFixed(1)} km/h
              </Text>
              <Text style={styles.statLabel}>Avg Speed</Text>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        {achievements.length > 0 && (
          <View style={styles.achievementsContainer}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <View style={styles.achievementIcon}>
                  <Ionicons name={achievement.icon} size={24} color="#4CAF50" />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Comparison with Previous Workouts */}
        <View style={styles.comparisonContainer}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <Text style={styles.insightText}>
            {workout.distance > 3 
              ? "Great job pushing yourself! This workout contributes significantly to your weekly goals."
              : "Every step counts! Keep building consistency with your workouts."}
          </Text>
          
          {/* This would ideally be a chart comparing to previous workouts */}
          <View style={styles.comparisonChart}>
            <Text style={styles.chartTitle}>Workout Comparison</Text>
            <Text style={styles.chartSubtitle}>
              This is where your workout stands compared to your average:
            </Text>
            
            {/* Simple performance bars - in a real app, use a charting library */}
            <View style={styles.performanceBar}>
              <Text style={styles.performanceLabel}>Distance</Text>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, {width: '75%'}]} />
              </View>
              <Text style={styles.performanceValue}>75%</Text>
            </View>
            
            <View style={styles.performanceBar}>
              <Text style={styles.performanceLabel}>Duration</Text>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, {width: '60%'}]} />
              </View>
              <Text style={styles.performanceValue}>60%</Text>
            </View>
            
            <View style={styles.performanceBar}>
              <Text style={styles.performanceLabel}>Calories</Text>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, {width: '85%'}]} />
              </View>
              <Text style={styles.performanceValue}>85%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Social Share Modal */}
      <SocialShareModal 
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        workout={{
          type: workout?.type || 'Workout',
          distance: parseFloat(workout?.distance) || 0,
          duration: parseInt(workout?.duration, 10) || 0,
          calories: parseInt(workout?.calories, 10) || 0,
          steps: workout?.steps || 0,
          date: workout?.date || new Date().toISOString()
        }}
        mapSnapshot={mapSnapshot}
        onMapSnapshotRequest={handleRequestMapSnapshot}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  shareButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  achievementsContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 10,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  comparisonContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  comparisonChart: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  performanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#333',
    width: 80,
  },
  barBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  performanceValue: {
    fontSize: 14,
    color: '#333',
    width: 40,
    textAlign: 'right',
    marginLeft: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WorkoutDetails; 