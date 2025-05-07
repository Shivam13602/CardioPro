import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateProgram, diagnoseFirestore } from '../utils/debugUtils';

// Collection reference
const PROGRAMS_COLLECTION = 'training_programs';
const USER_PROGRAMS_COLLECTION = 'user_programs';

// Local storage keys
const LOCAL_PROGRAMS_KEY = 'cardio_pro_training_programs';
const LOCAL_USER_PROGRAMS_KEY = 'cardio_pro_user_programs';

// Create context
const TrainingProgramContext = createContext();

// Custom hook to use the training program context
export const useTrainingProgram = () => {
  const context = useContext(TrainingProgramContext);
  if (!context) {
    throw new Error('useTrainingProgram must be used within a TrainingProgramProvider');
  }
  return context;
};

export const TrainingProgramProvider = ({ children }) => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [userPrograms, setUserPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgramsLoading, setUserProgramsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Get the sample programs for use when Firebase is not available
  const getSamplePrograms = () => {
    return [
      {
        id: 'sample1',
        title: 'Couch to 5K',
        description: 'A beginner-friendly program to help you run 5K in 8 weeks.',
        programType: 'Running',
        difficulty: 'Beginner',
        duration: '8 weeks',
        durationWeeks: 8,
        workoutsPerWeek: 3,
        enrollments: 128,
        weeklySchedule: JSON.stringify([
          {
            week: 1,
            description: 'Getting started with alternating walking and jogging',
            workouts: [
              { title: 'Walk/Run Interval 1', type: 'Running', duration: 1800, description: '5 min walk, 1 min run, repeat 8 times' },
              { title: 'Recovery Walk', type: 'Walking', duration: 1200, description: '20 min easy walk' },
              { title: 'Walk/Run Interval 2', type: 'Running', duration: 1800, description: '5 min walk, 1 min run, repeat 8 times' }
            ]
          },
          {
            week: 2,
            description: 'Building endurance with longer running intervals',
            workouts: [
              { title: 'Walk/Run Interval', type: 'Running', duration: 1800, description: '3 min walk, 2 min run, repeat 6 times' },
              { title: 'Recovery Walk', type: 'Walking', duration: 1200, description: '20 min easy walk' },
              { title: 'Walk/Run Interval', type: 'Running', duration: 1800, description: '3 min walk, 2 min run, repeat 6 times' }
            ]
          }
        ])
      },
      {
        id: 'sample2',
        title: '10K Improver',
        description: 'Take your running to the next level with this intermediate 10K program.',
        programType: 'Running',
        difficulty: 'Intermediate',
        duration: '10 weeks',
        durationWeeks: 10,
        workoutsPerWeek: 4,
        enrollments: 85,
        weeklySchedule: JSON.stringify([
          {
            week: 1,
            description: 'Building your base with consistent running',
            workouts: [
              { title: 'Easy Run', type: 'Running', duration: 1800, description: '30 min at conversation pace' },
              { title: 'Interval Training', type: 'Running', duration: 2400, description: '10 min warm up, 8x400m fast with 200m recovery, 10 min cool down' },
              { title: 'Rest Day', type: 'Rest', duration: 0, description: 'Active recovery or complete rest' },
              { title: 'Long Run', type: 'Running', duration: 3600, description: '60 min at easy pace' }
            ]
          },
          {
            week: 2,
            description: 'Increasing mileage and introducing hill work',
            workouts: [
              { title: 'Easy Run', type: 'Running', duration: 2100, description: '35 min at conversation pace' },
              { title: 'Hill Repeats', type: 'Running', duration: 2400, description: '10 min warm up, 6x hill repeats, 10 min cool down' },
              { title: 'Rest Day', type: 'Rest', duration: 0, description: 'Active recovery or complete rest' },
              { title: 'Long Run', type: 'Running', duration: 4200, description: '70 min at easy pace' }
            ]
          }
        ])
      },
      {
        id: 'sample3',
        title: 'HIIT Cardio Challenge',
        description: 'High-intensity interval training to boost cardiovascular fitness and burn calories efficiently.',
        programType: 'HIIT',
        difficulty: 'Advanced',
        duration: '6 weeks',
        durationWeeks: 6,
        workoutsPerWeek: 3,
        enrollments: 156,
        weeklySchedule: JSON.stringify([
          {
            week: 1,
            description: 'Introduction to HIIT with moderate intensity intervals',
            workouts: [
              { title: 'HIIT Workout 1', type: 'HIIT', duration: 1200, description: '20 min: 30s work, 30s rest' },
              { title: 'Active Recovery', type: 'Walking', duration: 1800, description: '30 min easy activity' },
              { title: 'HIIT Workout 2', type: 'HIIT', duration: 1200, description: '20 min: 30s work, 30s rest' }
            ]
          }
        ])
      }
    ];
  };

  // Load cached programs on initial mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        // Load cached programs
        const cachedProgramsStr = await AsyncStorage.getItem(LOCAL_PROGRAMS_KEY);
        if (cachedProgramsStr) {
          const cachedPrograms = JSON.parse(cachedProgramsStr);
          setPrograms(cachedPrograms);
          setLoading(false);
        }
        
        // If user is logged in, load cached user programs
        if (user) {
          const cachedUserProgramsKey = `${LOCAL_USER_PROGRAMS_KEY}_${user.uid}`;
          const cachedUserProgramsStr = await AsyncStorage.getItem(cachedUserProgramsKey);
          if (cachedUserProgramsStr) {
            const cachedUserPrograms = JSON.parse(cachedUserProgramsStr);
            setUserPrograms(cachedUserPrograms);
            setUserProgramsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading cached programs:', error);
        // Continue with empty programs
      }
    };
    
    loadCachedData();
  }, []);

  // Load programs when user changes
  useEffect(() => {
    if (user) {
      setHasAttemptedLoad(false);
      loadPrograms();
      loadUserPrograms();
    } else {
      setUserPrograms([]);
      setHasAttemptedLoad(false);
    }
  }, [user]);

  // Load all available training programs
  const loadPrograms = async () => {
    // Diagnose Firestore connection issues
    try {
      await diagnoseFirestore(firestore);
    } catch (err) {
      console.error('Error diagnosing Firestore:', err);
    }
    
    // Skip loading if we've already attempted once and hit permission errors
    if (hasAttemptedLoad && error && error.includes('permission')) {
      console.log('Skipping program reload due to previous permission errors');
      // Ensure sample programs are set
      if (programs.length === 0) {
        const samplePrograms = getSamplePrograms();
        setPrograms(samplePrograms);
        try {
          await AsyncStorage.setItem(LOCAL_PROGRAMS_KEY, JSON.stringify(samplePrograms));
        } catch (cacheError) {
          console.error('Error caching sample programs:', cacheError);
        }
      }
      setLoading(false);
      return;
    }
    
    // Set loading to true only if we don't have any programs loaded yet
    if (programs.length === 0) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      const programsCollection = collection(firestore, PROGRAMS_COLLECTION);
      // Simple query without ordering to avoid index requirements
      const q = query(programsCollection);
      
      try {
        const querySnapshot = await getDocs(q);
        const programsList = [];
        
        querySnapshot.forEach((doc) => {
          // Add default fields to ensure the data is complete
          programsList.push({
            id: doc.id,
            title: doc.data().title || 'Unnamed Program',
            description: doc.data().description || 'No description available',
            difficulty: doc.data().difficulty || 'beginner',
            duration: doc.data().duration || '4 weeks',
            durationWeeks: doc.data().durationWeeks || 4,
            programType: doc.data().programType || 'general',
            isPublic: doc.data().isPublic !== false,
            workoutsPerWeek: doc.data().workoutsPerWeek || 3,
            enrollments: doc.data().enrollments || 0,
            weeklySchedule: doc.data().weeklySchedule || '[]',
            ...doc.data()
          });
        });
        
        // Sort by createdAt in JavaScript after fetching
        programsList.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
          return dateB - dateA; // Descending order (newest first)
        });
        
        // Load sample programs if no programs found in Firebase
        if (programsList.length === 0) {
          console.log('No programs found in Firebase, using sample programs');
          const samplePrograms = getSamplePrograms();
          
          // Validate sample programs
          samplePrograms.forEach(program => {
            console.log(`Validating sample program: ${program.title}`);
            validateProgram(program);
          });
          
          setPrograms(samplePrograms);
          setHasAttemptedLoad(true);
          
          try {
            await AsyncStorage.setItem(LOCAL_PROGRAMS_KEY, JSON.stringify(samplePrograms));
          } catch (cacheError) {
            console.error('Error caching sample programs:', cacheError);
          }
        } else {
          setPrograms(programsList);
          setHasAttemptedLoad(true);
          
          // Cache the programs locally
          try {
            await AsyncStorage.setItem(LOCAL_PROGRAMS_KEY, JSON.stringify(programsList));
          } catch (cacheError) {
            console.error('Error caching programs:', cacheError);
          }
        }
      } catch (firestoreError) {
        console.error('Error querying programs:', firestoreError);
        setHasAttemptedLoad(true);
        
        // If Firebase fails, use sample programs
        const samplePrograms = getSamplePrograms();
        
        // Validate sample programs
        samplePrograms.forEach(program => {
          console.log(`Validating sample program: ${program.title}`);
          validateProgram(program);
        });
        
        setPrograms(samplePrograms);
        
        if (firestoreError.toString().includes('Missing or insufficient permissions')) {
          console.log('Using sample programs due to Firebase permission issues');
          setError('Using sample programs due to database access issues');
        } else {
          setError('Failed to load programs: ' + firestoreError.message);
        }
        
        // Cache the sample programs locally
        try {
          await AsyncStorage.setItem(LOCAL_PROGRAMS_KEY, JSON.stringify(samplePrograms));
        } catch (cacheError) {
          console.error('Error caching sample programs:', cacheError);
        }
      }
    } catch (error) {
      console.error('Error loading training programs:', error);
      setError('Failed to load programs: ' + error.message);
      setHasAttemptedLoad(true);
      
      // Try to load sample programs as fallback
      const samplePrograms = getSamplePrograms();
      
      // Validate sample programs
      samplePrograms.forEach(program => {
        console.log(`Validating sample program: ${program.title}`);
        validateProgram(program);
      });
      
      setPrograms(samplePrograms);
      
      // Cache the sample programs locally 
      try {
        await AsyncStorage.setItem(LOCAL_PROGRAMS_KEY, JSON.stringify(samplePrograms));
      } catch (cacheError) {
        console.error('Error caching sample programs:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load user's enrolled programs
  const loadUserPrograms = async () => {
    if (!user) return;
    
    // Skip loading if we've already attempted once and hit permission errors
    if (hasAttemptedLoad && error && error.includes('permission')) {
      console.log('Skipping user program reload due to previous permission errors');
      setUserProgramsLoading(false);
      return;
    }
    
    // Set loading to true only if we don't have any user programs loaded yet
    if (userPrograms.length === 0) {
      setUserProgramsLoading(true);
    }
    
    try {
      const userProgramsCollection = collection(firestore, USER_PROGRAMS_COLLECTION);
      // Simplified query that only filters by userId without ordering
      const q = query(
        userProgramsCollection, 
        where('userId', '==', user.uid)
      );
      
      try {
        const querySnapshot = await getDocs(q);
        const userProgramsList = [];
        
        querySnapshot.forEach((doc) => {
          userProgramsList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort the results in JavaScript after retrieving them
        // Sort by enrolledAt in descending order (newest first)
        userProgramsList.sort((a, b) => {
          // Handle potential missing enrolledAt field
          const dateA = a.enrolledAt ? new Date(a.enrolledAt.seconds * 1000) : new Date(0);
          const dateB = b.enrolledAt ? new Date(b.enrolledAt.seconds * 1000) : new Date(0);
          return dateB - dateA; // Descending order
        });
        
        setUserPrograms(userProgramsList);
        setHasAttemptedLoad(true);
        
        // Cache the user programs locally
        try {
          const cacheKey = `${LOCAL_USER_PROGRAMS_KEY}_${user.uid}`;
          await AsyncStorage.setItem(cacheKey, JSON.stringify(userProgramsList));
        } catch (cacheError) {
          console.error('Error caching user programs:', cacheError);
        }
      } catch (firestoreError) {
        console.error('Error querying user programs:', firestoreError);
        setHasAttemptedLoad(true);
        
        // If Firebase fails, use empty user programs
        if (firestoreError.toString().includes('Missing or insufficient permissions')) {
          setUserPrograms([]);
          console.log('Using empty user programs due to Firebase permission issues');
          
          // No need to cache empty user programs
        } else {
          throw firestoreError;
        }
      }
    } catch (error) {
      console.error('Error loading user programs:', error);
      
      // Don't show error for empty user programs
      if (!error.toString().includes('permission')) {
        setError('Failed to load your programs: ' + error.message);
      }
      
      setHasAttemptedLoad(true);
      setUserPrograms([]);
    } finally {
      setUserProgramsLoading(false);
    }
  };
  
  // Function to refresh programs
  const refreshPrograms = () => {
    loadPrograms();
  };
  
  // Function to refresh user programs
  const refreshUserPrograms = () => {
    loadUserPrograms();
  };
  
  // Create a new training program (admin function)
  const createProgram = async (programData) => {
    try {
      const program = {
        ...programData,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        enrollments: 0,
        isActive: true
      };
      
      const docRef = await addDoc(collection(firestore, PROGRAMS_COLLECTION), program);
      
      const newProgram = { ...program, id: docRef.id };
      setPrograms(prev => [newProgram, ...prev]);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating program:', error);
      setError('Failed to create program: ' + error.message);
      throw error;
    }
  };
  
  // Enroll in a training program
  const enrollInProgram = async (programId) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // Check if already enrolled
      const existingEnrollment = userPrograms.find(p => p.programId === programId);
      if (existingEnrollment) {
        throw new Error('Already enrolled in this program');
      }
      
      // Find program in local state first
      const localProgram = programs.find(p => p.id === programId);
      if (!localProgram) {
        throw new Error('Program not found');
      }
      
      let programData;
      
      // Try to get from Firebase first
      try {
        const programRef = doc(firestore, PROGRAMS_COLLECTION, programId);
        const programSnap = await getDoc(programRef);
        
        if (programSnap.exists()) {
          programData = programSnap.data();
        } else {
          // If not in Firebase, use local program data
          console.log('Program not found in Firebase, using local program data');
          programData = localProgram;
        }
      } catch (error) {
        console.log('Error getting program from Firebase, using local program data:', error);
        programData = localProgram;
      }
      
      // Create user program enrollment
      const userProgram = {
        userId: user.uid,
        programId,
        programTitle: programData.title,
        programDuration: programData.duration,
        programDifficulty: programData.difficulty,
        progress: 0,
        currentWeek: 1,
        completedWorkouts: 0,
        enrolledAt: new Date().toISOString(), // Use JS date for local storage
        lastActivityAt: new Date().toISOString(),
        isActive: true
      };
      
      let docRef;
      
      // Try to add to Firebase
      try {
        docRef = await addDoc(collection(firestore, USER_PROGRAMS_COLLECTION), {
          ...userProgram,
          enrolledAt: serverTimestamp(),
          lastActivityAt: serverTimestamp()
        });
        
        // Try to update enrollment count in Firebase
        try {
          const programRef = doc(firestore, PROGRAMS_COLLECTION, programId);
          await updateDoc(programRef, {
            enrollments: (programData.enrollments || 0) + 1
          });
        } catch (error) {
          console.log('Could not update enrollment count in Firebase:', error);
        }
      } catch (error) {
        console.log('Could not add user program to Firebase:', error);
        // Generate a local ID for the document
        docRef = { id: 'local_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 9) };
      }
      
      // Update local state
      const newUserProgram = { ...userProgram, id: docRef.id };
      setUserPrograms(prev => [newUserProgram, ...prev]);
      
      // Update the programs list with new enrollment count
      setPrograms(prevPrograms => 
        prevPrograms.map(prog => 
          prog.id === programId 
            ? { ...prog, enrollments: (prog.enrollments || 0) + 1 } 
            : prog
        )
      );
      
      // Update local storage
      try {
        const updatedUserPrograms = [newUserProgram, ...userPrograms];
        const cacheKey = `${LOCAL_USER_PROGRAMS_KEY}_${user.uid}`;
        await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedUserPrograms));
        
        // Also update the program cache with new enrollment count
        await AsyncStorage.setItem(LOCAL_PROGRAMS_KEY, JSON.stringify(
          programs.map(prog => 
            prog.id === programId 
              ? { ...prog, enrollments: (prog.enrollments || 0) + 1 } 
              : prog
          )
        ));
      } catch (error) {
        console.log('Error updating local storage after enrollment:', error);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error enrolling in program:', error);
      setError('Failed to enroll in program: ' + error.message);
      throw error;
    }
  };
  
  // Function to count total workouts in a program
  const countProgramWorkouts = (programId) => {
    // Find program in state
    const program = programs.find(p => p.id === programId);
    if (!program) {
      console.log(`Program ${programId} not found in local state`);
      return null;
    }
    
    try {
      // Parse weekly schedule
      let weeklySchedule = null;
      try {
        weeklySchedule = typeof program.weeklySchedule === 'string' 
          ? JSON.parse(program.weeklySchedule) 
          : program.weeklySchedule;
      } catch (error) {
        console.error('Error parsing weekly schedule:', error);
        return null;
      }
      
      if (!Array.isArray(weeklySchedule)) {
        console.error('Weekly schedule is not an array');
        return null;
      }
      
      // Count workouts
      let totalWorkouts = 0;
      weeklySchedule.forEach((week, weekIndex) => {
        if (week && Array.isArray(week.workouts)) {
          totalWorkouts += week.workouts.length;
        }
      });
      
      return totalWorkouts;
    } catch (error) {
      console.error('Error counting workouts:', error);
      return null;
    }
  };
  
  // Update program progress
  const updateProgramProgress = async (userProgramId, progress, completedWorkout = false) => {
    try {
      const userProgramRef = doc(firestore, USER_PROGRAMS_COLLECTION, userProgramId);
      const userProgramSnap = await getDoc(userProgramRef);
      
      if (!userProgramSnap.exists()) {
        throw new Error('User program not found');
      }
      
      const userProgramData = userProgramSnap.data();
      
      // Calculate program progress based on completed workouts
      let newProgress = progress;
      if (completedWorkout) {
        // Get the program to count total workouts
        const programId = userProgramData.programId;
        
        // Try to get cached total workouts count first
        let totalWorkouts = countProgramWorkouts(programId);
        
        if (!totalWorkouts) {
          // If local count fails, try to get from Firestore
          try {
            const programRef = doc(firestore, PROGRAMS_COLLECTION, programId);
            const programSnap = await getDoc(programRef);
            
            if (programSnap.exists()) {
              const programData = programSnap.data();
              console.log(`Program ID: ${programId}, Title: ${programData.title}`);
              
              // Get weekly schedule data
              let weeklySchedule;
              try {
                weeklySchedule = typeof programData.weeklySchedule === 'string' 
                  ? JSON.parse(programData.weeklySchedule) 
                  : programData.weeklySchedule;
                  
                console.log(`Weekly schedule type: ${typeof weeklySchedule}, isArray: ${Array.isArray(weeklySchedule)}`);
              } catch (parseError) {
                console.error('Error parsing weekly schedule:', parseError);
                weeklySchedule = [];
              }
                
              if (Array.isArray(weeklySchedule)) {
                // Count total workouts in the program
                totalWorkouts = weeklySchedule.reduce((count, week) => {
                  const weekWorkouts = Array.isArray(week.workouts) ? week.workouts.length : 0;
                  console.log(`Week ${week.week || 'unknown'}: ${weekWorkouts} workouts`);
                  return count + weekWorkouts;
                }, 0);
              }
            }
          } catch (error) {
            console.error('Error getting program data from Firestore:', error);
          }
        }
        
        // Fallback to a reasonable default if we couldn't determine total workouts
        if (!totalWorkouts || totalWorkouts <= 0) {
          totalWorkouts = 30; // Assume a standard 30-workout program
          console.log(`Using default workout count of ${totalWorkouts}`);
        }
        
        // Get newly completed workout count
        const completedWorkoutCount = (userProgramData.completedWorkouts || 0) + 1;
        
        // Calculate progress fraction (cap at 1.0)
        newProgress = Math.min(1.0, completedWorkoutCount / totalWorkouts);
        console.log(`Updated program progress: ${newProgress.toFixed(4)} (${completedWorkoutCount}/${totalWorkouts} workouts completed)`);
      }
      
      const updates = {
        progress: newProgress,
        lastActivityAt: serverTimestamp()
      };
      
      if (completedWorkout) {
        updates.completedWorkouts = (userProgramData.completedWorkouts || 0) + 1;
      }
      
      // Update current week if necessary (based on progress)
      if (userProgramData.programDuration) {
        const durationWeeks = parseInt(userProgramData.programDuration);
        if (!isNaN(durationWeeks)) {
          const newWeek = Math.max(1, Math.min(durationWeeks, Math.ceil(newProgress * durationWeeks)));
          if (newWeek !== userProgramData.currentWeek) {
            updates.currentWeek = newWeek;
          }
        }
      }
      
      await updateDoc(userProgramRef, updates);
      
      // Update local state
      setUserPrograms(prev => 
        prev.map(program => 
          program.id === userProgramId 
            ? { ...program, ...updates } 
            : program
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating program progress:', error);
      setError('Failed to update progress: ' + error.message);
      return false;
    }
  };
  
  // Withdraw from a program
  const withdrawFromProgram = async (userProgramId) => {
    try {
      const userProgramRef = doc(firestore, USER_PROGRAMS_COLLECTION, userProgramId);
      const userProgramSnap = await getDoc(userProgramRef);
      
      if (!userProgramSnap.exists()) {
        throw new Error('User program not found');
      }
      
      const userProgramData = userProgramSnap.data();
      
      // Decrease enrollment count for the program
      try {
        const programRef = doc(firestore, PROGRAMS_COLLECTION, userProgramData.programId);
        const programSnap = await getDoc(programRef);
        
        if (programSnap.exists()) {
          const programData = programSnap.data();
          await updateDoc(programRef, {
            enrollments: Math.max(0, (programData.enrollments || 1) - 1)
          });
          
          // Update local programs state
          setPrograms(prevPrograms => 
            prevPrograms.map(prog => 
              prog.id === userProgramData.programId 
                ? { ...prog, enrollments: Math.max(0, (prog.enrollments || 1) - 1) } 
                : prog
            )
          );
        }
      } catch (error) {
        console.error('Error updating program enrollment count:', error);
        // Continue with withdrawal even if this fails
      }
      
      // Mark as inactive instead of deleting
      await updateDoc(userProgramRef, {
        isActive: false,
        withdrawnAt: serverTimestamp()
      });
      
      // Update local state
      setUserPrograms(prev => prev.filter(program => program.id !== userProgramId));
      
      return true;
    } catch (error) {
      console.error('Error withdrawing from program:', error);
      setError('Failed to withdraw from program: ' + error.message);
      return false;
    }
  };
  
  // Get a program by ID
  const getProgramById = async (programId) => {
    try {
      // Check if program is already in state
      const cachedProgram = programs.find(p => p.id === programId);
      if (cachedProgram) {
        return cachedProgram;
      }
      
      // Fetch from Firestore
      const programRef = doc(firestore, PROGRAMS_COLLECTION, programId);
      const programSnap = await getDoc(programRef);
      
      if (!programSnap.exists()) {
        throw new Error('Program not found');
      }
      
      return {
        id: programSnap.id,
        ...programSnap.data()
      };
    } catch (error) {
      console.error('Error getting program:', error);
      setError('Failed to get program: ' + error.message);
      throw error;
    }
  };
  
  // Get a user program by program ID
  const getUserProgramByProgramId = (programId) => {
    return userPrograms.find(p => p.programId === programId && p.isActive !== false);
  };
  
  // Check if user is enrolled in a program
  const isEnrolledInProgram = (programId) => {
    return userPrograms.some(p => p.programId === programId && p.isActive !== false);
  };
  
  // Reset errors
  const resetError = () => {
    setError(null);
  };

  // Add updateProgram function
  const updateProgram = async (programId, programData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're online and have Firestore access
      let updated = false;
      
      try {
        const programRef = doc(firestore, PROGRAMS_COLLECTION, programId);
        
        // Update with new data, preserving fields not provided
        await updateDoc(programRef, {
          ...programData,
          updatedAt: serverTimestamp()
        });
        
        console.log('Program updated with ID:', programId);
        updated = true;
      } catch (firestoreError) {
        console.error('Firestore error updating program:', firestoreError);
        
        if (firestoreError.toString().includes('Missing or insufficient permissions')) {
          setError('Permission denied: You do not have permission to update programs.');
        } else {
          throw firestoreError;
        }
      }
      
      if (updated) {
        // Refresh program list after update
        await loadPrograms();
        return programId;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating program:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    programs,
    userPrograms,
    loading,
    userProgramsLoading,
    error,
    createProgram,
    enrollInProgram,
    updateProgramProgress,
    withdrawFromProgram,
    getProgramById,
    getUserProgramByProgramId,
    isEnrolledInProgram,
    refreshPrograms,
    refreshUserPrograms,
    resetError,
    updateProgram,
  };

  return (
    <TrainingProgramContext.Provider value={value}>
      {children}
    </TrainingProgramContext.Provider>
  );
}; 