import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';
const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};
export class HapticsService {
  static light() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  }
  static medium() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  }

  static heavy() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    }
  }

  static success() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    }
  }

  static warning() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationWarning', options);
    }
  }

  static error() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationError', options);
    }
  }

 
  static selection() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('selection', options);
    }
  }

  static rigid() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('rigid', options);
    }
  }

  
  static soft() {
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('soft', options);
    }
  }
}

export const {
  light,
  medium,
  heavy,
  success,
  warning,
  error,
  selection,
  rigid,
  soft
} = HapticsService;
