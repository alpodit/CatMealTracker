// screens/AuthScreens.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SignInScreen from './SignInScreen';
import SignUpScreen from './SignUpScreen';

const AuthStack = createStackNavigator();

export default function AuthScreens() {
  return (
    <AuthStack.Navigator initialRouteName="SignIn">
      <AuthStack.Screen 
        name="SignIn" 
        component={SignInScreen} 
        options={{ title: 'Sign In' }}
      />
      <AuthStack.Screen 
        name="SignUp" 
        component={SignUpScreen} 
        options={{ title: 'Sign Up' }}
      />
    </AuthStack.Navigator>
  );
}