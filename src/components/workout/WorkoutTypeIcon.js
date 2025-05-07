import React from 'react';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

/**
 * WorkoutTypeIcon - A component that displays an icon based on workout type
 * 
 * @param {string} type - The workout type (e.g., 'Running', 'Walking', 'Cycling', 'HIIT')
 * @param {number} size - Icon size
 * @param {string} color - Icon color (optional)
 * @returns {JSX.Element} - Icon component
 */
const WorkoutTypeIcon = ({ type, size = 24, color = '#4CAF50' }) => {
  // Map workout types to appropriate icons
  const getIconForType = () => {
    switch (type) {
      case 'Running':
        return <FontAwesome5 name="running" size={size} color={color} />;
      case 'Walking':
        return <FontAwesome5 name="walking" size={size} color={color} />;
      case 'Cycling':
        return <Ionicons name="bicycle" size={size} color={color} />;
      case 'HIIT':
        return <FontAwesome5 name="fire" size={size} color={color} />;
      case 'Swimming':
        return <FontAwesome5 name="swimmer" size={size} color={color} />;
      case 'Strength':
        return <FontAwesome5 name="dumbbell" size={size} color={color} />;
      case 'Yoga':
        return <FontAwesome5 name="peace" size={size} color={color} />;
      default:
        return <Ionicons name="fitness" size={size} color={color} />;
    }
  };

  return (
    <View style={styles.iconContainer}>
      {getIconForType()}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default WorkoutTypeIcon; 