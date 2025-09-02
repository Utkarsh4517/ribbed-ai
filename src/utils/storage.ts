import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '_hasCompletedOnboarding';
const AUTH_KEY = '_isAuthenticated';

export class StorageService {
  static async setOnboardingCompleted(
    completed: boolean = true,
  ): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(completed));
  }

  static async hasCompletedOnboarding(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value ? JSON.parse(value) : false;
  }

  static async setAuthenticated(authenticated: boolean = true): Promise<void> {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authenticated));
  }

  static async isAuthenticated(): Promise<boolean> {
    const value = await AsyncStorage.getItem(AUTH_KEY);
    return value ? JSON.parse(value) : false;
  }
}
