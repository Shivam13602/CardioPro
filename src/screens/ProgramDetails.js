import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrainingProgram } from '../contexts/TrainingProgramContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { validateProgram, inspectObject } from '../utils/debugUtils';

const ProgramDetails = ({ route }) => {
  const { programId } = route.params;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [userProgram, setUserProgram] = useState(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState([]);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  const { 
    getProgramById,
    getUserProgramByProgramId,
    isEnrolledInProgram,
    enrollInProgram,
    updateProgramProgress,
    withdrawFromProgram,
    loading: contextLoading,
    error
  } = useTrainingProgram();
  
  const { saveWorkout } = useWorkout();

  useEffect(() => {
    const loadProgramDetails = async () => {
      setLoading(true);
      try {
        // Get program details
        const programData = await getProgramById(programId);
        if (programData) {
          console.log('ProgramDetails - Program loaded:', programData.title);
          setProgram(programData);
          
          // Validate program data
          validateProgram(programData);
          
          // Parse weeklySchedule from programData
          if (programData.weeklySchedule) {
            try {
              const schedule = typeof programData.weeklySchedule === 'string' 
                ? JSON.parse(programData.weeklySchedule) 
                : programData.weeklySchedule;
                
              console.log('Parsed weekly schedule:', 
                `${schedule.length} weeks, ` + 
                `first week has ${schedule[0]?.workouts?.length || 0} workouts`
              );
              
              setWeeklyWorkouts(schedule);
            } catch (err) {
              console.error('Error parsing weekly schedule:', err);
              setWeeklyWorkouts([]);
            }
          } else {
            console.warn('Program has no weekly schedule:', programData.id);
          }
          
          // Check if user is enrolled and get user's progress
          if (isEnrolledInProgram(programId)) {
            const userProgramData = getUserProgramByProgramId(programId);
            setUserProgram(userProgramData);
          }
        } else {
          console.error('Program not found with ID:', programId);
        }
      } catch (error) {
        console.error('Error loading program details:', error);
        Alert.alert('Error', 'Failed to load program details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProgramDetails();
  }, [programId]);

  // Add this useEffect to check if user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        
        // This is just for demo purposes - in production, use proper role management
        const adminEmails = ['admin@cardiopro.com', 'test@example.com'];
        setIsAdmin(user && adminEmails.includes(user.email));
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const handleEnroll = async () => {
    try {
      await enrollInProgram(programId);
      // Refresh user program data
      const userProgramData = await getUserProgramByProgramId(programId);
      setUserProgram(userProgramData);
      Alert.alert('Success', 'You have successfully enrolled in this program!');
    } catch (error) {
      console.error('Error enrolling in program:', error);
      Alert.alert('Error', 'Failed to enroll in program. Please try again.');
    }
  };
  
  const handleStartWorkout = (weekIndex, workoutIndex, workout) => {
    if (!userProgram) {
      Alert.alert(
        'Not Enrolled',
        'You need to enroll in this program first before starting workouts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enroll', onPress: handleEnroll }
        ]
      );
      return;
    }
    
    // Navigate to workout tracking with program details
    navigation.navigate('WorkoutTracking', {
      workoutType: workout.type || 'Running',
      duration: workout.duration,
      description: workout.description,
      programId: program.id,
      userProgramId: userProgram.id,
      weekIndex,
      workoutIndex
    });
  };
  
  const handleCompleteWorkout = async (weekIndex, workoutIndex) => {
    if (!userProgram) return;
    
    try {
      const totalWorkouts = weeklyWorkouts.reduce((total, week) => total + (week.workouts ? week.workouts.length : 0), 0);
      
      // Initialize completedWorkouts as an array if it doesn't exist or isn't an array
      let completedWorkouts = userProgram.completedWorkouts;
      if (!completedWorkouts || !Array.isArray(completedWorkouts)) {
        completedWorkouts = [];
      }
      
      // Add this workout to the completed list if not already there
      const workoutEntry = { weekIndex, workoutIndex };
      const alreadyCompleted = completedWorkouts.some(
        w => w.weekIndex === weekIndex && w.workoutIndex === workoutIndex
      );
      
      if (!alreadyCompleted) {
        completedWorkouts.push(workoutEntry);
      }
      
      const newProgress = Math.min(1, totalWorkouts > 0 ? completedWorkouts.length / totalWorkouts : 0);
      
      // Update program progress
      await updateProgramProgress(userProgram.id, newProgress, true);
      
      // Update local state
      setUserProgram(prev => ({
        ...prev,
        progress: newProgress,
        completedWorkouts: completedWorkouts
      }));
      
      Alert.alert(
        'Workout Completed',
        'Great job! Your program progress has been updated.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Error', 'Failed to update progress: ' + error.message);
    }
  };
  
  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw from Program',
      `Are you sure you want to withdraw from "${program.title}"? Your progress will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: confirmWithdraw }
      ]
    );
  };
  
  const confirmWithdraw = async () => {
    if (!userProgram) return;
    
    try {
      const success = await withdrawFromProgram(userProgram.id);
      
      if (success) {
        Alert.alert(
          'Withdrawn Successfully',
          'You have been withdrawn from this program.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error withdrawing from program:', error);
      Alert.alert('Error', 'Failed to withdraw: ' + error.message);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };
  
  const formatDuration = (minutes) => {
    if (!minutes) return '30 min';
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${remainingMinutes} min`;
      }
    }
  };
  
  const renderWeeklySchedule = () => {
    if (!weeklyWorkouts || weeklyWorkouts.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No schedule available for this program.</Text>
        </View>
      );
    }
    
    return weeklyWorkouts.map((week, weekIndex) => {
      return (
        <View key={`week-${weekIndex}`} style={styles.weekContainer}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>Week {weekIndex + 1}</Text>
            {userProgram && userProgram.currentWeek === weekIndex + 1 && (
              <View style={styles.currentWeekBadge}>
                <Text style={styles.currentWeekText}>Current</Text>
              </View>
            )}
          </View>
          
          {week.workouts && week.workouts.map((workout, workoutIndex) => {
            const isCompleted = userProgram?.completedWorkouts ? 
              // Check if this workout is in the completedWorkouts array
              (Array.isArray(userProgram.completedWorkouts) ? 
                userProgram.completedWorkouts.some(w => w.weekIndex === weekIndex && w.workoutIndex === workoutIndex) :
                false) : 
              false;
            
            return (
              <TouchableOpacity 
                key={`workout-${weekIndex}-${workoutIndex}`}
                style={[
                  styles.workoutItem,
                  isCompleted && styles.completedWorkout
                ]}
                onPress={() => handleStartWorkout(weekIndex, workoutIndex, workout)}
              >
                <View style={styles.workoutDetails}>
                  <View style={styles.workoutTypeContainer}>
                    <Ionicons 
                      name={workout.type === 'Running' ? 'walk-outline' : 'fitness-outline'} 
                      size={20} 
                      color="#4CAF50" 
                    />
                    <Text style={styles.workoutType}>{workout.type || 'Running'}</Text>
                  </View>
                  <Text style={styles.workoutDescription}>{workout.description}</Text>
                  <View style={styles.workoutMetrics}>
                    <View style={styles.metric}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.metricText}>{formatDuration(workout.duration)}</Text>
                    </View>
                    {workout.distance && (
                      <View style={styles.metric}>
                        <Ionicons name="navigate-outline" size={16} color="#666" />
                        <Text style={styles.metricText}>{workout.distance} km</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.workoutAction}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  ) : (
                    <Ionicons name="play-circle-outline" size={24} color="#4CAF50" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    });
  };

  if (loading || contextLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading program details...</Text>
      </SafeAreaView>
    );
  }

  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#F44336" />
        <Text style={styles.errorText}>Program not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>{program.title}</Text>
          <View style={styles.headerRightContainer}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProgramDetails', { program })}
              >
                <Ionicons name="create-outline" size={22} color="white" />
              </TouchableOpacity>
            )}
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(program.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>{program.difficulty}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.programInfo}>
          <Text style={styles.description}>{program.description}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>
                {program.duration} weeks
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="fitness-outline" size={20} color="#4CAF50" />
              <Text style={styles.detailText}>
                {program.workoutsPerWeek || 3} workouts/week
              </Text>
            </View>
          </View>
          
          {userProgram && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(userProgram.progress || 0) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((userProgram.progress || 0) * 100)}% Complete
              </Text>
              <Text style={styles.weekText}>
                Week {userProgram.currentWeek || 1} of {program.duration}
              </Text>
            </View>
          )}
          
          {!userProgram && (
            <TouchableOpacity 
              style={styles.enrollButton}
              onPress={handleEnroll}
            >
              <Text style={styles.enrollButtonText}>Enroll in Program</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.weeklySchedule}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          {renderWeeklySchedule()}
        </View>
      </ScrollView>

      {userProgram && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              const currentWeekIndex = userProgram.currentWeek - 1;
              const currentWeek = weeklyWorkouts[currentWeekIndex];
              
              if (currentWeek && currentWeek.workouts && currentWeek.workouts.length > 0) {
                const nextWorkout = currentWeek.workouts[0];
                handleStartWorkout(currentWeekIndex, 0, nextWorkout);
              } else {
                handleStartWorkout();
              }
            }}
          >
            <Text style={styles.startButtonText}>
              Start Today's Workout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 5,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  programInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  description: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailText: {
    marginLeft: 5,
    color: '#555',
    fontWeight: '500',
  },
  progressContainer: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  weekText: {
    fontSize: 14,
    color: '#666',
  },
  enrollButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  enrollButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  weeklySchedule: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  weekContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  weekHeader: {
    backgroundColor: '#DCEDC8',
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33691E',
  },
  currentWeekBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  currentWeekText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  completedWorkout: {
    backgroundColor: '#F1F8E9',
  },
  workoutDetails: {
    flex: 1,
  },
  workoutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginLeft: 5,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  workoutMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metricText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 3,
  },
  workoutAction: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyStateContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
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
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
});

export default ProgramDetails; 