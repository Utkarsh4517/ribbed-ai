import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../contexts/AppContext';

const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAppContext();
  
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">OnBoarding Screen</Text>
      <TouchableOpacity
        className="mt-4"
        onPress={completeOnboarding}
      >
        <Text>Navigate to Auth Screen</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OnboardingScreen;
