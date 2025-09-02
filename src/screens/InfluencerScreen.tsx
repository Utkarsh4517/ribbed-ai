import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Dimensions 
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../types/navigation';
import { apiService, Scene } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10;

export default function InfluencerScreen({ route }: { route: RouteProp<MainStackParamList, 'InfluencerScreen'> }) {
  const { avatar } = route.params;
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalGenerated, setTotalGenerated] = useState(0);

  useEffect(() => {
    generateScenes();
  }, []);

  const generateScenes = async () => {
    if (!avatar.imageUrl) {
      Alert.alert('Error', 'Avatar image URL is not available');
      return;
    }

    setIsLoading(true);
    
    try {
      const data = await apiService.createScenes(avatar.imageUrl);
      
      if (data.success) {
        setScenes(data.scenes);
        setTotalGenerated(data.totalGenerated);
      } else {
        Alert.alert('Error', 'Failed to generate scenes');
      }
    } catch (error) {
      console.error('Error generating scenes:', error);
      Alert.alert('Error', 'Failed to generate scenes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSceneGrid = () => {
    return (
      <View className="mt-4">
        <View className="flex-row flex-wrap justify-between">
          {scenes.map((scene) => (
            <View key={scene.id} className="mb-4" style={{ width: maxImageWidth }}>
              {scene.imageUrl ? (
                <View>
                  <Image
                    source={{ uri: scene.imageUrl }}
                    style={{
                      width: maxImageWidth,
                      height: maxImageWidth,
                      borderRadius: 8,
                      backgroundColor: '#f3f4f6'
                    }}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error(`Scene ${scene.name} failed to load:`, error.nativeEvent.error);
                    }}
                  />
                  <Text className="text-sm font-medium text-gray-800 mt-2 text-center">
                    {scene.name}
                  </Text>
                </View>
              ) : (
                <View>
                  <View 
                    style={{
                      width: maxImageWidth,
                      height: maxImageWidth,
                      borderRadius: 8,
                      backgroundColor: '#f3f4f6'
                    }}
                    className="items-center justify-center border border-gray-200"
                  >
                    <Text className="text-xs text-gray-500 text-center px-2">
                      Failed to generate
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-gray-800 mt-2 text-center">
                    {scene.name}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-4">
        {scenes.length > 0 && (
          <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-800">Generated Scenes</Text>
            
            </View>
            {renderSceneGrid()}
          </View>
        )}

        {!isLoading && scenes.length > 0 && totalGenerated < 5 && (
          <TouchableOpacity
            onPress={generateScenes}
            className="bg-blue-500 rounded-lg p-4 mt-4 items-center"
          >
            <Text className="text-white font-semibold">Retry Failed Scenes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}