import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import type { RootStackParamList } from '../types/navigation';
import OnboardingScreen from '../screens/OnBoarding';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoading, hasCompletedOnboarding, isAuthenticated } = useAppContext();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ): !isAuthenticated ? (
        <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
      ): (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}
