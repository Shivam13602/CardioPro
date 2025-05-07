import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTrainingProgram } from '../contexts/TrainingProgramContext';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';

const EditProgramDetails = ({ navigation, route }) => {
  const { program } = route.params || {};
  const isEditing = !!program;
  
  const { 
    createProgram,
    updateProgram,
    loading: programLoading,
    error: programError 
  } = useTrainingProgram();
  
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    duration: '4 weeks',
    programType: 'general',
    isPublic: true,
    weeklySchedule: []
  });
  
  // Initialize form with existing program data if editing
  useEffect(() => {
    if (isEditing && program) {
      let weeklySchedule = [];
      
      // Parse the weekly schedule if it's a string
      if (program.weeklySchedule) {
        try {
          weeklySchedule = typeof program.weeklySchedule === 'string' 
            ? JSON.parse(program.weeklySchedule) 
            : program.weeklySchedule;
        } catch (e) {
          console.error('Error parsing weekly schedule:', e);
          weeklySchedule = [];
        }
      }
      
      setFormData({
        title: program.title || '',
        description: program.description || '',
        difficulty: program.difficulty || 'beginner',
        duration: program.duration || '4 weeks',
        programType: program.programType || 'general',
        isPublic: program.isPublic !== false, // Default to true if not specified
        weeklySchedule: weeklySchedule.length ? weeklySchedule : [createEmptyWeek(1)]
      });
    } else {
      // Initialize with empty week for new program
      setFormData(prev => ({
        ...prev,
        weeklySchedule: [createEmptyWeek(1)]
      }));
    }
  }, [isEditing, program]);
  
  const createEmptyWeek = (weekNumber) => ({
    week: weekNumber,
    description: '',
    workouts: [createEmptyWorkout()]
  });
  
  const createEmptyWorkout = () => ({
    title: '',
    description: '',
    type: 'Running',
    duration: 30 // in minutes
  });
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleWeekChange = (weekIndex, field, value) => {
    setFormData(prev => {
      const updatedSchedule = [...prev.weeklySchedule];
      updatedSchedule[weekIndex] = {
        ...updatedSchedule[weekIndex],
        [field]: value
      };
      return {
        ...prev,
        weeklySchedule: updatedSchedule
      };
    });
  };
  
  const handleWorkoutChange = (weekIndex, workoutIndex, field, value) => {
    setFormData(prev => {
      const updatedSchedule = [...prev.weeklySchedule];
      updatedSchedule[weekIndex] = {
        ...updatedSchedule[weekIndex],
        workouts: [
          ...updatedSchedule[weekIndex].workouts.slice(0, workoutIndex),
          {
            ...updatedSchedule[weekIndex].workouts[workoutIndex],
            [field]: value
          },
          ...updatedSchedule[weekIndex].workouts.slice(workoutIndex + 1)
        ]
      };
      return {
        ...prev,
        weeklySchedule: updatedSchedule
      };
    });
  };
  
  const addWeek = () => {
    setFormData(prev => {
      const newWeekNumber = prev.weeklySchedule.length + 1;
      return {
        ...prev,
        weeklySchedule: [...prev.weeklySchedule, createEmptyWeek(newWeekNumber)]
      };
    });
  };
  
  const removeWeek = (weekIndex) => {
    if (formData.weeklySchedule.length <= 1) {
      Alert.alert('Cannot Remove', 'A program must have at least one week.');
      return;
    }
    
    setFormData(prev => {
      const updatedSchedule = prev.weeklySchedule
        .filter((_, index) => index !== weekIndex)
        .map((week, index) => ({
          ...week,
          week: index + 1 // Renumber weeks
        }));
      
      return {
        ...prev,
        weeklySchedule: updatedSchedule
      };
    });
  };
  
  const addWorkout = (weekIndex) => {
    setFormData(prev => {
      const updatedSchedule = [...prev.weeklySchedule];
      updatedSchedule[weekIndex] = {
        ...updatedSchedule[weekIndex],
        workouts: [...updatedSchedule[weekIndex].workouts, createEmptyWorkout()]
      };
      return {
        ...prev,
        weeklySchedule: updatedSchedule
      };
    });
  };
  
  const removeWorkout = (weekIndex, workoutIndex) => {
    if (formData.weeklySchedule[weekIndex].workouts.length <= 1) {
      Alert.alert('Cannot Remove', 'A week must have at least one workout.');
      return;
    }
    
    setFormData(prev => {
      const updatedSchedule = [...prev.weeklySchedule];
      updatedSchedule[weekIndex] = {
        ...updatedSchedule[weekIndex],
        workouts: updatedSchedule[weekIndex].workouts.filter((_, index) => index !== workoutIndex)
      };
      return {
        ...prev,
        weeklySchedule: updatedSchedule
      };
    });
  };
  
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Program title is required.');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Program description is required.');
      return false;
    }
    
    // Validate each week and workout
    for (let weekIndex = 0; weekIndex < formData.weeklySchedule.length; weekIndex++) {
      const week = formData.weeklySchedule[weekIndex];
      
      if (!week.description.trim()) {
        setError(`Week ${week.week} description is required.`);
        return false;
      }
      
      for (let workoutIndex = 0; workoutIndex < week.workouts.length; workoutIndex++) {
        const workout = week.workouts[workoutIndex];
        
        if (!workout.title.trim()) {
          setError(`Week ${week.week}, Workout ${workoutIndex + 1} title is required.`);
          return false;
        }
        
        if (!workout.description.trim()) {
          setError(`Week ${week.week}, Workout ${workoutIndex + 1} description is required.`);
          return false;
        }
        
        if (isNaN(workout.duration) || workout.duration <= 0) {
          setError(`Week ${week.week}, Workout ${workoutIndex + 1} needs a valid duration.`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!validateForm()) {
        setLoading(false);
        return;
      }
      
      // Prepare program data
      const programData = {
        ...formData,
        weeklySchedule: JSON.stringify(formData.weeklySchedule),
        authorId: user.uid,
        authorEmail: user.email,
        enrollments: isEditing ? program.enrollments || 0 : 0,
        // Only track these if we're creating a new program
        createdAt: isEditing ? program.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      let success = false;
      
      if (isEditing && program.id) {
        // Update existing program
        const updatedProgramId = await updateProgram(program.id, programData);
        success = !!updatedProgramId;
        
        if (success) {
          Alert.alert(
            'Program Updated',
            'Your training program has been successfully updated!',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          throw new Error('Failed to update program');
        }
      } else {
        // Create new program
        const programId = await createProgram(programData);
        success = !!programId;
        
        if (success) {
          Alert.alert(
            'Program Created',
            'Your training program has been successfully created!',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          throw new Error('Failed to create program');
        }
      }
    } catch (error) {
      console.error('Error saving program:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
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
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Program' : 'Create Program'}
          </Text>
          <View style={{ width: 24 }}>
            {/* Empty view for balance */}
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {(error || programError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || programError}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Program Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Program title"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Program description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.difficulty}
                  onValueChange={(value) => handleInputChange('difficulty', value)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Beginner" value="beginner" />
                  <Picker.Item label="Intermediate" value="intermediate" />
                  <Picker.Item label="Advanced" value="advanced" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(value) => handleInputChange('duration', value)}
                placeholder="e.g., 4 weeks"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Program Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.programType}
                  onValueChange={(value) => handleInputChange('programType', value)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="General Fitness" value="general" />
                  <Picker.Item label="Weight Loss" value="weight_loss" />
                  <Picker.Item label="Cardio" value="cardio" />
                  <Picker.Item label="5K Training" value="5k" />
                  <Picker.Item label="10K Training" value="10k" />
                  <Picker.Item label="Half Marathon" value="half_marathon" />
                  <Picker.Item label="Full Marathon" value="marathon" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Public Program</Text>
                <Switch
                  value={formData.isPublic}
                  onValueChange={(value) => handleInputChange('isPublic', value)}
                  trackColor={{ false: '#ccc', true: '#81b0ff' }}
                  thumbColor={formData.isPublic ? '#4CAF50' : '#f4f3f4'}
                  ios_backgroundColor="#ccc"
                />
              </View>
              <Text style={styles.helperText}>
                Public programs will be visible to all users
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Weekly Schedule</Text>
            
            {formData.weeklySchedule.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekContainer}>
                <View style={styles.weekHeader}>
                  <Text style={styles.weekTitle}>Week {week.week}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeWeek(weekIndex)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Week Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={week.description}
                    onChangeText={(value) => handleWeekChange(weekIndex, 'description', value)}
                    placeholder="Week description"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <Text style={styles.subSectionTitle}>Workouts</Text>
                
                {week.workouts.map((workout, workoutIndex) => (
                  <View key={`workout-${weekIndex}-${workoutIndex}`} style={styles.workoutContainer}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutTitle}>Workout {workoutIndex + 1}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeWorkout(weekIndex, workoutIndex)}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Title</Text>
                      <TextInput
                        style={styles.input}
                        value={workout.title}
                        onChangeText={(value) => handleWorkoutChange(weekIndex, workoutIndex, 'title', value)}
                        placeholder="Workout title"
                        placeholderTextColor="#999"
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Description</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={workout.description}
                        onChangeText={(value) => handleWorkoutChange(weekIndex, workoutIndex, 'description', value)}
                        placeholder="Workout description"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                    
                    <View style={styles.inputRow}>
                      <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Type</Text>
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={workout.type}
                            onValueChange={(value) => handleWorkoutChange(weekIndex, workoutIndex, 'type', value)}
                            style={styles.picker}
                            mode="dropdown"
                          >
                            <Picker.Item label="Running" value="Running" />
                            <Picker.Item label="Walking" value="Walking" />
                            <Picker.Item label="Cycling" value="Cycling" />
                            <Picker.Item label="HIIT" value="HIIT" />
                          </Picker>
                        </View>
                      </View>
                      
                      <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Text style={styles.label}>Duration (min)</Text>
                        <TextInput
                          style={styles.input}
                          value={workout.duration.toString()}
                          onChangeText={(value) => handleWorkoutChange(weekIndex, workoutIndex, 'duration', parseInt(value) || 0)}
                          placeholder="30"
                          placeholderTextColor="#999"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addWorkout(weekIndex)}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#4CAF50" />
                  <Text style={styles.addButtonText}>Add Workout</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity
              style={[styles.addButton, styles.addWeekButton]}
              onPress={addWeek}
            >
              <Ionicons name="add-circle-outline" size={18} color="#4CAF50" />
              <Text style={styles.addButtonText}>Add Week</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading || programLoading}
        >
          {loading || programLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Program' : 'Create Program'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FFCDD2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#555',
  },
  inputContainer: {
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 150 : 50,
    width: '100%',
  },
  weekContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  workoutContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  removeButton: {
    padding: 5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  addWeekButton: {
    marginTop: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 5,
  },
  bottomBar: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EditProgramDetails; 