import React, { createContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { app } from "../../firebase/firebaseConfig";

// Initialize Auth using Firebase's modular SDK
const auth = getAuth(app);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // currentUser is null when no user is signed in, otherwise contains user info
      setUser(currentUser);
      setLoading(false);
      console.log("Auth State Changed: ", currentUser);
    });

    return unsubscribe;
  }, []);

  // Login function using Firebase Authentication
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Signup function using Firebase Authentication
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Logout function
  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);