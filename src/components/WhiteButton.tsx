import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import { HapticsService } from '../utils/haptics';

interface WhiteButtonProps extends TouchableOpacityProps {
  title: string;
  disabled?: boolean;
}

const WhiteButton: React.FC<WhiteButtonProps> = ({ title, disabled, onPress, ...props }) => {
  const handlePress = (event: any) => {
    if (!disabled) {
      HapticsService.medium();
      onPress?.(event);
    }
  };

  return (
    <TouchableOpacity
      className={`bg-white px-8 py-4 rounded-full shadow-lg border-2 border-[#FF5555] ${
        disabled ? 'opacity-50' : 'active:scale-95'
      }`}
      disabled={disabled}
      onPress={handlePress}
      {...props}
    >
      <Text className="text-[#FF5555] text-lg font-sfpro-semibold text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default WhiteButton;
