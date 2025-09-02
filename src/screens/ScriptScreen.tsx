import React from 'react';
import { Text, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScriptScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ScriptScreen'>;

export default function ScriptScreen({ route }: { route: RouteProp<MainStackParamList, 'ScriptScreen'> }) {
  const { scene } = route.params;
  const navigation = useNavigation<ScriptScreenNavigationProp>();

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
          <Text className="text-xl font-bold text-gray-800">Script Generation</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Selected Scene */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Selected Scene</Text>
          
          <View className="flex-row">
            {scene.imageUrl ? (
              <Image
                source={{ uri: scene.imageUrl }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  backgroundColor: '#f3f4f6'
                }}
                resizeMode="cover"
              />
            ) : (
              <View 
                style={{
                  width: 120,
                  height: 120,
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

        {/* Script Generation Section */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Generated Script</Text>
          
          <View className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
            <Text className="text-gray-600 text-center">
              Script generation will be implemented here...
            </Text>
          </View>
          
          <TouchableOpacity
            className="bg-blue-500 rounded-lg p-4 mt-4 items-center"
            onPress={() => {
              // TODO: Implement script generation
              console.log('Generate script for scene:', scene.name);
            }}
          >
            <Text className="text-white font-semibold">Generate Script</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
