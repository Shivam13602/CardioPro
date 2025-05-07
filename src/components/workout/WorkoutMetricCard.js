import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * WorkoutMetricCard - A component that displays a workout metric with an icon
 * 
 * @param {string} icon - MaterialCommunityIcons icon name
 * @param {string|number} value - Metric value to display
 * @param {string} unit - Unit of measurement (e.g., 'km', 'kcal')
 * @param {string} label - Name of the metric
 * @param {string} color - Accent color (optional)
 * @returns {JSX.Element} - Card component
 */
const WorkoutMetricCard = ({ icon, value, unit, label, color = '#4CAF50' }) => {
  return (
    <View style={styles.metricCard}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.valueContainer}>
          <Text style={styles.metricValue}>{value}</Text>
          {unit ? <Text style={styles.metricUnit}>{unit}</Text> : null}
        </View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    width: '48%', // Designed to fit 2 per row
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 3,
  },
  metricUnit: {
    fontSize: 12,
    color: '#666',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default WorkoutMetricCard; 