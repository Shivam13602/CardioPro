import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

const SocialShareModal = ({ 
  visible, 
  onClose, 
  workout, 
  mapSnapshot = null, 
  onMapSnapshotRequest 
}) => {
  const [processing, setProcessing] = useState(false);
  const [captureRef, setCaptureRef] = useState(null);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
  
  const shareWorkout = async (platform) => {
    if (!workout) return;
    
    try {
      setProcessing(true);
      
      let message = `I just completed a ${workout.type} with CardioPro! 🏃‍♂️\n\n`;
      message += `Distance: ${workout.distance} km\n`;
      message += `Duration: ${formatDuration(workout.duration)}\n`;
      message += `Calories: ${workout.calories}\n`;
      message += `Steps: ${workout.steps}\n\n`;
      message += `#CardioPro #Fitness #Workout`;
      
      // Use ViewShot to capture the workout card if needed
      let imageUrl = null;
      
      if (captureRef && platform !== 'text') {
        try {
          // Request map snapshot if not available
          if (!mapSnapshot && onMapSnapshotRequest) {
            await onMapSnapshotRequest();
          }
          
          // Capture the workout card
          const uri = await captureRef.capture();
          imageUrl = uri;
        } catch (error) {
          console.error('Error capturing workout card:', error);
        }
      }
      
      // Share based on platform
      switch (platform) {
        case 'text':
          await Share.share({ message });
          break;
          
        case 'image':
          if (imageUrl) {
            if (Platform.OS === 'ios') {
              await Sharing.shareAsync(imageUrl);
            } else {
              await Share.share({
                message,
                url: imageUrl
              });
            }
          } else {
            await Share.share({ message });
          }
          break;
          
        default:
          await Share.share({ message });
      }
      
    } catch (error) {
      console.error('Error sharing workout:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  if (!workout) return null;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Share Your Workout</Text>
          
          <ViewShot
            ref={ref => setCaptureRef(ref)}
            options={{ format: 'jpg', quality: 0.9 }}
            style={styles.workoutCardContainer}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.workoutCard}
            >
              <View style={styles.workoutCardHeader}>
                <Text style={styles.workoutCardTitle}>{workout.type} Workout</Text>
                <Text style={styles.workoutCardDate}>{formatDate(workout.date)}</Text>
              </View>
              
              {mapSnapshot && (
                <Image 
                  source={{ uri: mapSnapshot }} 
                  style={styles.mapImage}
                  resizeMode="cover"
                />
              )}
              
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
                  <Text style={styles.statValue}>{workout.calories}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{workout.steps}</Text>
                  <Text style={styles.statLabel}>Steps</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>Tracked with CardioPro</Text>
              </View>
            </LinearGradient>
          </ViewShot>
          
          <View style={styles.shareOptions}>
            <TouchableOpacity 
              style={styles.shareOption}
              onPress={() => shareWorkout('text')}
              disabled={processing}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="chatbubble-outline" size={24} color="#0288D1" />
              </View>
              <Text style={styles.shareOptionText}>Text Only</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareOption}
              onPress={() => shareWorkout('image')}
              disabled={processing}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="share-social-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.shareOptionText}>With Image</Text>
            </TouchableOpacity>
          </View>
          
          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.processingText}>Preparing to share...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  workoutCardContainer: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  workoutCard: {
    padding: 15,
    borderRadius: 15,
  },
  workoutCardHeader: {
    marginBottom: 15,
  },
  workoutCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  workoutCardDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mapImage: {
    height: 150,
    width: '100%',
    borderRadius: 10,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardFooter: {
    alignItems: 'center',
    marginTop: 5,
  },
  cardFooterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  shareOption: {
    alignItems: 'center',
    width: '40%',
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareOptionText: {
    fontSize: 14,
    color: '#333',
  },
  processingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default SocialShareModal; 