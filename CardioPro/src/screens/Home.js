import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth/AuthContext';

const Home = ({ navigation, route }) => {
  // Get current date formatted nicely.
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Motivational quote
  const motivationalQuote = "Push yourself, because no one else is going to do it for you.";

  // Get user info from auth; only use displayName for the welcome greeting.
  const { user } = useAuth();
  const greetingName = user && user.displayName ? user.displayName : "Athlete";

  // Initialize today's activity summary; default as zeroed-out stats.
  const [workoutSummary, setWorkoutSummary] = useState({
    duration: "0 min",
    distance: "0 km",
    pace: "0:00 /km",
    calories: "0 kcal"
  });

  // When returning from WorkoutTracking, update the summary
  useEffect(() => {
    if (route && route.params && route.params.workoutSummary) {
      setWorkoutSummary(route.params.workoutSummary);
    }
  }, [route]);

  // Dummy recommended workouts data.
  const recommendedWorkouts = [
    { title: "HIIT Blast", description: "High intensity interval training", duration: "30 min" },
    { title: "Morning Run", description: "Easy run to kickstart your day", duration: "20 min" },
    { title: "Strength Training", description: "Build muscle and burn fat", duration: "40 min" },
  ];

  // Dummy achievements data.
  const achievements = [
    { title: "First Run", description: "Completed your first run!" },
    { title: "5K Master", description: "Achieved a 5K run in under 30 minutes!" }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {greetingName}</Text>
          <Text style={styles.date}>{currentDate}</Text>
          <Text style={styles.quote}>{motivationalQuote}</Text>
        </View>

        {/* Workout Summary Section */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workoutSummary.duration}</Text>
              <Text style={styles.summaryLabel}>Duration</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workoutSummary.distance}</Text>
              <Text style={styles.summaryLabel}>Distance</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workoutSummary.pace}</Text>
              <Text style={styles.summaryLabel}>Pace</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{workoutSummary.calories}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
          </View>
        </View>

        {/* Start Workout Button */}
        <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('WorkoutTracking')}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>

        {/* Recommended Workouts Section */}
        <View style={styles.workoutContainer}>
          <Text style={styles.sectionTitle}>Recommended Workouts</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {recommendedWorkouts.map((workout, index) => (
              <View key={index} style={styles.workoutCard}>
                <Text style={styles.workoutTitle}>{workout.title}</Text>
                <Text style={styles.workoutDescription}>{workout.description}</Text>
                <Text style={styles.workoutDuration}>{workout.duration}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map((achieve, index) => (
            <View key={index} style={styles.achievementCard}>
              <Text style={styles.achievementTitle}>{achieve.title}</Text>
              <Text style={styles.achievementDescription}>{achieve.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  quote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    marginLeft: 20,
  },
  summaryContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#388E3C',
    marginTop: 5,
  },
  startButton: {
    backgroundColor: '#FF5722',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  workoutContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  horizontalScroll: {
    paddingVertical: 10,
  },
  workoutCard: {
    backgroundColor: '#F1F8E9',
    padding: 15,
    borderRadius: 10,
    marginRight: 15,
    width: Dimensions.get('window').width / 2.5,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33691E',
  },
  workoutDescription: {
    fontSize: 12,
    color: '#33691E',
    marginVertical: 5,
  },
  workoutDuration: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#33691E',
  },
  achievementsContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  achievementCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#E65100',
    marginTop: 5,
  },
});

export default Home;
