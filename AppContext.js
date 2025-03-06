import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [userSettings, setUserSettings] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const db = getFirestore();

  // Fetch user settings from Firestore when user logs in
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (currentUser) {
        try {
          const docRef = doc(db, "userSettings", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserSettings(data);
            setDarkMode(data.darkMode || false);
            setLanguage(data.language || 'en');
          }
        } catch (error) {
          console.error("Error fetching user settings:", error);
        }
      }
    };

    fetchUserSettings();
  }, [currentUser]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
    // You would also update this in Firestore
  };

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    // You would also update this in Firestore
  };

  const value = {
    darkMode,
    language,
    userSettings,
    toggleDarkMode,
    changeLanguage
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};