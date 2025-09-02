import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const Loading: React.FC = () => {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="small" color="#303030" />
    </View>
  );
};

export default Loading;
