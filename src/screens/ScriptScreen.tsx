import React, { useState } from 'react';
import { Text, View, Image, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, TTSOptions } from '../services/api';

type ScriptScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ScriptScreen'>;

export default function ScriptScreen({ route }: { route: RouteProp<MainStackParamList, 'ScriptScreen'> }) {
  const { scene } = route.params;
  const navigation = useNavigation<ScriptScreenNavigationProp>();
  
  const [scriptText, setScriptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Aria');

  const voices = ['Aria', 'Roger', 'Sarah', 'Laura', 'Charlie'];

  const handleGenerateSpeech = async () => {
    if (!scriptText.trim()) {
      Alert.alert('Error', 'Please enter some text to convert to speech');
      return;
    }

    if (scriptText.length > 5000) {
      Alert.alert('Error', 'Text is too long. Maximum 5000 characters allowed.');
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const options: TTSOptions = {
        voice: selectedVoice,
        stability: 0.5,
        similarity_boost: 0.75,
        speed: 1,
        timestamps: false
      };

      const result = await apiService.generateSpeech(scriptText, options);
      
      if (result.success && result.audioUrl) {
        setAudioUrl(result.audioUrl);
        console.log('Audio URL:', result.audioUrl);
        Alert.alert('Success', 'Speech generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate speech');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate speech');
    } finally {
      setIsGenerating(false);
    }
  };

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

        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Script Text</Text>
          
          <TextInput
            value={scriptText}
            onChangeText={setScriptText}
            placeholder="Enter your script text here..."
            multiline
            numberOfLines={6}
            className="bg-gray-50 rounded-lg p-4 text-gray-800 text-base"
            style={{
              minHeight: 150,
              textAlignVertical: 'top'
            }}
          />
          
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-xs text-gray-500">
              {scriptText.length}/5000 characters
            </Text>
            {scriptText.length > 4500 && (
              <Text className="text-xs text-orange-500">
                Approaching limit
              </Text>
            )}
          </View>
        </View>

        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Select Voice</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-3">
              {voices.map((voice) => (
                <TouchableOpacity
                  key={voice}
                  onPress={() => setSelectedVoice(voice)}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedVoice === voice
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedVoice === voice ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {voice}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Generate Speech</Text>
          
          <TouchableOpacity
            className={`rounded-lg p-4 items-center ${
              isGenerating || !scriptText.trim()
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
            onPress={handleGenerateSpeech}
            disabled={isGenerating || !scriptText.trim()}
          >
            <Text className="text-white font-semibold">
              {isGenerating ? 'Generating Speech...' : 'Generate Speech'}
            </Text>
          </TouchableOpacity>

          {audioUrl && (
            <View className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <Text className="text-green-800 font-semibold mb-2">✅ Speech Generated Successfully!</Text>
              <TouchableOpacity
                className="bg-green-500 rounded-lg p-3 items-center"
                onPress={() => Alert.alert('Audio URL', audioUrl)}
              >
                <Text className="text-white font-semibold">View Audio URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
