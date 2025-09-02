import { Text, TouchableOpacity, View } from 'react-native';
import { useAppContext } from '../contexts/AppContext';

export default function AuthScreen() {
  const { authenticate } = useAppContext();
  
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">Auth Screen</Text>
      <TouchableOpacity
        className="mt-4"
        onPress={authenticate}
      >
        <Text>Navigate to Tabs</Text>
      </TouchableOpacity>
    </View>
  );
}
