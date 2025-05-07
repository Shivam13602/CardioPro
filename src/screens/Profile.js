import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../contexts/WorkoutContext';

const Profile = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { 
    profile, 
    loading, 
    calculateBMI, 
    getBMICategory, 
    calculateTDEE, 
    calculateMacros,
    getFitnessLevelText,
    getFitnessGoalText,
    formatWeight, 
    formatHeight,
    isProfileComplete
  } = useUser();
  
  const { workouts, getWorkoutStats } = useWorkout();
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalDuration: 0,
    totalCalories: 0,
    workoutCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadWorkoutStats();
    }
  }, [user, workouts]);

  const loadWorkoutStats = async () => {
    try {
      setStatsLoading(true);
      // Get stats for the last 30 days
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const workoutStats = await getWorkoutStats(startDate.toISOString(), endDate);
      
      if (workoutStats) {
        setStats(workoutStats);
      }
    } catch (error) {
      console.error('Error loading workout stats:', error);
      // Handle Firebase permission error gracefully
      if (error.toString().includes('Missing or insufficient permissions')) {
        // Set default stats when permissions are missing
        setStats({
          totalDistance: 0,
          totalDuration: 0,
          totalCalories: 0,
          workoutCount: 0
        });
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleSettings = () => {
    // Navigate to settings screen
    // navigation.navigate('Settings');
    alert('Settings screen not implemented yet');
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate BMI and related data
  const bmi = profile ? calculateBMI() : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const dailyCalorieNeeds = profile ? calculateTDEE() : null;
  const macros = profile ? calculateMacros() : null;
  const profileCompleted = isProfileComplete();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#2E7D32']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Profile Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image 
                source={{ uri: user.photoURL }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.profileName}>{profile?.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={18} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSettings}
            >
              <Ionicons name="settings-outline" size={18} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Health Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Metrics</Text>
          <View style={styles.card}>
            {profileCompleted ? (
              <>
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{formatWeight(profile.weight)}</Text>
                    <Text style={styles.metricLabel}>Weight</Text>
                  </View>
                  
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{formatHeight(profile.height)}</Text>
                    <Text style={styles.metricLabel}>Height</Text>
                  </View>
                  
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>{profile.age || '?'}</Text>
                    <Text style={styles.metricLabel}>Age</Text>
                  </View>
                </View>
                
                <View style={styles.fitnessLevelRow}>
                  <View style={styles.fitnessItem}>
                    <Text style={styles.fitnessLabel}>Fitness Level</Text>
                    <Text style={styles.fitnessValue}>{getFitnessLevelText()}</Text>
                  </View>
                  
                  <View style={styles.fitnessItem}>
                    <Text style={styles.fitnessLabel}>Fitness Goal</Text>
                    <Text style={styles.fitnessValue}>{getFitnessGoalText()}</Text>
                  </View>
                </View>
                
                {bmi && (
                  <View style={styles.bmiContainer}>
                    <View style={styles.bmiHeader}>
                      <Text style={styles.bmiTitle}>Body Mass Index (BMI)</Text>
                      <View 
                        style={[
                          styles.bmiCategoryBadge, 
                          { backgroundColor: bmiCategory?.color || '#4CAF50' }
                        ]}
                      >
                        <Text style={styles.bmiCategoryText}>
                          {bmiCategory?.category || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.bmiValue}>{bmi}</Text>
                    
                    <View style={styles.bmiScale}>
                      <View style={styles.bmiScaleBar}>
                        <View 
                          style={[
                            styles.bmiIndicator, 
                            { left: `${Math.min(100, Math.max(0, (bmi - 10) * 4))}%` }
                          ]} 
                        />
                      </View>
                      <View style={styles.bmiLabels}>
                        <Text style={styles.bmiScaleLabel}>Underweight</Text>
                        <Text style={styles.bmiScaleLabel}>Normal</Text>
                        <Text style={styles.bmiScaleLabel}>Overweight</Text>
                        <Text style={styles.bmiScaleLabel}>Obese</Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {dailyCalorieNeeds && (
                  <View style={styles.caloriesContainer}>
                    <Text style={styles.caloriesTitle}>
                      Estimated Daily Calorie Needs
                    </Text>
                    <Text style={styles.caloriesValue}>
                      {dailyCalorieNeeds} kcal
                    </Text>
                    
                    {macros && (
                      <View style={styles.macrosContainer}>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.protein}g</Text>
                          <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.carbs}g</Text>
                          <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                          <Text style={styles.macroValue}>{macros.fat}g</Text>
                          <Text style={styles.macroLabel}>Fat</Text>
                        </View>
                      </View>
                    )}
                    
                    <Text style={styles.caloriesNote}>
                      Based on your {profile.gender}, age, weight, height and activity level
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Complete your profile to see health metrics
                </Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={handleEditProfile}
                >
                  <Text style={styles.emptyStateButtonText}>
                    Complete Profile
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Workout Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 30 Days Activity</Text>
          <View style={styles.card}>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.workoutCount}</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalDistance.toFixed(1)} km</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.round(stats.totalDuration / 60)} min</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{Math.round(stats.totalCalories)}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                </View>
              </View>
            )}
            
            {stats.workoutCount > 0 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => alert('Workout History screen is not implemented yet')}
              >
                <Text style={styles.viewAllButtonText}>View All Workouts</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 15,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#4CAF50',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  fitnessLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fitnessItem: {
    flex: 1,
    padding: 5,
  },
  fitnessLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fitnessValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
  bmiContainer: {
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bmiTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  bmiCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bmiCategoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bmiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  bmiScale: {
    width: '100%',
  },
  bmiScaleBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 5,
    position: 'relative',
  },
  bmiIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    top: -3,
    transform: [{ translateX: -6 }],
  },
  bmiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bmiScaleLabel: {
    fontSize: 10,
    color: '#666',
  },
  caloriesContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  caloriesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 5,
  },
  macrosContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  macroItem: {
    alignItems: 'center', 
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  caloriesNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
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
  viewAllButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 5,
  },
  viewAllButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyStateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  signOutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});

export default Profile; 