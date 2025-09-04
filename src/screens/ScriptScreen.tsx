import React, { useState, useRef, useEffect } from 'react';
import { 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator // Add ActivityIndicator import
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService, TTSOptions } from '../services/api';
import WhiteButton from '../components/WhiteButton';
import RedButton from '../components/RedButton';

type ScriptScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ScriptScreen'>;

export default function ScriptScreen({ route }: { route: RouteProp<MainStackParamList, 'ScriptScreen'> }) {
  const { scene } = route.params;
  const navigation = useNavigation<ScriptScreenNavigationProp>();
  
  const [scriptText, setScriptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Aria');
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const voices = [
    { id: 'Aria', name: 'Aria', description: 'Warm & Professional' },
    { id: 'Roger', name: 'Roger', description: 'Deep & Authoritative' },
    { id: 'Sarah', name: 'Sarah', description: 'Friendly & Clear' },
    { id: 'Laura', name: 'Laura', description: 'Elegant & Smooth' },
    { id: 'Charlie', name: 'Charlie', description: 'Energetic & Young' }
  ];

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

  const handleGenerateSpeech = async () => {
    if (!scriptText.trim()) {
      Alert.alert('Error', 'Please enter some text to convert to speech');
      return;
    }

    if (scriptText.length > 1000) {
      Alert.alert('Error', 'Text is too long. Maximum 1000 characters allowed.');
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
        
        // Automatically navigate to QueueScreen when audio is ready
        navigation.navigate('QueueScreen', { 
          scene: scene,
          audioUrl: result.audioUrl 
        });
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

  const handleCreateVideo = () => {
    if (audioUrl) {
      navigation.navigate('QueueScreen', { 
        scene: scene,
        audioUrl: audioUrl 
      });
    }
  };

  const selectedVoiceData = voices.find(v => v.id === selectedVoice) || voices[0];

  const renderVoiceDropdown = () => (
    <Modal
      visible={showVoiceDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowVoiceDropdown(false)}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50 justify-center items-center px-8"
        activeOpacity={1}
        onPress={() => setShowVoiceDropdown(false)}
      >
        <TouchableOpacity 
          className="bg-white rounded-2xl p-6 w-full max-w-sm"
          activeOpacity={1}
          onPress={() => {}}
        >
          <Text className="text-gray-800 text-lg font-sfpro-semibold mb-4 text-center">
            Select Voice
          </Text>
          
          {voices.map((voice) => (
            <TouchableOpacity
              key={voice.id}
              onPress={() => {
                setSelectedVoice(voice.id);
                setShowVoiceDropdown(false);
              }}
              className={`p-4 rounded-xl mb-2 border-2 ${
                selectedVoice === voice.id
                  ? 'bg-[#FF5555]/10 border-[#FF5555]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <Text className={`font-sfpro-semibold ${
                selectedVoice === voice.id ? 'text-[#FF5555]' : 'text-gray-800'
              }`}>
                {voice.name}
              </Text>
              <Text className="text-gray-600 text-sm font-sfpro-regular mt-1">
                {voice.description}
              </Text>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

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
            {/* Header */}
            <View className="flex-row items-center justify-between px-8 py-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-white/20 rounded-full p-3 border border-white/30"
              >
                <Text className="text-white text-lg">←</Text>
              </TouchableOpacity>
              
              <View className="items-center">
                <Text className="text-white text-2xl font-sfpro-semibold">Create Script</Text>
                <Text className="text-white/80 text-sm font-sfpro-regular mt-1">
                  {scene.name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowVoiceDropdown(true)}
                className="bg-white/20 rounded-full px-4 py-3 border border-white/30"
              >
                <Text className="text-white text-xs font-sfpro-medium">Voice</Text>
              </TouchableOpacity>
            </View>

            {/* Scene Image - Centered */}
            <View className="items-center mb-8">
              {scene.imageUrl ? (
                <Image
                  source={{ uri: scene.imageUrl }}
                  style={{
                    width: 160,
                    height: 160 * (16 / 9), // Changed to 9:16 aspect ratio
                    borderRadius: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View 
                  style={{
                    width: 160,
                    height: 160 * (16 / 9), // Changed to 9:16 aspect ratio
                    borderRadius: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                  className="items-center justify-center border-2 border-white/20"
                >
                  <Text className="text-white/60 text-sm font-sfpro-regular">
                    No Image
                  </Text>
                </View>
              )}
            </View>

            <ScrollView 
              className="flex-1 px-8"
              showsVerticalScrollIndicator={false}
            >
          

              {/* Script Text */}
              <View className="bg-white/10 rounded-2xl p-6 border border-white/20 mb-6">
                <Text className="text-white text-lg font-sfpro-semibold mb-4">Your Script</Text>
                
                <TextInput
                  value={scriptText}
                  onChangeText={setScriptText}
                  placeholder="What should your avatar say? Write your script here..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  multiline
                  className="bg-white/10 border border-white/20 rounded-2xl p-4 text-white text-base font-sfpro-regular"
                  style={{
                    minHeight: 120,
                    textAlignVertical: 'top'
                  }}
                />
                
                <View className="flex-row justify-between items-center mt-3">
                  <Text className="text-xs text-white/60 font-sfpro-regular">
                    {scriptText.length}/1000 characters (Should not be more than 30 seconds)
                  </Text>
                  {scriptText.length > 900 && (
                    <Text className="text-xs text-white/80 font-sfpro-medium">
                      Approaching limit
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="px-8 pb-8">
              <TouchableOpacity
                onPress={handleGenerateSpeech}
                disabled={isGenerating || !scriptText.trim()}
                className={`h-14 rounded-2xl items-center justify-center flex-row ${
                  scriptText.trim() && !isGenerating
                    ? 'bg-white'
                    : 'bg-white/20 border border-white/30'
                }`}
              >
                {isGenerating && (
                  <ActivityIndicator 
                    size="small" 
                    color={scriptText.trim() ? '#FF5555' : 'rgba(255, 255, 255, 0.6)'} 
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text className={`text-base font-sfpro-semibold ${
                  scriptText.trim() && !isGenerating ? 'text-[#FF5555]' : 'text-white/60'
                }`}>
                  {isGenerating ? 'Generating Speech...' : 'Generate Speech'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
        
        {renderVoiceDropdown()}
      </SafeAreaView>
    </>
  );
}
