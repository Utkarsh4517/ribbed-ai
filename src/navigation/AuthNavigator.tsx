import { createStackNavigator } from "@react-navigation/stack"
import { AuthStackParamList } from "../types/navigation"
import AuthScreen from "../screens/AuthScreen";
const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Auth" component={AuthScreen} />

        </Stack.Navigator>
    )
}