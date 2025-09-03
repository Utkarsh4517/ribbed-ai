import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface RedButtonProps extends TouchableOpacityProps {
  title: string;
  disabled?: boolean;
}

const RedButton: React.FC<RedButtonProps> = ({ title, disabled, ...props }) => {
  return (
    <TouchableOpacity
      className={`bg-[#FF5555] px-8 py-4 rounded-full shadow-lg ${
        disabled ? 'opacity-50' : 'active:scale-95'
      }`}
      disabled={disabled}
      {...props}
    >
      <Text className="text-white font-sfpro-semibold text-lg  text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default RedButton;
