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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { Picker } from '@react-native-picker/picker';

const EditProfile = ({ navigation }) => {
  const { 
    user, 
    profile, 
    updateUserProfile, 
    loading: userLoading, 
    error: userError 
  } = useUser();

  const [formData, setFormData] = useState({
    displayName: '',
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate',
    fitnessGoal: 'general',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form with existing profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || user?.displayName || '',
        weight: profile.weight ? profile.weight.toString() : '',
        height: profile.height ? profile.height.toString() : '',
        age: profile.age ? profile.age.toString() : '',
        gender: profile.gender || 'male',
        activityLevel: profile.activityLevel || 'moderate',
        fitnessGoal: profile.fitnessGoal || 'general',
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate inputs - Use user's current display name as fallback
      if (!formData.displayName.trim()) {
        // Instead of throwing an error, use the current user display name if available
        if (user?.displayName) {
          formData.displayName = user.displayName;
        } else if (profile?.displayName) {
          formData.displayName = profile.displayName;
        } else {
          formData.displayName = "User " + Math.floor(Math.random() * 10000);
        }
      }

      const weight = parseFloat(formData.weight);
      const height = parseFloat(formData.height);
      const age = parseInt(formData.age);

      if (isNaN(weight) || weight <= 0) {
        throw new Error('Please enter a valid weight');
      }

      if (isNaN(height) || height <= 0) {
        throw new Error('Please enter a valid height');
      }

      if (isNaN(age) || age <= 0) {
        throw new Error('Please enter a valid age');
      }

      // Prepare profile data
      const profileData = {
        ...formData,
        weight: weight,
        height: height,
        age: age,
        updatedAt: new Date(),
      };

      const success = await updateUserProfile(profileData);
      
      if (success) {
        Alert.alert(
          'Profile Updated',
          'Your profile has been successfully updated!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
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
          {(error || userError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || userError}</Text>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={formData.displayName}
                onChangeText={(value) => handleInputChange('displayName', value)}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Fitness Metrics</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.weight}
                  onChangeText={(value) => handleInputChange('weight', value)}
                  placeholder="70"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.height}
                  onChangeText={(value) => handleInputChange('height', value)}
                  placeholder="175"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                placeholder="30"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.activityLevel}
                  onValueChange={(value) => handleInputChange('activityLevel', value)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Sedentary (little or no exercise)" value="sedentary" />
                  <Picker.Item label="Light (1-3 days/week)" value="light" />
                  <Picker.Item label="Moderate (3-5 days/week)" value="moderate" />
                  <Picker.Item label="Active (6-7 days/week)" value="active" />
                  <Picker.Item label="Very Active (2x/day)" value="very_active" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fitness Goal</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.fitnessGoal}
                  onValueChange={(value) => handleInputChange('fitnessGoal', value)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="General Fitness" value="general" />
                  <Picker.Item label="Weight Loss" value="weight_loss" />
                  <Picker.Item label="Muscle Gain" value="muscle_gain" />
                  <Picker.Item label="Improve Cardio" value="cardio" />
                  <Picker.Item label="Train for Event" value="event" />
                </Picker>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading || userLoading}
        >
          {loading || userLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
  inputContainer: {
    marginBottom: 15,
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

export default EditProfile; 