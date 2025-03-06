// screens/MainScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../AuthContext';

export default function MainScreen() {
  const { userData } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Main Screen</Text>
      {userData && <Text style={styles.subtitle}>Welcome, {userData.email}!</Text>}
      <Text style={styles.content}>This is your app's main content.</Text>
    </View>
  );
}