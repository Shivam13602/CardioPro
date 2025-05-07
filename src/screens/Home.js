import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { testFirebaseConnection } from '../utils/firebaseTests';
import WorkoutCompletionModal from '../components/workout/WorkoutCompletionModal';
import { getRecentWorkouts } from '../services/asyncStorage';

const Home = ({ navigation, route }) => {
  const [selectedWorkoutType, setSelectedWorkoutType] = useState('Running');
  const [workoutStats, setWorkoutStats] = useState({
    totalDistance: 0,
    totalDuration: 0,
    totalCalories: 0,
    workoutCount: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [completedWorkout, setCompletedWorkout] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [workoutRouteCoordinates, setWorkoutRouteCoordinates] = useState([]);
  const [localWorkoutData, setLocalWorkoutData] = useState([]);

  // Get current date formatted nicely.
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Motivational quote
  const motivationalQuote = "Push yourself, because no one else is going to do it for you.";

  // Get user info from auth context
  const { user, logout } = useAuth();
  const greetingName = user && user.displayName ? user.displayName : "Athlete";
  
  // Get workout data from workout context
  const { workouts: recentWorkouts, loading: isLoading, refreshWorkouts, error, getWorkoutStats } = useWorkout();

  // Fetch workout stats for the last 30 days
  const fetchWorkoutStats = async () => {
    try {
      setIsLoadingStats(true);
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const stats = await getWorkoutStats(startDate.toISOString(), endDate);
      if (stats) {
        setWorkoutStats(stats);
      }
    } catch (error) {
      console.error('Error fetching workout stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // When returning from WorkoutTracking with new workout data, refresh workouts
  useEffect(() => {
    if (route && route.params && route.params.workoutSummary) {
      refreshWorkouts();
      fetchWorkoutStats();
      
      // Only show completion modal for valid workouts
      const isValidWorkout = route.params.isValidWorkout !== false;
      
      if (isValidWorkout) {
        setCompletedWorkout(route.params.workoutSummary);
        
        // Try to parse route coordinates if available
        try {
          if (route.params.workoutSummary.routeCoordinates) {
            let routeCoords = [];
            if (typeof route.params.workoutSummary.routeCoordinates === 'string') {
              routeCoords = JSON.parse(route.params.workoutSummary.routeCoordinates);
            } else if (Array.isArray(route.params.workoutSummary.routeCoordinates)) {
              routeCoords = route.params.workoutSummary.routeCoordinates;
            }
            setWorkoutRouteCoordinates(routeCoords);
          }
        } catch (error) {
          console.error('Error parsing route coordinates:', error);
          setWorkoutRouteCoordinates([]);
        }
        
        setShowCompletionModal(true);
      } else {
        console.log('Workout was too short, not showing completion modal');
      }
    }
  }, [route]);

  // Fetch workout stats on component mount
  useEffect(() => {
    fetchWorkoutStats();
  }, []);

  useEffect(() => {
    // Test Firebase connection on component mount
    const testFirebase = async () => {
      try {
        const testResult = await testFirebaseConnection();
        console.log('Firebase connection test results:', testResult);
        if (!testResult.success) {
          console.warn('Firebase connection test failed:', testResult);
        } else {
          console.log('Firebase connection test succeeded:', testResult);
        }
      } catch (error) {
        console.error('Error testing Firebase connection:', error);
      }
    };
    
    testFirebase();
  }, []);

  // Dummy recommended workouts data.
  const recommendedWorkouts = [
    { title: "HIIT Blast", description: "High intensity interval training", duration: "30 min" },
    { title: "Morning Run", description: "Easy run to kickstart your day", duration: "20 min" },
    { title: "Strength Training", description: "Build muscle and burn fat", duration: "40 min" },
  ];

  // Dummy achievements data.
  const achievements = [
    { title: "First Run", description: "Completed your first run!" },
    { title: "5K Master", description: "Achieved a 5K run in under 30 minutes!" }
  ];

  const workoutTypes = [
    {
      type: 'Running',
      icon: '🏃‍♂️',
      description: 'Track your runs with GPS',
    },
    {
      type: 'Walking',
      icon: '🚶‍♂️',
      description: 'Record your walking sessions',
    },
    {
      type: 'Cycling',
      icon: '🚴‍♂️',
      description: 'Monitor your bike rides',
    },
    {
      type: 'HIIT',
      icon: '⚡',
      description: 'High-intensity interval training',
    },
  ];

  const handleStartWorkout = (type) => {
    navigation.navigate('WorkoutTracking', { workoutType: type });
  };
  
  // Handle starting a recommended workout
  const handleStartRecommendedWorkout = (workout) => {
    // Map the workout title to a workout type
    let workoutType = 'Running'; // Default to running
    
    if (workout.title.includes('HIIT')) {
      workoutType = 'HIIT';
    } else if (workout.title.includes('Run')) {
      workoutType = 'Running';
    } else if (workout.title.includes('Strength')) {
      workoutType = 'Walking'; // Use walking as a substitute until we have a strength training type
    }
    
    navigation.navigate('WorkoutTracking', { 
      workoutType,
      duration: workout.duration,
      description: workout.description
    });
  };

  // Handle viewing workout details
  const handleViewWorkoutDetails = (workoutId) => {
    navigation.navigate('WorkoutDetails', { workoutId });
  };

  // Format the date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Today';
    
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled by the Navigation component in App.js
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const loadLocalWorkouts = async () => {
    try {
      if (!user?.uid) {
        console.log('No user ID available for loading workouts');
        return;
      }
      
      // Get workouts from AsyncStorage with the current user ID
      const localWorkouts = await getRecentWorkouts(user.uid);
      console.log(`Loaded local workouts for user: ${user.uid}, count: ${localWorkouts.length}`);
      
      // Always update local data if we have workouts
      if (localWorkouts.length > 0) {
        console.log('Using local workouts for display');
        setLocalWorkoutData(localWorkouts);
      }
    } catch (error) {
      console.error('Error loading local workouts:', error);
    }
  };

  // Load workouts when screen gets focus (returning from a workout)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Home screen focused - reloading local workouts');
      loadLocalWorkouts();
    });
    
    return unsubscribe;
  }, [navigation, user?.uid]);

  useEffect(() => {
    if (!isLoading) {
      loadLocalWorkouts();
    }
  }, [isLoading, user?.uid]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Error: {error}
          </Text>
        </View>
      )}
      <ScrollView style={styles.container}>
        {/* Welcome Section */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, {greetingName}</Text>
              <Text style={styles.subtitle}>{currentDate}</Text>
              <Text style={styles.subtitle}>Ready for today's workout?</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>30-Day Stats</Text>
          {isLoadingStats ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{workoutStats.totalDistance.toFixed(2)} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {Math.floor(workoutStats.totalDuration / 60)}:{(workoutStats.totalDuration % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{Math.round(workoutStats.totalCalories)} kcal</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{workoutStats.workoutCount}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Start Section */}
        <View style={styles.quickStartContainer}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutTypesScroll}>
            {workoutTypes.map((workout, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.workoutTypeCard,
                  selectedWorkoutType === workout.type && styles.selectedWorkoutType,
                ]}
                onPress={() => setSelectedWorkoutType(workout.type)}
              >
                <Text style={styles.workoutTypeIcon}>{workout.icon}</Text>
                <Text style={styles.workoutTypeText}>{workout.type}</Text>
                <Text style={styles.workoutTypeDescription}>{workout.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartWorkout(selectedWorkoutType)}
          >
            <Text style={styles.startButtonText}>Start {selectedWorkoutType}</Text>
          </TouchableOpacity>
        </View>

        {/* Recommended Workouts Section */}
        <View style={styles.recommendedContainer}>
          <Text style={styles.sectionTitle}>Recommended Workouts</Text>
          {recommendedWorkouts.map((workout, index) => (
            <TouchableOpacity key={index} style={styles.recommendedCard}>
              <View style={styles.recommendedDetails}>
                <Text style={styles.recommendedTitle}>{workout.title}</Text>
                <Text style={styles.recommendedDescription}>{workout.description}</Text>
                <Text style={styles.recommendedDuration}>{workout.duration}</Text>
              </View>
              <TouchableOpacity 
                style={styles.startMiniButton}
                onPress={() => handleStartRecommendedWorkout(workout)}
              >
                <Text style={styles.startMiniButtonText}>Start</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Workouts Section */}
        <View style={styles.recentWorkoutsContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {isLoading ? (
            <ActivityIndicator color="#4CAF50" style={styles.loadingIndicator} />
          ) : (
            // Use either Firebase workouts or local workouts from AsyncStorage
            (recentWorkouts.length > 0 || localWorkoutData.length > 0) ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.recentWorkoutsScroll}
              >
                {/* Use recentWorkouts if available, otherwise use localWorkoutData */}
                {(recentWorkouts.length > 0 ? recentWorkouts : localWorkoutData).map((workout, index) => (
                  <TouchableOpacity
                    key={workout.id || index}
                    style={styles.workoutCard}
                    onPress={() => handleViewWorkoutDetails(workout.id)}
                  >
                    <View style={styles.workoutCardTop}>
                      <View style={styles.workoutTypeLabel}>
                        <Text style={styles.workoutTypeText}>{workout.type}</Text>
                      </View>
                      <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                    </View>
                    <View style={styles.workoutCardStats}>
                      <View style={styles.workoutStat}>
                        <Text style={styles.workoutStatValue}>{workout.distance} km</Text>
                        <Text style={styles.workoutStatLabel}>Distance</Text>
                      </View>
                      <View style={styles.workoutStat}>
                        <Text style={styles.workoutStatValue}>{workout.duration}</Text>
                        <Text style={styles.workoutStatLabel}>Duration</Text>
                      </View>
                      <View style={styles.workoutStat}>
                        <Text style={styles.workoutStatValue}>{Math.round(workout.calories)} kcal</Text>
                        <Text style={styles.workoutStatLabel}>Calories</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyWorkoutsContainer}>
                <Text style={styles.emptyWorkoutsText}>No recent workouts. Start one now!</Text>
              </View>
            )
          )}
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>🏆</Text>
              </View>
              <View style={styles.achievementDetails}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Motivation Quote */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.quoteContainer}
        >
          <Text style={styles.quoteText}>"{motivationalQuote}"</Text>
        </LinearGradient>
      </ScrollView>
      
      {/* Add the WorkoutCompletionModal */}
      <WorkoutCompletionModal
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        workoutSummary={completedWorkout}
        routeCoordinates={workoutRouteCoordinates}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 15,
    borderRadius: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  quickStartContainer: {
    padding: 15,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
  },
  workoutTypesScroll: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  workoutTypeCard: {
    width: 150,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  selectedWorkoutType: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  workoutTypeIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  workoutTypeText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  workoutTypeDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recommendedContainer: {
    padding: 15,
    marginTop: 5,
  },
  recommendedCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendedDetails: {
    flex: 1,
  },
  recommendedTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  recommendedDescription: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 8,
  },
  recommendedDuration: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  startMiniButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  startMiniButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  achievementsContainer: {
    padding: 15,
    marginTop: 5,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  achievementDescription: {
    color: '#666666',
    fontSize: 14,
  },
  quoteContainer: {
    marginTop: 20,
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  quoteText: {
    color: 'white',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 16,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  errorText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 14,
  },
  recentWorkoutsContainer: {
    padding: 15,
    marginTop: 5,
  },
  recentWorkoutsScroll: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  workoutCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
  },
  workoutCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  workoutTypeLabel: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  workoutDate: {
    color: '#666666',
  },
  workoutCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutStat: {
    alignItems: 'center',
  },
  workoutStatValue: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  workoutStatLabel: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 4,
  },
  emptyWorkoutsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 30,
    borderRadius: 10,
  },
  emptyWorkoutsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  loadingIndicator: {
    marginTop: 20,
  },
});

export default Home;
