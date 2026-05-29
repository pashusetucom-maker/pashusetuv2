import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { loginUser, logoutUser } from '../firebase/authService';

const AuthContext = createContext();

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
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if user is active
            if (userData.status && userData.status !== 'active') {
              console.warn('User account is not active:', userData.status);
              await logoutUser();
              setUser(null);
              setLoading(false);
              setSessionChecked(true);
              return;
            }
            
            const fullUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData
            };
            
            console.log('User data loaded:', fullUserData.email, fullUserData.role);
            setUser(fullUserData);
          } else {
            console.error('User document not found in Firestore');
            await logoutUser();
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await logoutUser();
          setUser(null);
        }
      } else {
        console.log('No user logged in');
        setUser(null);
      }
      
      setLoading(false);
      setSessionChecked(true);
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const userData = await loginUser(email, password);
      console.log('Login successful:', userData.email, userData.role);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error in context:', error);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user:', user?.email);
      await logoutUser();
      setUser(null);
      console.log('Logout successful');
      
      // Clear any cached data
      sessionStorage.clear();
      localStorage.removeItem('lastRoute');
      
      // Force reload to clear any remaining state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error in context:', error);
      // Even if logout fails, clear user state
      setUser(null);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    sessionChecked
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
