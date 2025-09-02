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
  SafeAreaView,
  Image,
  Dimensions 
} from 'react-native';
import { apiService, Avatar } from '../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  avatars?: Avatar[];
  totalGenerated?: number;
  totalRequested?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const maxImageWidth = (screenWidth * 0.85) / 2 - 10; 

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you create amazing avatar images using Google Gemini 2.5 Flash Image via Replicate. I'll generate 6 different variations for each prompt you give me!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      await apiService.healthCheck();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      console.error('Backend connection failed:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const data = await apiService.createAvatar(userMessage.text);

      if (data.success && data.avatars) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Great! I've generated ${data.totalGenerated} avatar variations for you based on: "${userMessage.text}"`,
          isUser: false,
          timestamp: new Date(),
          avatars: data.avatars,
          totalGenerated: data.totalGenerated,
          totalRequested: data.totalRequested
        };

        setMessages(prev => [...prev, botMessage]);
        setIsConnected(true);
      } else {
        throw new Error('Failed to create avatar images');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsConnected(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble generating the avatar images. Please make sure the backend is running on localhost:3000 and your Replicate API token is configured.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      Alert.alert(
        'Connection Error',
        'Make sure the backend server is running and Replicate API token is configured'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.testReplicate();
      if (result.imageUrl) {
        Alert.alert('Connection Test', 'Test image generated successfully!');
      } else {
        Alert.alert('Connection Test', result.response);
      }
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      Alert.alert('Connection Failed', 'Replicate API is not responding');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAvatarGrid = (avatars: Avatar[]) => {
    return (
      <View className="mt-3">
        <View className="flex-row flex-wrap justify-between">
          {avatars.map((avatar) => (
            <View key={avatar.id} className="mb-3" style={{ width: maxImageWidth }}>
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
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}
    >
      <View
        className={`max-w-[90%] px-4 py-3 rounded-2xl ${
          message.isUser
            ? 'bg-blue-500 rounded-br-md'
            : 'bg-white rounded-bl-md shadow-sm border border-gray-100'
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            message.isUser ? 'text-white' : 'text-gray-800'
          }`}
        >
          {message.text}
        </Text>
        
        {message.avatars && renderAvatarGrid(message.avatars)}
        
        {message.totalGenerated !== undefined && (
          <Text className="text-xs text-gray-500 mt-2">
            Generated {message.totalGenerated} out of {message.totalRequested} variations
          </Text>
        )}
      </View>
      
      <Text className="text-xs text-gray-400 mt-1 mx-2">
        {message.timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="bg-white border-b border-gray-200 px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-gray-800">Avatar Creator</Text>
              <Text className="text-gray-600 mt-1">Generate 6 avatar variations with AI</Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${
                isConnected === null ? 'bg-yellow-500' : 
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <TouchableOpacity
                onPress={testConnection}
                className="bg-blue-100 px-3 py-1 rounded-full"
                disabled={isLoading}
              >
                <Text className="text-blue-600 text-sm font-medium">Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView 
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View className="items-start mb-4">
              <View className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                <View className="flex-row items-center">
                  <View className="flex-row space-x-1 mr-3">
                    <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  </View>
                  <Text className="text-gray-500">Generating 6 avatar variations...</Text>
                </View>
                <Text className="text-xs text-gray-400 mt-1">This may take 10-15 seconds</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <View className="flex-row items-end space-x-3">
            <TextInput
              className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base min-h-[44px] max-h-[120px]"
              placeholder="Describe the avatar you want (6 variations will be generated)..."
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
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Text className="text-white text-xl font-semibold">→</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="text-xs text-gray-400 mt-2 text-right">
            {inputText.length}/500
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
