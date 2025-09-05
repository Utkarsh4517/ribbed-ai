import React, { useState, useEffect, useRef } from 'react';
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Image,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  StatusBar,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Avatar, apiService } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackParamList } from '../types/navigation';
import { useAppContext } from '../contexts/AppContext';
import WhiteButton from '../components/WhiteButton';
import { HapticsService } from '../utils/haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10; 
const imageHeight = maxImageWidth * (16 / 9); // Calculate 9:16 aspect ratio height
const popularAvatarWidth = (screenWidth * 0.85) / 3 - 8;
const popularAvatarHeight = popularAvatarWidth * (4 / 3); 

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { 
    generateAvatarsForPrompt, 
    getAvatarsForPrompt, 
    publicAvatars, 
    loadPublicAvatars,
    getPublicAvatarScenes,
  } = useAppContext();
  
  const [inputText, setInputText] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showCustomAvatars, setShowCustomAvatars] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const { avatars, isLoading } = getAvatarsForPrompt(currentPrompt);

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

    loadPublicAvatars();
  }, []);

  const sendPrompt = async () => {
    if (!inputText.trim() || isLoading) return;
    HapticsService.medium();
    const trimmedPrompt = inputText.trim();
    setCurrentPrompt(trimmedPrompt);
    setSelectedAvatar(null);
    setShowCustomAvatars(true);

    try {
      await generateAvatarsForPrompt(trimmedPrompt);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Connection Error',
        'Make sure the backend server is running and Replicate API token is configured'
      );
    }
  };

  const openFullScreen = (avatar: Avatar) => {
    HapticsService.light();
    setSelectedAvatar(avatar);
    setIsFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    HapticsService.soft();
    setIsFullScreenVisible(false);
    setSelectedAvatar(null);
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    HapticsService.selection();
    // If the same avatar is selected again, deselect it
    if (selectedAvatar?.id === avatar.id) {
      setSelectedAvatar(null);
    } else {
      // Otherwise, select the new avatar
      setSelectedAvatar(avatar);
    }
    setIsFullScreenVisible(false);
  };

  const handleNextButton = async () => {
    if (selectedAvatar && selectedAvatar.imageUrl) {
      try {
        if (selectedAvatar.isPublic) {
          const scenes = await getPublicAvatarScenes(selectedAvatar.id);
          navigation.navigate('InfluencerScreen', { 
            avatar: selectedAvatar, 
            preloadedScenes: scenes,
            isPublicAvatar: true 
          });
        } else {
          navigation.navigate('InfluencerScreen', { 
            avatar: selectedAvatar,
            isPublicAvatar: false 
          });
        }
      } catch (error) {
        console.error('Failed to process avatar:', error);
        Alert.alert('Error', 'Could not process the selected avatar. Please try again.');
      }
    }
  };

  const renderAvatarGrid = (items: Avatar[], isPopular: boolean = false) => {
    const itemWidth = isPopular ? popularAvatarWidth : maxImageWidth;
    const itemHeight = isPopular ? popularAvatarHeight : imageHeight;
    const containerClass = isPopular ? "justify-between" : "justify-between";
    
    return (
      <View className="mt-6">
        <View className={`flex-row flex-wrap ${containerClass}`}>
          {items.map((avatar) => {
            const isSelected = selectedAvatar?.id === avatar.id;
            return (
              <TouchableOpacity 
                key={avatar.id} 
                className="mb-4" 
                style={{ width: itemWidth }}
                onPress={() => handleAvatarSelect(avatar)}
                onLongPress={() => openFullScreen(avatar)}
                activeOpacity={0.8}
                >
                {avatar.imageUrl ? (
                  <View>
                   <Image
  source={{ uri: avatar.imageUrl!.trim() }}
  style={{
    width: itemWidth,
    height: itemHeight,
    borderRadius: isPopular ? 8 : 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: isSelected ? 3 : 0,
    borderColor: isSelected ? '#FFFFFF' : 'transparent'
  }}
  resizeMode="cover"
  onError={(error) => {
    console.error(`Avatar ${avatar.id} failed to load:`, error.nativeEvent.error);
    console.error('Failed URL:', avatar.imageUrl?.trim() || '');
  }}
  onLoad={() => {
    console.log(`Avatar ${avatar.id} loaded successfully`);
  }}
  onLoadStart={() => {
    console.log(`Avatar ${avatar.id} started loading`);
  }}
/>
                    
                  </View>
                ) : (
                  <View 
                    style={{
                      width: itemWidth,
                      height: itemHeight, 
                      borderRadius: isPopular ? 8 : 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: isSelected ? 3 : 0,
                      borderColor: isSelected ? '#FFFFFF' : 'transparent'
                    }}
                    className="items-center justify-center"
                  >
                    <Text className="text-xs text-white/60 text-center px-2 font-sfpro-regular">
                      Failed to generate
                    </Text>
                    <Text className={`text-xs mt-2 font-sfpro-medium ${
                      isSelected ? 'text-white' : 'text-white/70'
                    }`}>
                      Variation {avatar.variation}
                      {isSelected && ' ✓'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderSkeletonGrid = () => {
    const placeholders = Array.from({ length: 6 }, (_, i) => i);
    return (
      <View className="mt-6">
        <View className="flex-row flex-wrap justify-between">
          {placeholders.map((i) => (
            <View key={`skeleton-${i}`} className="mb-4" style={{ width: maxImageWidth }}>
              <View
                style={{
                  width: maxImageWidth,
                  height: imageHeight, // Changed from maxImageWidth to imageHeight
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }}
                className="animate-pulse"
              />
              <View className="h-3 bg-white/20 rounded mt-2 mx-auto w-20 animate-pulse" />
            </View>
          ))}
        </View>
        <Text className="text-xs text-white/60 mt-2 text-center font-sfpro-regular">
          This may take 10-15 seconds
        </Text>
      </View>
    );
  };

  const renderFullScreenModal = () => {
    if (!selectedAvatar) return null;

    return (
      <Modal
        visible={isFullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullScreen}
      >
        <StatusBar hidden />
        <TouchableWithoutFeedback onPress={closeFullScreen}>
          <View className="flex-1 bg-black bg-opacity-90 items-center justify-center">
            <TouchableOpacity
              onPress={closeFullScreen}
              className="absolute top-12 right-6 z-10 bg-black/50 rounded-full p-3"
              style={{ zIndex: 1000 }}
            >
              <Text className="text-white text-2xl font-sfpro-regular">×</Text>
            </TouchableOpacity>
            
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="items-center">
                <Image
                  source={{ uri: selectedAvatar.imageUrl }}
                  style={{
                    width: screenWidth * 0.9,
                    height: screenHeight * 0.7,
                    borderRadius: 12,
                  }}
                  resizeMode="contain"
                />
               
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderBottomSection = () => {
    if (selectedAvatar) {
      return (
        <View className="bg-[#FF5555] px-8 pb-2 pt-6">
          <WhiteButton
            title={selectedAvatar.isPublic ? "Continue with Selected Avatar" : "Continue"}
            onPress={handleNextButton}
          />
         
        </View>
      );
    }

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
            placeholder="Describe the avatar you want..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={inputText}
            onChangeText={setInputText}
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            className={`w-14 h-14 rounded-full items-center justify-center border-2 ${
              inputText.trim() && !isLoading
                ? 'bg-white border-white'
                : 'bg-white/20 border-white/30'
            }`}
            onPress={sendPrompt}
            disabled={!inputText.trim() || isLoading}
          >
            <Text className={`text-xl font-sfpro-semibold ${
              inputText.trim() && !isLoading ? 'text-[#FF5555]' : 'text-white/60'
            }`}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
            {!showCustomAvatars && (
              <View className="flex-row items-center justify-between px-8">
                <Text className="text-white text-xl font-sfpro-semibold">
                  Popular Avatars
                </Text>
                
                <TouchableOpacity
                  onPress={() => {
                    HapticsService.light();
                    navigation.navigate('ProfileScreen');
                  }}
                  className="bg-white/20 rounded-full p-3 border border-white/30"
                >
                  <Text className="text-white text-sm font-sfpro-medium">View Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView 
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
              {!showCustomAvatars && (
                <>
                  {publicAvatars.length > 0 && (
                    <View className="mb-6">
                      {renderAvatarGrid(publicAvatars, true)}
                      <Text className="text-white/50 text-xs text-center mt-4 font-sfpro-regular">
                        Tip: Long press on any image to view it in full screen
                      </Text>
                    </View>
                  )}

                  {publicAvatars.length === 0 && (
                    <View className="items-center py-12">
                      <Text className="text-white/70 text-lg text-center font-sfpro-regular leading-relaxed">
                        No public avatars available yet. Create your own custom avatar using the input below!
                      </Text>
                    </View>
                  )}
                </>
              )}

              {showCustomAvatars && (
                <>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-xl font-sfpro-semibold">
                      Custom Avatars
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        HapticsService.light();
                        setShowCustomAvatars(false);
                        setCurrentPrompt('');
                        setSelectedAvatar(null);
                      }}
                      className="bg-white/20 rounded-full px-4 py-2"
                    >
                      <Text className="text-white text-sm font-sfpro-medium">← Back</Text>
                    </TouchableOpacity>
                  </View>

                  {!currentPrompt && !isLoading && (
                    <View className="items-center py-12">
                      <Text className="text-white/70 text-lg text-center font-sfpro-regular leading-relaxed">
                        Describe your ideal avatar using the input below and we'll generate multiple variations for you to choose from
                      </Text>
                    </View>
                  )}

                  {isLoading && renderSkeletonGrid()}
                  
                  {!isLoading && avatars.length > 0 && (
                    <>
                      {renderAvatarGrid(avatars)}
                      <Text className="text-white/50 text-xs text-center mt-4 font-sfpro-regular">
                        💡 Tip: Long press on any image to view it in full screen
                      </Text>
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </Animated.View>

          {renderBottomSection()}
        </KeyboardAvoidingView>
        
        {renderFullScreenModal()}
      </SafeAreaView>
    </>
  );
}