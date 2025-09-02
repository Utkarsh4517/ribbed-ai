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
import { apiService, Avatar } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10; 

export default function HomeScreen() {
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

  const renderAvatarGrid = (items: Avatar[]) => {
    return (
      <View className="mt-3">
        <View className="flex-row flex-wrap justify-between">
          {items.map((avatar) => (
            <TouchableOpacity 
              key={avatar.id} 
              className="mb-3" 
              style={{ width: maxImageWidth }}
              onPress={() => openFullScreen(avatar)}
              activeOpacity={0.8}
            >
              {avatar.imageUrl ? (
                <View>
                  <Image
                    source={{ uri: avatar.imageUrl }}
                    style={{
                      width: maxImageWidth,
                      height: maxImageWidth,
                      borderRadius: 8,
                      backgroundColor: '#f3f4f6'
                    }}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error(`Avatar ${avatar.id} failed to load:`, error.nativeEvent.error);
                    }}
                  />
                  <Text className="text-xs text-gray-600 mt-1 text-center">
                    Variation {avatar.variation}
                  </Text>
                </View>
              ) : (
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
                  <Text className="text-xs text-gray-600 mt-1">
                    Variation {avatar.variation}
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
         
        </ScrollView>

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
      </KeyboardAvoidingView>
      
      {renderFullScreenModal()}
    </SafeAreaView>
  );
}