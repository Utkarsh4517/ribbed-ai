import React, { useEffect, useRef } from 'react';
import { 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../contexts/AppContext';
import WhiteButton from '../components/WhiteButton';

const { width: screenWidth } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10;
const imageHeight = maxImageWidth * (16 / 9); 

type InfluencerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'InfluencerScreen'>;

export default function InfluencerScreen({ route }: { route: RouteProp<MainStackParamList, 'InfluencerScreen'> }) {
  const { avatar } = route.params;
  const navigation = useNavigation<InfluencerScreenNavigationProp>();
  const { generateScenesForAvatar, getScenesForAvatar } = useAppContext();
  const { scenes, totalGenerated, isLoading, hasGenerated } = getScenesForAvatar(avatar.imageUrl || '');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    if (avatar.imageUrl && !hasGenerated && !isLoading) {
      handleGenerateScenes();
    }
  }, [avatar.imageUrl, hasGenerated, isLoading]);

  const handleGenerateScenes = async () => {
    if (!avatar.imageUrl) {
      Alert.alert('Error', 'Avatar image URL is not available');
      return;
    }
    try {
      await generateScenesForAvatar(avatar.imageUrl);
    } catch (error) {
      console.error('Error generating scenes:', error);
      Alert.alert('Error', 'Failed to generate scenes. Please try again.');
    }
  };

  const handleSceneSelect = (scene: any) => {
    navigation.navigate('ScriptScreen', { scene });
  };

  const renderSceneGrid = () => {
    return (
      <View className="mt-6">
        <View className="flex-row flex-wrap justify-between">
          {scenes.map((scene) => (
            <TouchableOpacity 
              key={scene.id} 
              className="mb-4" 
              style={{ width: maxImageWidth }}
              onPress={() => handleSceneSelect(scene)}
              activeOpacity={0.8}
            >
              {scene.imageUrl ? (
                <View>
                  <Image
                    source={{ uri: scene.imageUrl }}
                    style={{
                      width: maxImageWidth,
                      height: imageHeight,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error(`Scene ${scene.name} failed to load:`, error.nativeEvent.error);
                    }}
                  />
                </View>
              ) : (
                <View>
                  <View 
                    style={{
                      width: maxImageWidth,
                      height: imageHeight,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }}
                    className="items-center justify-center border border-white/20"
                  >
                    <Text className="text-xs text-white/60 text-center px-2 font-sfpro-regular">
                      Failed to generate
                    </Text>
                  </View>
                  <Text className="text-xs font-sfpro-medium text-white mt-2 text-center">
                    {scene.name}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSkeletonGrid = () => {
    const placeholders = Array.from({ length: 5 }, (_, i) => i);
    return (
      <View className="mt-6">
        <View className="flex-row flex-wrap justify-between">
          {placeholders.map((i) => (
            <View key={`skeleton-${i}`} className="mb-4" style={{ width: maxImageWidth }}>
              <View
                style={{
                  width: maxImageWidth,
                  height: imageHeight,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }}
                className="animate-pulse"
              />
              <View className="h-3 bg-white/20 rounded mt-2 mx-auto w-16 animate-pulse" />
            </View>
          ))}
        </View>
        <Text className="text-xs text-white/60 mt-2 text-center font-sfpro-regular">
          Generating custom scenes for your avatar...
        </Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FF5555" />
      <SafeAreaView className="flex-1 bg-[#FF5555]">
        <Animated.View 
          className="flex-1"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <View className="flex-row items-center justify-between px-8 py-6">
            <View>
              <Text className="text-white text-3xl font-sfpro-semibold">Choose Scene</Text>
              <Text className="text-white/80 text-base font-sfpro-regular mt-1">
                Pick the perfect background
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-white/20 rounded-full p-3 border border-white/30"
            >
              <Text className="text-white text-lg">←</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="flex-1 px-8"
            showsVerticalScrollIndicator={false}
          >
            {isLoading && renderSkeletonGrid()}
            
            {!isLoading && scenes.length > 0 && (
              <>
                <Text className="text-white/80 text-base font-sfpro-regular mb-4">
                  Tap on a scene to continue with your video creation
                </Text>
                {renderSceneGrid()}
              </>
            )}

            {!isLoading && scenes.length === 0 && !hasGenerated && (
              <View className="items-center py-12">
                <Text className="text-white/70 text-lg text-center font-sfpro-regular leading-relaxed">
                  No scenes available. Please try generating scenes for this avatar.
                </Text>
              </View>
            )}
          </ScrollView>

          {!isLoading && scenes.length > 0 && totalGenerated < 5 && (
            <View className="px-8 pb-8">
              <WhiteButton
                title="Retry Failed Scenes"
                onPress={handleGenerateScenes}
              />
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </>
  );
}