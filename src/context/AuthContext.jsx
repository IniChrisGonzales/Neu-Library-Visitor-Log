import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Verify neu.edu.ph domain
        if (!firebaseUser.email.endsWith('@neu.edu.ph')) {
          await signOut(auth);
          setError('Only NEU email addresses are allowed');
          setUser(null);
          setLoading(false);
          return;
        }

        // Get user role from Firestore or create if first login
        try {
          // First check if user exists by UID
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // User exists by UID, get their data
            const userData = userDoc.data();
            if (userData.isBlocked) {
              await signOut(auth);
              setError('Your account is blocked. Contact admin for access.');
              setUser(null);
              setUserRole(null);
              setUserData(null);
              setLoading(false);
              return;
            }
            const role = userData.role;
            setUserData(userData);
            setUserRole(role);
          } else {
            // Check if user exists by email (pre-added by admin)
            const usersQuery = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
            const emailQuerySnapshot = await getDocs(usersQuery);
            
            if (!emailQuerySnapshot.empty) {
              // User exists by email - found pre-added user
              const existingUserDoc = emailQuerySnapshot.docs[0];
              const existingUserData = existingUserDoc.data();
              if (existingUserData.isBlocked) {
                await signOut(auth);
                setError('Your account is blocked. Contact admin for access.');
                setUser(null);
                setUserRole(null);
                setUserData(null);
                setLoading(false);
                return;
              }
              const role = existingUserData.role || 'student';
              setUserData(existingUserData);
              setUserRole(role);
              
              // Update the document to use Firebase UID if different
              if (existingUserDoc.id !== firebaseUser.uid) {
                await setDoc(userRef, {
                  ...existingUserData,
                  uid: firebaseUser.uid,
                  updatedAt: new Date(),
                }, { merge: true });
              }
            } else {
              // First login - create user document with student role
              const newUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                role: 'student',
                college: '',
                schoolId: '',
                userType: '',
                isBlocked: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              await setDoc(userRef, newUserData);
              setUserData(newUserData);
              setUserRole('student');
              console.log('New user created in Firestore:', firebaseUser.uid);
            }
          }
          setUser(firebaseUser);
        } catch (err) {
          console.error('Error managing user data:', err);
          setUserRole('student');
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        hd: 'neu.edu.ph',
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      const errorMsg = err.code === 'auth/popup-blocked' 
        ? 'Popup was blocked. Please allow popups.'
        : err.message;
      setError(errorMsg);
      throw err;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userData, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
