import { Text, View } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../types/navigation';

export default function InfluencerScreen({ route }: { route: RouteProp<MainStackParamList, 'InfluencerScreen'> }) {
  const { avatar } = route.params;
  console.log(avatar);
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">Influencer Screen</Text>
      
    </View>
  );
}
