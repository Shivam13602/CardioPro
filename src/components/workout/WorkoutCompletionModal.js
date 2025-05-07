import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import SocialShareModal from './SocialShareModal';
import ViewShot from 'react-native-view-shot';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useTrainingProgram } from '../../contexts/TrainingProgramContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const WorkoutCompletionModal = ({ visible, onClose, onSave, workoutSummary, routeCoordinates = [] }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [mapSnapshot, setMapSnapshot] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [workoutRank, setWorkoutRank] = useState(null);
  const [programProgress, setProgramProgress] = useState(null);
  const [isProgramWorkout, setIsProgramWorkout] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const navigation = useNavigation();
  
  // Get workout context to compare with previous workouts
  const { workouts } = useWorkout();
  
  // Get training program context
  const { userPrograms, updateProgramProgress } = useTrainingProgram();
  
  // Format data for sharing
  const formattedWorkout = workoutSummary ? {
    type: workoutSummary.type,
    distance: parseFloat(workoutSummary.distance),
    duration: parseInt(workoutSummary.duration, 10) || 0,
    calories: parseInt(workoutSummary.calories, 10) || 0,
    steps: workoutSummary.steps,
    date: workoutSummary.date || new Date().toISOString()
  } : null;
  
  // Parse route coordinates if they exist
  const parsedRouteCoordinates = routeCoordinates?.length > 0 ? routeCoordinates : [];
  
  // Handle program workout completion
  useEffect(() => {
    if (workoutSummary && visible && workoutSummary.programId && workoutSummary.userProgramId) {
      setIsProgramWorkout(true);
      
      // Find the program details
      const userProgram = userPrograms.find(p => p.id === workoutSummary.userProgramId);
      
      if (userProgram) {
        setProgramInfo({
          title: userProgram.programTitle,
          progress: userProgram.progress,
          currentWeek: userProgram.currentWeek,
          totalWeeks: parseInt(userProgram.programDuration)
        });
        
        // Calculate new progress based on completed workout
        const totalPossibleWorkouts = userProgram.totalWorkoutsInProgram || 30; // Default assumption if not set
        const newCompletedWorkouts = (userProgram.completedWorkouts || 0) + 1;
        const newProgress = Math.min(newCompletedWorkouts / totalPossibleWorkouts, 1);
        
        setProgramProgress({
          previous: userProgram.progress,
          new: newProgress,
          totalCompleted: newCompletedWorkouts
        });
        
        // Update program progress in Firebase
        const updateProgress = async () => {
          try {
            await updateProgramProgress(workoutSummary.userProgramId, newProgress, true);
            console.log('Updated program progress:', newProgress);
          } catch (error) {
            console.error('Failed to update program progress:', error);
          }
        };
        
        updateProgress();
      }
    } else {
      setIsProgramWorkout(false);
      setProgramInfo(null);
      setProgramProgress(null);
    }
  }, [workoutSummary, visible, userPrograms, updateProgramProgress]);
  
  // Calculate achievements for this workout
  useEffect(() => {
    if (workoutSummary && visible) {
      const newAchievements = [];
      const distance = parseFloat(workoutSummary.distance);
      const duration = parseInt(workoutSummary.duration, 10);
      const type = workoutSummary.type;
      
      // Default achievement for any completed workout
      newAchievements.push({
        title: "Workout Complete", 
        description: `You completed a ${type.toLowerCase()} workout!`,
        icon: "trophy",
        color: "#FFD700"
      });
      
      // Program-specific achievement
      if (isProgramWorkout && programInfo) {
        newAchievements.push({
          title: `${programInfo.title} Progress`,
          description: `You've advanced in your training program!`,
          icon: "fitness",
          color: "#9C27B0"
        });
      }
      
      // Distance achievements
      if (distance >= 5) {
        newAchievements.push({
          title: "5K Club", 
          description: "You completed a 5K workout!",
          icon: "ribbon",
          color: "#4CAF50"
        });
      }
      
      if (distance >= 10) {
        newAchievements.push({
          title: "10K Master", 
          description: "You completed a 10K workout!",
          icon: "medal",
          color: "#2196F3"
        });
      }
      
      // Duration achievements
      if (duration >= 1800) { // 30 minutes
        newAchievements.push({
          title: "Endurance Builder", 
          description: "You worked out for 30 minutes or more!",
          icon: "time",
          color: "#FFA000"
        });
      }
      
      // Calculate workout rank compared to previous workouts
      if (workouts && workouts.length > 0) {
        const sameTypeWorkouts = workouts.filter(w => w.type === type);
        
        // First workout of this type achievement
        if (sameTypeWorkouts.length === 0) {
          newAchievements.push({
            title: `First ${type}`, 
            description: `This is your first recorded ${type.toLowerCase()} workout!`,
            icon: "star",
            color: "#9C27B0"
          });
        } else {
          // Sort workouts by distance to see ranking
          const sortedByDistance = [...sameTypeWorkouts].sort((a, b) => 
            parseFloat(b.distance) - parseFloat(a.distance)
          );
          
          const distanceRank = sortedByDistance.findIndex(w => 
            parseFloat(w.distance) < distance
          ) + 1;
          
          if (distanceRank === 1) {
            newAchievements.push({
              title: "Personal Best", 
              description: `New distance record for ${type.toLowerCase()}!`,
              icon: "flame",
              color: "#F44336"
            });
          }
          
          setWorkoutRank({
            total: sameTypeWorkouts.length + 1,
            distanceRank: distanceRank === 0 ? sameTypeWorkouts.length + 1 : distanceRank
          });
        }
        
        // Check streak (consecutive days with workouts)
        const today = new Date().setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayTimestamp = yesterday.setHours(0, 0, 0, 0);
        
        const hasWorkoutYesterday = workouts.some(w => {
          const workoutDate = new Date(w.date).setHours(0, 0, 0, 0);
          return workoutDate === yesterdayTimestamp;
        });
        
        if (hasWorkoutYesterday) {
          newAchievements.push({
            title: "Consistency Streak", 
            description: "You've worked out two days in a row!",
            icon: "flame",
            color: "#FF9800"
          });
        }
      }
      
      setAchievements(newAchievements);
    }
  }, [workoutSummary, visible, workouts, isProgramWorkout, programInfo]);
  
  // Handle sharing
  const handleShare = async () => {
    // Take a snapshot of the map if available
    if (mapRef.current && parsedRouteCoordinates.length > 0) {
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
  
  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('Saving workout from modal...');
      if (onSave) {
        await onSave();
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle navigation to program details
  const handleProgramDetails = () => {
    if (isProgramWorkout && programInfo) {
      onClose();
      navigation.navigate('ProgramDetails', { programId: workoutSummary.programId });
    }
  };
  
  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      // Calculate map region from route
      if (parsedRouteCoordinates.length > 0) {
        setMapRegion({
          latitude: parsedRouteCoordinates[0].latitude,
          longitude: parsedRouteCoordinates[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      }
      
      // Show achievements after a delay
      setTimeout(() => {
        setShowAchievements(true);
      }, 1000);
    } else {
      // Hide animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      setShowAchievements(false);
    }
  }, [visible, slideAnim, parsedRouteCoordinates]);
  
  const handleRequestMapSnapshot = async () => {
    if (mapRef.current && parsedRouteCoordinates.length > 0) {
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
  
  if (!workoutSummary) return null;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }
            ]
          }
        ]}
        ref={containerRef}
      >
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Workout Complete!</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        <ScrollView style={styles.content}>
          <View style={styles.congratsContainer}>
            <Text style={styles.congratsText}>Great job!</Text>
            <Text style={styles.congratsSubtext}>
              You've completed your {workoutSummary.type.toLowerCase()} workout
            </Text>
            {workoutRank && (
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>
                  This workout ranks #{workoutRank.distanceRank} out of {workoutRank.total} for distance
                </Text>
              </View>
            )}
          </View>
          
          {/* Program Info Section */}
          {isProgramWorkout && programInfo && (
            <View style={styles.programContainer}>
              <View style={styles.programHeader}>
                <Ionicons name="fitness" size={22} color="#4CAF50" />
                <Text style={styles.programTitle}>{programInfo.title}</Text>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${(programProgress?.new || 0) * 100}%` }
                    ]} 
                  />
                  {programProgress && programProgress.previous < programProgress.new && (
                    <View 
                      style={[
                        styles.progressBarPrevious, 
                        { 
                          width: `${programProgress.previous * 100}%`,
                          right: `${100 - (programProgress.previous * 100)}%`
                        }
                      ]} 
                    />
                  )}
                </View>
                <Text style={styles.progressText}>
                  Week {programInfo.currentWeek} of {programInfo.totalWeeks}
                </Text>
                <Text style={styles.progressPercentage}>
                  {Math.round((programProgress?.new || 0) * 100)}% Complete
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.programButton}
                onPress={handleProgramDetails}
              >
                <Text style={styles.programButtonText}>View Program Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Map Section */}
          {parsedRouteCoordinates.length > 0 && mapRegion && (
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={mapRegion}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Polyline
                  coordinates={parsedRouteCoordinates}
                  strokeWidth={4}
                  strokeColor="#4CAF50"
                />
                {parsedRouteCoordinates.length > 0 && (
                  <>
                    <Marker 
                      coordinate={parsedRouteCoordinates[0]} 
                      title="Start"
                      pinColor="green"
                    />
                    <Marker 
                      coordinate={parsedRouteCoordinates[parsedRouteCoordinates.length - 1]} 
                      title="Finish"
                      pinColor="red"
                    />
                  </>
                )}
              </MapView>
            </View>
          )}
          
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutSummary.distance}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutSummary.duration}</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutSummary.calories}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutSummary.steps}</Text>
                <Text style={styles.statLabel}>Steps</Text>
              </View>
            </View>
          </View>
          
          {/* Achievements Section */}
          {showAchievements && achievements.length > 0 && (
            <Animated.View 
              style={[
                styles.achievementsContainer,
                {
                  opacity: new Animated.Value(1),
                  transform: [{ scale: new Animated.Value(1) }]
                }
              ]}
              entering={Animated.spring({ 
                from: { opacity: 0, scale: 0.9 }, 
                to: { opacity: 1, scale: 1 },
                useNativeDriver: true,
                delay: 300
              })}
            >
              <Text style={styles.achievementsTitle}>Achievements</Text>
              
              {achievements.map((achievement, index) => (
                <Animated.View 
                  key={index}
                  style={styles.achievement}
                  entering={Animated.spring({
                    from: { opacity: 0, translateX: 50 },
                    to: { opacity: 1, translateX: 0 },
                    useNativeDriver: true,
                    delay: 300 + (index * 150)
                  })}
                >
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                    <Ionicons name={achievement.icon} size={24} color={achievement.color} />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Ionicons name="save-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>
                {isSaving ? 'Saving...' : 'Save Workout'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={20} color="#4CAF50" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={onClose}
            >
              <Ionicons name="close-outline" size={20} color="#4CAF50" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <SocialShareModal 
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          workout={formattedWorkout}
          mapSnapshot={mapSnapshot}
          onMapSnapshotRequest={handleRequestMapSnapshot}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
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
  closeButton: {
    padding: 5,
  },
  shareButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  congratsContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  congratsSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  rankContainer: {
    marginTop: 8,
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rankText: {
    color: '#673AB7',
    fontWeight: 'bold',
  },
  programContainer: {
    margin: 15,
    backgroundColor: '#F1F8E9',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#33691E',
    marginLeft: 8,
  },
  progressContainer: {
    marginVertical: 5,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressBarPrevious: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#AED581',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#33691E',
    marginTop: 8,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#33691E',
    marginTop: 2,
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  programButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginRight: 5,
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
  statsContainer: {
    margin: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  achievementsContainer: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
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
  achievementDesc: {
    fontSize: 14,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
    marginTop: 0,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  actionButtonTextSecondary: {
    color: '#4CAF50',
  },
});

export default WorkoutCompletionModal; 