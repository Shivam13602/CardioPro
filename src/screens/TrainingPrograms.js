import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTrainingProgram } from '../contexts/TrainingProgramContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { validateProgram, inspectObject } from '../utils/debugUtils';

const TrainingPrograms = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    programs, 
    userPrograms, 
    loading, 
    userProgramsLoading,
    error, 
    enrollInProgram, 
    isEnrolledInProgram,
    refreshPrograms,
    refreshUserPrograms
  } = useTrainingProgram();
  
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Reset selected program when programs change
  useEffect(() => {
    setSelectedProgram(null);
  }, [programs]);

  // Load programs once at the beginning
  useEffect(() => {
    if (user && initialLoad) {
      try {
        refreshPrograms();
        refreshUserPrograms();
        setInitialLoad(false);
      } catch (error) {
        console.error('Error loading programs:', error);
        setInitialLoad(false);
      }
    }
  }, [user, refreshPrograms, refreshUserPrograms, initialLoad]);

  // Add this useEffect to check if user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // For now, we're using a simple check - you could implement a proper admin check via Firebase claims
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

  // Handle refresh control
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('TrainingPrograms - Manual refresh requested');
      await Promise.all([
        refreshPrograms(),
        refreshUserPrograms()
      ]);
      
      // Validate programs after refresh
      if (programs.length > 0) {
        console.log(`Validating ${programs.length} programs after refresh`);
        programs.forEach(program => validateProgram(program));
      } else {
        console.warn('No programs available after refresh');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshPrograms, refreshUserPrograms, programs]);

  const renderProgramCard = (program) => {
    // Validate program data for debugging
    if (__DEV__) {
      if (!program || !program.id) {
        console.error('Invalid program passed to renderProgramCard:', program);
        return null;
      }
      
      // Check for essential fields
      const missingFields = [];
      ['title', 'description', 'difficulty', 'duration'].forEach(field => {
        if (!program[field]) missingFields.push(field);
      });
      
      if (missingFields.length > 0) {
        console.warn(`Program ${program.id} is missing fields:`, missingFields);
      }
    }
    
    const isSelected = selectedProgram?.id === program.id;
    const isEnrolled = isEnrolledInProgram(program.id);
    const userProgram = userPrograms.find(p => p.programId === program.id && p.isActive !== false);
    
    const handleProgramPress = () => {
      setSelectedProgram(program);
      
      // Navigate directly to program details on press
      navigation.navigate('ProgramDetails', { programId: program.id });
    };
    
    const handleProgramLongPress = () => {
      // On long press, just select the program without navigating
      setSelectedProgram(program);
    };
    
    return (
      <TouchableOpacity
        key={program.id}
        style={[
          styles.programCard, 
          isSelected && styles.selectedCard,
          isEnrolled && styles.enrolledCard
        ]}
        onPress={handleProgramPress}
        onLongPress={handleProgramLongPress}
        delayLongPress={500}
      >
        {isEnrolled && (
          <View style={styles.enrolledBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.enrolledText}>Enrolled</Text>
          </View>
        )}
        
        <View style={styles.programHeader}>
          <View>
            <Text style={styles.programTitle}>{program.title}</Text>
            <Text style={styles.programDuration}>{program.duration}</Text>
          </View>
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(program.difficulty) }
          ]}>
            <Text style={styles.difficultyText}>{program.difficulty}</Text>
          </View>
        </View>
        
        <Text style={styles.programDescription}>{program.description}</Text>
        
        {isEnrolled && userProgram && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Your Progress</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${Math.round(userProgram.progress * 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(userProgram.progress * 100)}%
            </Text>
            <Text style={styles.currentWeekText}>
              Week {userProgram.currentWeek} of {program.durationWeeks || '?'}
            </Text>
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.statText}>{program.enrollments || 0} enrolled</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.statText}>{program.workoutsPerWeek || 3} workouts/week</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch ((difficulty || "").toLowerCase()) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FFA000';
      case 'advanced':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const handleStartProgram = async () => {
    if (!selectedProgram) return;
    
    const isAlreadyEnrolled = isEnrolledInProgram(selectedProgram.id);
    
    if (isAlreadyEnrolled) {
      // If already enrolled, navigate to program details
      navigation.navigate('ProgramDetails', { 
        programId: selectedProgram.id
      });
    } else {
      // If not enrolled, ask if they want to view details or enroll
      Alert.alert(
        selectedProgram.title,
        'Would you like to view program details or enroll now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'View Details', 
            onPress: () => navigation.navigate('ProgramDetails', { programId: selectedProgram.id }) 
          },
          { text: 'Enroll Now', onPress: () => handleEnrollment() },
        ]
      );
    }
  };
  
  const handleEnrollment = async () => {
    if (!selectedProgram) return;
    
    try {
      setEnrolling(true);
      await enrollInProgram(selectedProgram.id);
      
      Alert.alert(
        'Enrollment Successful',
        `You've been enrolled in "${selectedProgram.title}"!`,
        [{ text: 'OK', onPress: () => {
          const userProgram = userPrograms.find(p => p.programId === selectedProgram.id);
          navigation.navigate('ProgramDetails', { 
            program: selectedProgram,
            userProgram: userProgram 
          });
        }}]
      );
    } catch (error) {
      Alert.alert('Enrollment Failed', error.message);
    } finally {
      setEnrolling(false);
    }
  };
  
  const renderUserEnrolledPrograms = () => {
    if (userPrograms.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.enrolledSection}>
        <Text style={styles.sectionTitle}>Your Programs</Text>
        {userPrograms.map(userProgram => {
          // Find the full program details
          const fullProgram = programs.find(p => p.id === userProgram.programId);
          if (!fullProgram) return null;
          
          return (
            <TouchableOpacity
              key={userProgram.id}
              style={[styles.enrolledProgramCard]}
              onPress={() => navigation.navigate('ProgramDetails', { 
                program: fullProgram,
                userProgram: userProgram 
              })}
            >
              <View style={styles.enrolledProgramHeader}>
                <Text style={styles.enrolledProgramTitle}>{userProgram.programTitle}</Text>
                <View style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(userProgram.programDifficulty) }
                ]}>
                  <Text style={styles.difficultyText}>{userProgram.programDifficulty}</Text>
                </View>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${Math.round(userProgram.progress * 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(userProgram.progress * 100)}% complete
                </Text>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={() => navigation.navigate('ProgramDetails', { 
                    program: fullProgram,
                    userProgram: userProgram 
                  })}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Only show loading on initial load, not when already showing data
  if (loading && programs.length === 0 && initialLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading programs...</Text>
      </View>
    );
  }

  // Debug console logs
  console.log('TrainingPrograms render:', { 
    programCount: programs.length, 
    userProgramCount: userPrograms.length, 
    loading, 
    error 
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Training Programs</Text>
        
        {isAdmin && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('EditProgramDetails')}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.programsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Show loading indicator for user programs only if there's data to show */}
        {userProgramsLoading && userPrograms.length === 0 ? (
          <ActivityIndicator color="#4CAF50" style={styles.sectionLoading} />
        ) : (
          renderUserEnrolledPrograms()
        )}
        
        <View style={styles.allProgramsSection}>
          <Text style={styles.sectionTitle}>All Programs</Text>
          
          {loading && programs.length === 0 ? (
            <ActivityIndicator color="#4CAF50" style={styles.programsLoading} />
          ) : programs.length === 0 ? (
            <View style={styles.noProgramsContainer}>
              <Text style={styles.noProgramsText}>No training programs available.</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={refreshPrograms}
              >
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            programs.map(program => renderProgramCard(program))
          )}
        </View>
      </ScrollView>

      {selectedProgram && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.startButton, enrolling && styles.disabledButton]}
            onPress={handleStartProgram}
            disabled={enrolling}
          >
            {enrolling ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.startButtonText}>
                {isEnrolledInProgram(selectedProgram.id) ? 'Continue Program' : 'Start Program'}
              </Text>
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  programsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionLoading: {
    marginVertical: 20,
  },
  enrolledSection: {
    marginBottom: 30,
  },
  allProgramsSection: {
    marginBottom: 100, // Extra space for bottom bar
  },
  enrolledProgramCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  enrolledProgramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  enrolledProgramTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  enrolledCard: {
    position: 'relative',
  },
  enrolledBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  enrolledText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  programTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  programDuration: {
    fontSize: 14,
    color: '#666',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  programDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  progressContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  currentWeekText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  buttonContainer: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  noProgramsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 20,
  },
  noProgramsText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  programsLoading: {
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TrainingPrograms; 