import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import InfluencerScreen from '../screens/InfluencerScreen';
import QueueScreen from '../screens/QueueScreen';
import ScriptScreen from '../screens/ScriptScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { MainStackParamList } from '../types/navigation';

const Stack = createStackNavigator<MainStackParamList>();

export default function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
       headerShown: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen
        name="InfluencerScreen"
        component={InfluencerScreen}
      />
      <Stack.Screen
        name="ScriptScreen"
        component={ScriptScreen}
      />
      <Stack.Screen
        name="QueueScreen"
        component={QueueScreen}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      />
    </Stack.Navigator>
  );
}
