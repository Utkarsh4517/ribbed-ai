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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10; 
const imageHeight = maxImageWidth * (16 / 9); // Calculate 9:16 aspect ratio height

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { generateAvatarsForPrompt, getAvatarsForPrompt } = useAppContext();
  
  const [inputText, setInputText] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
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
  }, []);

  const sendPrompt = async () => {
    if (!inputText.trim() || isLoading) return;

    const trimmedPrompt = inputText.trim();
    setCurrentPrompt(trimmedPrompt);
    setSelectedAvatar(null);

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
    setSelectedAvatar(avatar);
    setIsFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setIsFullScreenVisible(false);
    setSelectedAvatar(null);
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
    setIsFullScreenVisible(false);
  };

  const handleNextButton = async () => {
    if (selectedAvatar && selectedAvatar.imageUrl) {
      try {
        await apiService.saveAvatar(selectedAvatar.imageUrl);
        navigation.navigate('InfluencerScreen', { avatar: selectedAvatar });
      } catch (error) {
        console.error('Failed to save avatar:', error);
        Alert.alert('Error', 'Could not save the selected avatar. Please try again.');
      }
    }
  };

  const renderAvatarGrid = (items: Avatar[]) => {
    return (
      <View className="mt-6">
        <View className="flex-row flex-wrap justify-between">
          {items.map((avatar) => {
            const isSelected = selectedAvatar?.id === avatar.id;
            return (
              <TouchableOpacity 
                key={avatar.id} 
                className="mb-4" 
                style={{ width: maxImageWidth }}
                onPress={() => handleAvatarSelect(avatar)}
                activeOpacity={0.8}
              >
                {avatar.imageUrl ? (
                  <View>
                    <Image
                      source={{ uri: avatar.imageUrl }}
                      style={{
                        width: maxImageWidth,
                        height: imageHeight, // Changed from maxImageWidth to imageHeight
                        borderRadius: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isSelected ? '#FFFFFF' : 'transparent'
                      }}
                      resizeMode="cover"
                      onError={(error) => {
                        console.error(`Avatar ${avatar.id} failed to load:`, error.nativeEvent.error);
                      }}
                    />
                  
                  </View>
                ) : (
                  <View 
                    style={{
                      width: maxImageWidth,
                      height: imageHeight, 
                      borderRadius: 12,
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
                <Text className="text-white text-lg mt-4 font-sfpro-semibold">
                  Variation {selectedAvatar.variation}
                </Text>
                <Text className="text-white/70 text-sm mt-2 text-center px-4 font-sfpro-regular">
                  Tap anywhere to close
                </Text>
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
        <View className="bg-[#FF5555] px-8 pb-8 pt-6">
          <WhiteButton
            title="Continue"
            onPress={handleNextButton}
          />
        </View>
      );
    }

    return (
      <View className="bg-[#FF5555] px-8 pb-8 pt-6">
        <View className="flex-row items-center gap-x-3">
          <TextInput
            className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 text-white text-base font-sfpro-regular"
            style={{ 
              height: 56,
              textAlignVertical: 'center', 
              includeFontPadding: false,
              lineHeight: 20
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
            <View className="flex-row items-center justify-between px-8 py-6">
              <View>
                <Text className="text-white text-3xl font-sfpro-semibold">Create Avatar</Text>
                <Text className="text-white/80 text-base font-sfpro-regular mt-1">
                  Design your perfect AI persona
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfileScreen')}
                className="bg-white/20 rounded-full p-3 border border-white/30"
              >
                <Text className="text-white text-lg">👤</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
              {!currentPrompt && !isLoading && (
                <View className="items-center py-12">
                  <Text className="text-white/70 text-lg text-center font-sfpro-regular leading-relaxed">
                    Describe your ideal avatar and we'll generate multiple variations for you to choose from
                  </Text>
                </View>
              )}

              {isLoading && renderSkeletonGrid()}
              
              {!isLoading && avatars.length > 0 && (
                <>
                  {renderAvatarGrid(avatars)}
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