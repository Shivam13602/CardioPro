/**
 * Constants for workout types and their properties
 */

// Workout types with associated metadata
export const WORKOUT_TYPES = [
  {
    id: 'running',
    type: 'Running',
    icon: '🏃',
    description: 'Track your runs with GPS',
    defaultTarget: {
      distance: 5, // in km
      duration: 30 // in minutes
    },
    color: '#FF5722',
    met: 8.0 // Metabolic equivalent value for calorie calculations
  },
  {
    id: 'walking',
    type: 'Walking',
    icon: '🚶',
    description: 'Track your walks',
    defaultTarget: {
      distance: 3, // in km
      duration: 45 // in minutes
    },
    color: '#4CAF50',
    met: 4.0
  },
  {
    id: 'cycling',
    type: 'Cycling',
    icon: '🚲',
    description: 'Track your bike rides',
    defaultTarget: {
      distance: 10, // in km
      duration: 45 // in minutes
    },
    color: '#2196F3',
    met: 6.0
  },
  {
    id: 'hiit',
    type: 'HIIT',
    icon: '🔥',
    description: 'High-intensity interval training',
    defaultTarget: {
      duration: 20 // in minutes
    },
    color: '#F44336',
    met: 7.0
  },
  {
    id: 'swimming',
    type: 'Swimming',
    icon: '🏊',
    description: 'Track your swims',
    defaultTarget: {
      distance: 1, // in km
      duration: 30 // in minutes
    },
    color: '#03A9F4',
    met: 6.0
  },
  {
    id: 'strength',
    type: 'Strength',
    icon: '💪',
    description: 'Weight and resistance training',
    defaultTarget: {
      duration: 45 // in minutes
    },
    color: '#9C27B0',
    met: 5.0
  },
  {
    id: 'yoga',
    type: 'Yoga',
    icon: '🧘',
    description: 'Track your yoga sessions',
    defaultTarget: {
      duration: 30 // in minutes
    },
    color: '#009688',
    met: 3.0
  }
];

// Get workout type by ID
export const getWorkoutTypeById = (id) => {
  return WORKOUT_TYPES.find(workout => workout.id === id) || WORKOUT_TYPES[0];
};

// Get workout type by name
export const getWorkoutTypeByName = (name) => {
  return WORKOUT_TYPES.find(workout => workout.type === name) || WORKOUT_TYPES[0];
};

// Get workout MET value (for calorie calculations)
export const getWorkoutMET = (type) => {
  const workout = WORKOUT_TYPES.find(w => w.type === type || w.id === type);
  return workout ? workout.met : 4.0; // Default to walking MET if not found
};

// Get all workout types (useful for dropdowns and lists)
export const getAllWorkoutTypes = () => {
  return WORKOUT_TYPES.map(workout => workout.type);
};

// Check if a workout type is valid
export const isValidWorkoutType = (type) => {
  return WORKOUT_TYPES.some(workout => workout.type === type || workout.id === type);
}; 