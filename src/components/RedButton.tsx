import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { HapticsService } from '../utils/haptics';

interface RedButtonProps extends TouchableOpacityProps {
  title: string;
  disabled?: boolean;
}

const RedButton: React.FC<RedButtonProps> = ({ title, disabled, onPress, ...props }) => {
  const handlePress = (event: any) => {
    if (!disabled) {
      HapticsService.medium();
      onPress?.(event);
    }
  };

  return (
    <TouchableOpacity
      className={`bg-[#FF5555] px-8 py-4 rounded-full shadow-lg ${
        disabled ? 'opacity-50' : 'active:scale-95'
      }`}
      disabled={disabled}
      onPress={handlePress}
      {...props}
    >
      <Text className="text-white font-sfpro-semibold text-lg  text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default RedButton;
