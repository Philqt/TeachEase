import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { FirebaseService } from '../services/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        // Ensure teacher profile document exists
        try {
          const ref = doc(db, 'teachers', firebaseUser.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (e) {
          console.error('Ensure teacher profile error:', e);
        }

        // Fetch cloud data into local on login
        try {
          await FirebaseService.fetchAll();
        } catch (e) {
          console.error('Initial fetch error:', e);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create teacher profile in Firestore
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'teachers', uid), {
        id: uid,
        email,
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return;
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof FirebaseError) {
        const map: Record<string, string> = {
          'auth/configuration-not-found': 'Firebase Auth is not fully configured. Enable Email/Password in Firebase Console and add your dev domain to Authorized domains.',
          'auth/invalid-email': 'Invalid email address.',
          'auth/email-already-in-use': 'This email is already in use.',
          'auth/operation-not-allowed': 'Email/Password sign-in is disabled in Firebase.',
          'auth/weak-password': 'Password should be at least 6 characters.',
          'auth/network-request-failed': 'Network error. Please check your internet connection.',
        };
        throw new Error(map[error.code] || `Firebase Auth error: ${error.code}`);
      }
      throw error as Error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof FirebaseError) {
        const map: Record<string, string> = {
          'auth/invalid-email': 'Invalid email address.',
          'auth/user-not-found': 'No account found with this email.',
          'auth/wrong-password': "Wrong Password Ma'am. Usba!",
          'auth/invalid-credential': "Wrong Password Ma'am. Usba!",
          'auth/too-many-requests': 'Too many attempts. Please try again later.',
          'auth/network-request-failed': 'Network error. Please check your internet connection.',
        };
        throw new Error(map[error.code] || `Firebase Auth error: ${error.code}`);
      }
      throw error as Error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Optionally clear local storage on logout
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
