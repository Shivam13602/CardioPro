import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';

// Auth Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
// User Context
import { UserProvider } from './src/contexts/UserContext';
// Training Program Context
import { TrainingProgramProvider } from './src/contexts/TrainingProgramContext'; 
// Workout Context
import { WorkoutProvider } from './src/contexts/WorkoutContext';

// Auth Screens
import Login from './src/screens/auth/Login';
import Signup from './src/screens/auth/Signup';

// Main Screens
import Home from './src/screens/Home';
import WorkoutTracking from './src/screens/WorkoutTracking';
import WorkoutDetails from './src/screens/WorkoutDetails';
import TrainingPrograms from './src/screens/TrainingPrograms';
import ProgramDetails from './src/screens/ProgramDetails';
import EditProgramDetails from './src/screens/EditProgramDetails';
import Profile from './src/screens/Profile';
import EditProfile from './src/screens/EditProfile';

// Create a simple WorkoutHistory component since it's missing
const WorkoutHistory = ({ navigation }) => {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>Workout History Screen</Text>
        <Text style={{ marginHorizontal: 20, textAlign: 'center', color: '#666', marginBottom: 30 }}>
          This screen is under development. It will display all your workout history.
        </Text>
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#4CAF50',
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 25,
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'TrainingPrograms':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen 
        name="TrainingPrograms" 
        component={TrainingPrograms}
        options={{ title: 'Programs' }}
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; 
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Signup" component={Signup} />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen 
              name="WorkoutTracking" 
              component={WorkoutTracking}
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom'
              }}
            />
            <Stack.Screen 
              name="WorkoutDetails" 
              component={WorkoutDetails}
              options={{
                presentation: 'card',
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen 
              name="ProgramDetails" 
              component={ProgramDetails}
              options={{
                presentation: 'card',
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen 
              name="EditProgramDetails" 
              component={EditProgramDetails}
              options={{
                presentation: 'card',
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfile}
              options={{
                presentation: 'card',
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen 
              name="WorkoutHistory" 
              component={WorkoutHistory}
              options={{
                presentation: 'card',
                animation: 'slide_from_right'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <TrainingProgramProvider>
          <WorkoutProvider>
            <SafeAreaProvider>
              <StatusBar style="dark" />
              <Navigation />
            </SafeAreaProvider>
          </WorkoutProvider>
        </TrainingProgramProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;
