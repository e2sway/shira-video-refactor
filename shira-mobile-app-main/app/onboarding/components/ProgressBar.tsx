import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors } from '../styles';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentStep, 
  totalSteps, 
  style 
}) => {
  // Calculate progress percentage
  const progress = (currentStep / totalSteps) * 100;
  
  // Animation ref
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // Update animation when currentStep changes
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false, // We're animating width which isn't supported by native driver
    }).start();
  }, [currentStep, progress, progressAnimation]);
  
  // Convert the animated value to a width percentage
  const width = progressAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View 
        style={[
          styles.fill, 
          { width }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: colors.progressBarBackground,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.progressBarFill,
    borderRadius: 3,
  },
});

export default ProgressBar; 