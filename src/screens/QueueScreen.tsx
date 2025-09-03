import React from 'react';
import { Text, TouchableOpacity, View, Image, ScrollView, Alert } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

type QueueScreenNavigationProp = StackNavigationProp<MainStackParamList, 'QueueScreen'>;
type QueueScreenRouteProp = RouteProp<MainStackParamList, 'QueueScreen'>;

interface QueueScreenProps {
  route: QueueScreenRouteProp;
}

export default function QueueScreen({ route }: QueueScreenProps) {
  const navigation = useNavigation<QueueScreenNavigationProp>();
  const { scene, audioUrl } = route.params;

  const handleStartVideoGeneration = () => {
    // TODO: Implement video generation logic
    Alert.alert(
      'Video Generation', 
      'Video generation will be implemented here!\n\nScene: ' + scene.name + '\nAudio: Ready'
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <Text className="text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Video Queue</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Scene Information */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Scene Details</Text>
          
          <View className="flex-row">
            {scene.imageUrl ? (
              <Image
                source={{ uri: scene.imageUrl }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  backgroundColor: '#f3f4f6'
                }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  backgroundColor: '#f3f4f6'
                }}
                className="items-center justify-center border border-gray-200"
              >
                <Text className="text-xs text-gray-500 text-center px-2">
                  No Image
                </Text>
              </View>
            )}
            
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                {scene.name}
              </Text>
              <Text className="text-sm text-gray-600">
                {scene.description}
              </Text>
            </View>
          </View>
        </View>

        {/* Audio Status */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Audio Status</Text>
          
          <View className="flex-row items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🎵</Text>
              <View>
                <Text className="text-green-800 font-semibold">Audio Ready</Text>
                <Text className="text-green-600 text-sm">Speech generated successfully</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-green-500 rounded-lg px-3 py-2"
              onPress={() => Alert.alert('Audio URL', audioUrl)}
            >
              <Text className="text-white font-medium text-sm">Preview</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Generation Status */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Video Generation</Text>
          
          <View className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">🎬</Text>
              <Text className="text-blue-800 font-semibold">Ready to Generate</Text>
            </View>
            <Text className="text-blue-600 text-sm">
              Your scene and audio are ready. Click below to start video generation.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-purple-500 rounded-lg p-4 items-center"
            onPress={handleStartVideoGeneration}
          >
            <Text className="text-white font-bold text-lg">🚀 Start Video Generation</Text>
          </TouchableOpacity>
        </View>

        {/* Generation Queue (Future) */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Generation Queue</Text>
          
          <View className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Text className="text-gray-600 text-center">
              No videos in queue
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-1">
              Generated videos will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
