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
  avatar?: Avatar;
  imageUrl?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const maxImageWidth = screenWidth * 0.7;

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you create amazing avatar images using Google Gemini 2.5 Flash Image via Replicate. Describe the kind of avatar you'd like me to generate!",
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

      if (data.success && data.imageUrl) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Great! I've generated an avatar image for you based on your request: "${userMessage.text}"`,
          isUser: false,
          timestamp: new Date(),
          imageUrl: data.imageUrl
        };

        setMessages(prev => [...prev, botMessage]);
        setIsConnected(true);
      } else {
        throw new Error('Failed to create avatar image');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsConnected(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble generating the avatar image. Please make sure the backend is running on localhost:3000 and your Replicate API token is configured.",
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

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      className={`mb-4 ${message.isUser ? 'items-end' : 'items-start'}`}
    >
      <View
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          message.isUser
            ? 'bg-blue-500 rounded-br-md'
            : 'bg-white rounded-bl-md shadow-sm border border-gray-100'
        }`}
      >
        {/* Text content */}
        <Text
          className={`text-base leading-6 ${
            message.isUser ? 'text-white' : 'text-gray-800'
          }`}
        >
          {message.text}
        </Text>
        
        {message.imageUrl && (
          <View className="mt-3">
            <Image
              source={{ uri: message.imageUrl }}
              style={{
                width: maxImageWidth,
                height: maxImageWidth,
                borderRadius: 12,
                backgroundColor: '#f3f4f6'
              }}
              resizeMode="cover"
              onError={(error) => {
                console.error('Image failed to load:', error.nativeEvent.error);
              }}
            />
          </View>
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
              <Text className="text-gray-600 mt-1">Generate avatar images with AI</Text>
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
                  <Text className="text-gray-500">Generating your avatar image...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <View className="flex-row items-end space-x-3">
            <TextInput
              className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base min-h-[44px] max-h-[120px]"
              placeholder="Describe the avatar image you want to create..."
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
