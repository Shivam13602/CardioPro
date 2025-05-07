import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        setUser(user);
        await AsyncStorage.setItem('userToken', await user.getIdToken());
      } else {
        setUser(null);
        await AsyncStorage.removeItem('userToken');
      }
      setLoading(false);
    });

    // Try to restore from AsyncStorage
    const checkLocalAuth = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        console.log('Checking local token:', userToken ? 'Token found' : 'No token');
        if (!userToken) {
          // Ensure user is null and loading is false if no token
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking local auth:', error);
        setUser(null);
        setLoading(false);
      }
    };

    checkLocalAuth();

    // Cleanup
    return () => unsubscribe();
  }, []);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set display name
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      // Update the user state to include the new display name
      setUser(userCredential.user);
      
      return userCredential.user;
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in');
      }
      
      await updateProfile(auth.currentUser, updates);
      
      // Update the user state
      setUser({ ...auth.currentUser });
      
      return auth.currentUser;
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset auth errors
  const resetError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    updateUserProfile,
    resetError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 