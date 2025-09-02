import React, { useState, useEffect } from 'react';
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
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService, Avatar } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainStackParamList } from '../types/navigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10; 

type HomeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [totalGenerated, setTotalGenerated] = useState<number | null>(null);
  const [totalRequested, setTotalRequested] = useState<number | null>(null);

  const sendPrompt = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setAvatars([]);
    setTotalGenerated(null);
    setTotalRequested(null);

    try {
      const data = await apiService.createAvatar(inputText.trim());

      if (data.success && data.avatars) {
        setAvatars(data.avatars || []);
        console.log(data.avatars);
        setTotalGenerated(data.totalGenerated ?? null);
        setTotalRequested(data.totalRequested ?? null);
      } else {
        throw new Error('Failed to create avatar images');
      }
    } catch (error) {
      console.error('Error:', error);
      
      Alert.alert(
        'Connection Error',
        'Make sure the backend server is running and Replicate API token is configured'
      );
    } finally {
      setIsLoading(false);
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

  const handleNextButton = () => {
    if (selectedAvatar) {
      navigation.navigate('InfluencerScreen', { avatar: selectedAvatar });
    }
  };

  const renderAvatarGrid = (items: Avatar[]) => {
    return (
      <View className="mt-3">
        <View className="flex-row flex-wrap justify-between">
          {items.map((avatar) => {
            const isSelected = selectedAvatar?.id === avatar.id;
            return (
              <TouchableOpacity 
                key={avatar.id} 
                className="mb-3" 
                style={{ width: maxImageWidth }}
                onPress={() => handleAvatarSelect(avatar)}
                activeOpacity={0.8}
              >
                {avatar.imageUrl ? (
                  <View>
                    <View
                      style={{
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isSelected ? '#3B82F6' : 'transparent',
                        borderRadius: 8,
                        padding: isSelected ? 2 : 0,
                      }}
                    >
                      <Image
                        source={{ uri: avatar.imageUrl }}
                        style={{
                          width: maxImageWidth - (isSelected ? 4 : 0),
                          height: maxImageWidth - (isSelected ? 4 : 0),
                          borderRadius: 6,
                          backgroundColor: '#f3f4f6'
                        }}
                        resizeMode="cover"
                        onError={(error) => {
                          console.error(`Avatar ${avatar.id} failed to load:`, error.nativeEvent.error);
                        }}
                      />
                    </View>
                    <Text className={`text-xs mt-1 text-center ${
                      isSelected ? 'text-blue-600 font-semibold' : 'text-gray-600'
                    }`}>
                      Variation {avatar.variation}
                      {isSelected && ' ✓'}
                    </Text>
                  </View>
                ) : (
                  <View 
                    style={{
                      width: maxImageWidth,
                      height: maxImageWidth,
                      borderRadius: 8,
                      backgroundColor: '#f3f4f6',
                      borderWidth: isSelected ? 3 : 1,
                      borderColor: isSelected ? '#3B82F6' : '#e5e7eb'
                    }}
                    className="items-center justify-center"
                  >
                    <Text className="text-xs text-gray-500 text-center px-2">
                      Failed to generate
                    </Text>
                    <Text className={`text-xs mt-1 ${
                      isSelected ? 'text-blue-600 font-semibold' : 'text-gray-600'
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
      <View className="mt-3">
        <View className="flex-row flex-wrap justify-between">
          {placeholders.map((i) => (
            <View key={`skeleton-${i}`} className="mb-3" style={{ width: maxImageWidth }}>
              <View
                style={{
                  width: maxImageWidth,
                  height: maxImageWidth,
                  borderRadius: 8,
                  backgroundColor: '#e5e7eb'
                }}
                className="animate-pulse"
              />
              <View className="h-3 bg-gray-200 rounded mt-2 mx-auto w-20 animate-pulse" />
            </View>
          ))}
        </View>
        <Text className="text-xs text-gray-400 mt-1">This may take 10-15 seconds</Text>
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
                <Text className="text-white text-lg mt-4 font-medium">
                  Variation {selectedAvatar.variation}
                </Text>
                <Text className="text-gray-300 text-sm mt-2 text-center px-4">
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
        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-gray-600">
              Selected: Variation {selectedAvatar.variation}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedAvatar(null)}
              className="px-3 py-1 bg-gray-200 rounded-full"
            >
              <Text className="text-gray-600 text-sm">Change</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="w-full bg-blue-500 rounded-2xl py-4 items-center"
            onPress={handleNextButton}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-semibold">Next</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <View className="flex-row items-center gap-x-3">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base min-h-[44px] max-h-[120px]"
            placeholder="Describe the avatar you want.."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
            textAlignVertical="top"
          />
          <TouchableOpacity
            className={`w-12 h-12 rounded-full items-center justify-center ${
              inputText.trim() && !isLoading
                ? 'bg-blue-500'
                : 'bg-gray-300'
            }`}
            onPress={sendPrompt}
            disabled={!inputText.trim() || isLoading}
          >
            <Text className="text-white text-xl font-semibold">→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
        >
          {isLoading && renderSkeletonGrid()}
          
          {!isLoading && avatars.length > 0 && (
            <>
             
              {renderAvatarGrid(avatars)}
            </>
          )}
        </ScrollView>

        {renderBottomSection()}
      </KeyboardAvoidingView>
      
      {renderFullScreenModal()}
    </SafeAreaView>
  );
}