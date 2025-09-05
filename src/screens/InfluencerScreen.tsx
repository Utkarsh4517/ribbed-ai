import React, { useEffect, useRef, useState } from 'react';
import { 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../contexts/AppContext';
import { Scene, CustomScene } from '../services/api';
import WhiteButton from '../components/WhiteButton';
import { HapticsService } from '../utils/haptics';

const { width: screenWidth } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10;
const imageHeight = maxImageWidth * (16 / 9); 

type InfluencerScreenNavigationProp = StackNavigationProp<MainStackParamList, 'InfluencerScreen'>;

export default function InfluencerScreen({ route }: { route: RouteProp<MainStackParamList, 'InfluencerScreen'> }) {
  const { avatar, preloadedScenes, isPublicAvatar } = route.params;
  const navigation = useNavigation<InfluencerScreenNavigationProp>();
  const { 
    generateScenesForAvatar, 
    getScenesForAvatar, 
    generateCustomScenesForAvatar,
    saveSelectedAvatarWithScenes 
  } = useAppContext();
  
  const [localScenes, setLocalScenes] = useState<Scene[]>(preloadedScenes || []);
  const [localIsLoading, setLocalIsLoading] = useState(!isPublicAvatar && !preloadedScenes);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [viewMode, setViewMode] = useState<'preset' | 'custom'>('preset');
  const [customSceneInput, setCustomSceneInput] = useState('');
  const [customScenesKey, setCustomScenesKey] = useState<string | null>(null);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const { scenes: generatedScenes, totalGenerated, isLoading: contextLoading, hasGenerated } = 
    getScenesForAvatar(avatar.imageUrl || '');
  
  const customScenesData = customScenesKey ? getScenesForAvatar(customScenesKey) : {
    scenes: [],
    totalGenerated: 0,
    isLoading: false,
    hasGenerated: false
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const scenes = viewMode === 'preset' 
    ? (isPublicAvatar ? localScenes : generatedScenes)
    : customScenesData.scenes;
      
  const isLoading = viewMode === 'preset'
    ? (isPublicAvatar ? localIsLoading : contextLoading)
    : (customScenesData.isLoading || isGeneratingCustom);

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
    if (!isPublicAvatar && avatar.imageUrl && !hasGenerated && !contextLoading) {
      handleGenerateScenes();
    }
    if (isPublicAvatar && preloadedScenes) {
      setLocalIsLoading(false);
    }
  }, [avatar.imageUrl, hasGenerated, contextLoading, isPublicAvatar, preloadedScenes]);

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

  const handleSceneSelect = async (scene: Scene) => {
    HapticsService.light();
    setSelectedScene(scene);
    if (!isPublicAvatar && avatar && scenes.length > 0) {
      try {
        await saveSelectedAvatarWithScenes(avatar, scenes);
      } catch (error) {
        console.error('Failed to save avatar with scenes:', error);
      }
    }
    
    navigation.navigate('ScriptScreen', { scene });
  };

  const generateCustomScene = async () => {
    if (!customSceneInput.trim() || isGeneratingCustom) return;
    
    if (!avatar.imageUrl) {
      Alert.alert('Error', 'Avatar image URL is not available');
      return;
    }

    HapticsService.medium();
    const trimmedInput = customSceneInput.trim();
    setIsGeneratingCustom(true);

    try {
      const customScene: CustomScene = {
        id: 1,
        name: trimmedInput.length > 30 ? trimmedInput.substring(0, 30) + '...' : trimmedInput,
        description: trimmedInput
      };

      const cacheKey = await generateCustomScenesForAvatar(avatar.imageUrl, [customScene]);
      setCustomScenesKey(cacheKey);
      setViewMode('custom');
      setCustomSceneInput('');
    } catch (error) {
      console.error('Error generating custom scene:', error);
      Alert.alert('Error', 'Failed to generate custom scene. Please try again.');
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const renderModeToggle = () => {
    return (
      <View className="flex-row bg-white/10 rounded-full p-1 mb-4">
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-full ${
            viewMode === 'preset' ? 'bg-white/20' : ''
          }`}
          onPress={() => {
            HapticsService.selection();
            setViewMode('preset');
          }}
        >
          <Text className={`text-center font-sfpro-medium ${
            viewMode === 'preset' ? 'text-white' : 'text-white/60'
          }`}>
            {isPublicAvatar ? 'Our Scenes' : 'Preset Scenes'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-full ${
            viewMode === 'custom' ? 'bg-white/20' : ''
          }`}
          onPress={() => {
            HapticsService.selection();
            setViewMode('custom');
          }}
        >
          <Text className={`text-center font-sfpro-medium ${
            viewMode === 'custom' ? 'text-white' : 'text-white/60'
          }`}>
            Custom Scenes
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSceneGrid = () => {
    return (
      <View className="mt-6">
        <View className="flex-row flex-wrap justify-between">
          {scenes.map((scene) => (
            <TouchableOpacity 
              key={`${scene.id}-${scene.isCustom ? 'custom' : 'preset'}`}
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
                  {scene.isCustom && (
                    <View className="absolute top-2 right-2 bg-white/20 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs font-sfpro-medium">Custom</Text>
                    </View>
                  )}
                  <Text className="text-xs font-sfpro-medium text-white mt-2 text-center">
                    {scene.name}
                  </Text>
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
    const placeholderCount = viewMode === 'custom' ? 1 : 5;
    const placeholders = Array.from({ length: placeholderCount }, (_, i) => i);
    
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
          {viewMode === 'custom' 
            ? 'Generating your custom scene...' 
            : isPublicAvatar 
              ? 'Loading database scenes...'
              : 'Generating preset scenes for your avatar...'
          }
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (viewMode === 'custom' && !customScenesData.hasGenerated) {
      return (
        <View className="items-center py-12">
          <Text className="text-white/70 text-lg text-center font-sfpro-regular leading-relaxed">
            Describe a custom scene for your avatar using the input below and we'll generate it for you!
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center py-12">
        <Text className="text-white/70 text-lg text-center font-sfpro-regular leading-relaxed">
          {viewMode === 'preset' 
            ? (isPublicAvatar 
                ? "No database scenes available for this avatar yet." 
                : "No preset scenes available. Please try generating scenes for this avatar.")
            : "No custom scenes generated yet."
          }
        </Text>
      </View>
    );
  };

  const renderBottomSection = () => {
    if (viewMode === 'custom') {
      return (
        <View className="bg-[#FF5555] px-8 pb-8 pt-6">
          <View className="flex-row items-center gap-x-3">
            <TextInput
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 text-white text-base font-sfpro-regular py-5"
              style={{ 
                textAlignVertical: 'center', 
                includeFontPadding: false,
                lineHeight: 16
              }}
              placeholder="Describe a custom scene..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={customSceneInput}
              onChangeText={setCustomSceneInput}
              maxLength={150}
              editable={!isGeneratingCustom}
            />
            <TouchableOpacity
              className={`w-14 h-14 rounded-full items-center justify-center border-2 ${
                customSceneInput.trim() && !isGeneratingCustom
                  ? 'bg-white border-white'
                  : 'bg-white/20 border-white/30'
              }`}
              onPress={() => {
                if (customSceneInput.trim() && !isGeneratingCustom) {
                  generateCustomScene();
                }
              }}
              disabled={!customSceneInput.trim() || isGeneratingCustom}
            >
              <Text className={`text-xl font-sfpro-semibold ${
                customSceneInput.trim() && !isGeneratingCustom ? 'text-[#FF5555]' : 'text-white/60'
              }`}>
                →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (viewMode === 'preset' && !isPublicAvatar && !isLoading && scenes.length > 0 && totalGenerated < 5) {
      return (
        <View className="bg-[#FF5555] px-8 pb-8 pt-6">
          <WhiteButton
            title="Retry Failed Preset Scenes"
            onPress={handleGenerateScenes}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FF5555" />
      <SafeAreaView className="flex-1 bg-[#FF5555]">
        <KeyboardAvoidingView 
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                onPress={() => {
                  HapticsService.light();
                  navigation.goBack();
                }}
                className="bg-white/20 rounded-full px-5 py-2 border border-white/30"
              >
                <Text className="text-white text-lg">←</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
              {renderModeToggle()}

              {isLoading && renderSkeletonGrid()}
              
              {!isLoading && scenes.length > 0 && (
                <>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white/80 text-base font-sfpro-regular">
                      Tap on a scene to continue with your video creation
                    </Text>
                    
                  </View>
                  {renderSceneGrid()}
                </>
              )}

              {!isLoading && scenes.length === 0 && renderEmptyState()}
            </ScrollView>
          </Animated.View>

          {renderBottomSection()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}