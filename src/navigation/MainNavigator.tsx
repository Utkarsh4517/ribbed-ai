import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/InfluencerScreen';
import { MainStackParamList } from '../types/navigation';
import SettingsScreen from '../screens/SceneScreen';
import InfluencerScreen from '../screens/InfluencerScreen';
import SceneScreen from '../screens/SceneScreen';
import QueueScreen from '../screens/QueueScreen';
import ScriptScreen from '../screens/ScriptScreen';

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
        name="SceneScreen"
        component={SceneScreen}
       
      />
      <Stack.Screen
        name="ScriptScreen"
        component={ScriptScreen}
       
      />
      <Stack.Screen
        name="QueueScreen"
        component={QueueScreen}
       
      />
    </Stack.Navigator>
  );
}
