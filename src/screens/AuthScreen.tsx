import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../contexts/AppContext';
import WhiteButton from '../components/WhiteButton';
import RedButton from '../components/RedButton';
import { HapticsService } from '../utils/haptics';

export default function AuthScreen() {
  const { signIn, signUp } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  React.useEffect(() => {
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

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    HapticsService.medium();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await signIn(email.trim(), password);
        Alert.alert('Success', 'Signed in successfully!');
      }
    } catch (error) {
      Alert.alert(
        'Authentication Error',
        error instanceof Error ? error.message : 'Authentication failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    HapticsService.light();
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FF5555" />
      <SafeAreaView className="flex-1 bg-[#FF5555]">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <Animated.View 
              className="flex-1 px-8 py-12"
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }}
            >
              <View className="items-center mb-12 mt-8">
                <Text className="text-white text-4xl font-sfpro-semibold text-center mb-4 leading-tight">
                  {isSignUp ? 'Join Ribbed AI' : 'Welcome Back'}
                </Text>
                <Text className="text-white/90 text-lg text-center leading-relaxed px-4 font-sfpro-regular">
                  {isSignUp
                    ? 'Create your account to start building amazing AI videos'
                    : 'Sign in to continue your AI video journey'
                  }
                </Text>
              </View>

              <View className="space-y-6 mb-8">
                <View>
                  <Text className="text-white font-sfpro-medium text-base mb-3 ml-2">
                    Email Address
                  </Text>
                  <TextInput
                    className="bg-white/10 border border-white/20 rounded-2xl px-6 text-white text-base font-sfpro-regular"
                    style={{ 
                      height: 56,
                      textAlignVertical: 'center', 
                      includeFontPadding: false,
                      lineHeight: 20
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <View>
                  <Text className="text-white font-sfpro-medium text-base my-3 ml-2 ">
                    Password
                  </Text>
                  <TextInput
                    className="bg-white/10 border border-white/20 rounded-2xl px-6 text-white text-base font-sfpro-regular"
                    style={{ 
                      height: 56,
                      textAlignVertical: 'center', 
                      includeFontPadding: false,
                      lineHeight: 20
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View className="mb-6">
                <WhiteButton
                  title={
                    isLoading
                      ? (isSignUp ? 'Creating Account...' : 'Signing In...')
                      : (isSignUp ? 'Create Account' : 'Sign In')
                  }
                  onPress={handleAuth}
                  disabled={isLoading}
                />
              </View>

              <View className="items-center">
                <Text className="text-white/70 font-sfpro-regular text-base mb-4">
                  {isSignUp
                    ? 'Already have an account?'
                    : "Don't have an account?"
                  }
                </Text>
                <RedButton
                  title={isSignUp ? 'Sign In' : 'Sign Up'}
                  onPress={toggleAuthMode}
                  disabled={isLoading}
                />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
