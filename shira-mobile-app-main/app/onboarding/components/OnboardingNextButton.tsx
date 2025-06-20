import React from 'react';
import { ViewStyle, TextStyle, StyleSheet, View } from 'react-native';
import CustomButton from '../CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles';
import * as Haptics from 'expo-haptics';

interface OnboardingNextButtonProps {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
  showIcon?: boolean;
  variant?: 'filled' | 'outlined' | 'text';
}

const OnboardingNextButton: React.FC<OnboardingNextButtonProps> = ({
  title = 'Continue',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  gradientColors = ['#5a51e1', '#5a51e1'],
  showIcon = false,
  variant = 'filled',
}) => {
  
  // Handle press with haptic feedback
  const handlePress = () => {
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };
  
  return (
    <View style={styles.fullWidthContainer}>
      <CustomButton
        title={title.toLowerCase()} // lowercase text per the image
        onPress={handlePress}
        disabled={disabled}
        loading={loading}
        style={{
          borderRadius: 16, // Less rounded corners for more rectangular look
          width: '100%',     // Full width button
          marginHorizontal: 0, // Ensure no horizontal margins
          paddingHorizontal: 0, // Ensure no horizontal padding
          // Enhanced glow effect
          shadowColor: '#5a51e1',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.65, // Increased from 0.5
          shadowRadius: 14, // Increased from 10
          elevation: 8, // Increased from 6
          ...style,
        }}
        textStyle={{
          fontSize: 17, // Reduced from 18
          fontWeight: 'bold',
          textAlign: 'center',
          ...textStyle,
        }}
        gradientColors={gradientColors}
        icon={showIcon ? <Ionicons name="arrow-forward" size={18} color={colors.text} /> : undefined}
        iconPosition="right"
        variant={variant}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fullWidthContainer: {
    width: '100%',
    paddingHorizontal: 0,
    alignItems: 'stretch'
  }
});

export default OnboardingNextButton; 