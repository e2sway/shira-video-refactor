import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  Animated, 
  Easing 
} from 'react-native';
import { colors } from '../styles';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animationType?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'none';
  delay?: number;
  duration?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  animationType = 'fade',
  delay = 0,
  duration = 500,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Wait for the specified delay
    const delayTimer = setTimeout(() => {
      switch (animationType) {
        case 'fade':
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
            easing: Easing.ease,
          }).start();
          break;
          
        case 'slide':
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: duration,
              useNativeDriver: true,
              easing: Easing.ease,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: duration,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
          ]).start();
          break;
          
        case 'bounce':
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
              toValue: 1,
              friction: 4,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
          break;
          
        case 'pulse':
          fadeAnim.setValue(1); // Start fully visible
          
          // Create a repeating pulse animation
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {
                toValue: 1.05,
                duration: duration,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.ease),
              }),
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: duration,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.ease),
              }),
            ])
          ).start();
          break;
          
        case 'none':
        default:
          fadeAnim.setValue(1); // Just show the card without animation
          break;
      }
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [animationType, fadeAnim, slideAnim, bounceAnim, pulseAnim, delay, duration]);

  // Set up the animation styles based on the animation type
  const animatedStyle = (() => {
    switch (animationType) {
      case 'fade':
        return {
          opacity: fadeAnim,
        };
      case 'slide':
        return {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        };
      case 'bounce':
        return {
          opacity: fadeAnim,
          transform: [
            { scale: Animated.add(1, Animated.multiply(bounceAnim, 0.1)) },
          ],
        };
      case 'pulse':
        return {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        };
      case 'none':
      default:
        return {
          opacity: 1,
        };
    }
  })();

  return (
    <Animated.View style={[styles.card, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.selectionBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.selectionBorder,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default AnimatedCard; 