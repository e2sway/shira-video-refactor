import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles';

interface OnboardingBackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  iconSize?: number;
  iconColor?: string;
}

const OnboardingBackButton: React.FC<OnboardingBackButtonProps> = ({ 
  onPress, 
  style, 
  iconSize = 24, 
  iconColor = colors.text 
}) => {
  return (
    <TouchableOpacity 
      style={[styles.backButton, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OnboardingBackButton; 