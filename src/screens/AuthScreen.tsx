import React, { useState } from 'react';
import { 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const { authenticate } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in
        const result = await apiService.signIn(email.trim(), password);
        Alert.alert('Success', 'Signed in successfully!');
        authenticate(); // Navigate to main app
      } else {
        // Sign up
        const result = await apiService.signUp(email.trim(), password);
        Alert.alert(
          'Account Created', 
          'Please check your email to verify your account, then sign in.',
          [
            { text: 'OK', onPress: () => setIsLogin(true) }
          ]
        );
      }
    } catch (error) {
      // @ts-ignore
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-8">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Ribbed AI
            </Text>
            <Text className="text-lg text-gray-600">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <TextInput
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              className={`w-full py-4 rounded-lg items-center mt-6 ${
                isLoading ? 'bg-gray-400' : 'bg-blue-500'
              }`}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <Text className="text-white text-lg font-semibold">
                {isLoading 
                  ? 'Please wait...' 
                  : isLogin 
                    ? 'Sign In' 
                    : 'Create Account'
                }
              </Text>
            </TouchableOpacity>

            <View className="items-center mt-6">
              <Text className="text-gray-600 mb-2">
                {isLogin 
                  ? "Don't have an account?" 
                  : "Already have an account?"
                }
              </Text>
              <TouchableOpacity onPress={toggleMode} disabled={isLoading}>
                <Text className="text-blue-500 font-semibold text-base">
                  {isLogin ? 'Create Account' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
