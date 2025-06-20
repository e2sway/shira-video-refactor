import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions,
  Image,
  Easing
} from 'react-native';
import { useOnboarding } from '../hooks/useOnboardingState';
import { useRouter } from 'expo-router';
import { colors } from '../styles';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import OnboardingNextButton from '../components/OnboardingNextButton';

// Define the colors
const PURPLE_COLOR = '#5a51e1';
const PURPLE_LIGHT = '#8a82f9';
const PURPLE_DARK = '#3f3790';
const ACCENT_COLOR = '#f562a2';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Create confetti data
const CONFETTI_COUNT = 40;
const confettiConfig = Array.from({ length: CONFETTI_COUNT }, () => ({
  x: Math.random() * width,
  y: -20 - Math.random() * 100,
  size: 5 + Math.random() * 10,
  color: [
    PURPLE_COLOR, 
    PURPLE_LIGHT, 
    ACCENT_COLOR,
    '#ffffff'
  ][Math.floor(Math.random() * 4)],
  speed: 2 + Math.random() * 5,
  rotationSpeed: -1 + Math.random() * 2,
  rotation: Math.random() * 360,
  opacity: 0.6 + Math.random() * 0.4,
  delay: Math.random() * 5000
}));

const WelcomeScreen: React.FC = () => {
  const { goToNextStep } = useOnboarding();
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const sheepFloatAnim = useRef(new Animated.Value(0)).current;
  const sheepRotateAnim = useRef(new Animated.Value(0)).current;
  const titleScaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Confetti animations
  const confettiAnims = useRef(
    confettiConfig.map(() => ({
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;
  
  // Create animations for sparkles
  const sparkleAnims = useRef(
    confettiConfig.map(() => ({
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;
  
  // Animated elements
  useEffect(() => {
    // Main content fade in animation
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        })
      ])
    ]).start();
    
    // Sheep floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sheepFloatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sheepFloatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Sheep subtle rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sheepRotateAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sheepRotateAnim, {
          toValue: -1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sheepRotateAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Title popping animation
    Animated.sequence([
      Animated.delay(1200),
      Animated.spring(titleScaleAnim, {
        toValue: 1.1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(titleScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animate confetti falling
    confettiAnims.forEach((anim, index) => {
      const config = confettiConfig[index];
      
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: config.opacity,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: height + 50,
            duration: 15000 / config.speed,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(anim.rotation, {
              toValue: config.rotationSpeed > 0 ? 360 : -360,
              duration: 3000 / Math.abs(config.rotationSpeed),
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ),
        ]),
      ]).start();
    });
  }, []);
  
  // Navigation handlers
  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goToNextStep();
  };
  
  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/login');
  };
  
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background, PURPLE_DARK + '10', colors.background]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Falling confetti */}
      {confettiConfig.map((confetti, index) => (
        <Animated.View
          key={`confetti-${index}`}
          style={[
            styles.confetti,
            {
              left: confetti.x,
              width: confetti.size,
              height: confetti.size * 0.4,
              backgroundColor: confetti.color,
              opacity: confettiAnims[index].opacity,
              transform: [
                { translateY: confettiAnims[index].y },
                { 
                  rotate: confettiAnims[index].rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  }) 
                }
              ]
            }
          ]}
        />
      ))}
      
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Sheep Image */}
        <View style={styles.imageContainer}>
          <Animated.Image 
            source={require('../../../assets/images/shira_sheep_tier1.png')} 
            style={[
              styles.sheepImage,
              {
                transform: [
                  { translateY: sheepFloatAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15]
                  })},
                  { rotate: sheepRotateAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: ['-3deg', '0deg', '3deg']
                  })}
                ]
              }
            ]}
            resizeMode="contain"
          />
        </View>
        
        {/* Congratulations Text with animated scale */}
        <Animated.Text 
          style={[
            styles.title,
            {
              transform: [{ scale: titleScaleAnim }]
            }
          ]}
        >
          Congratulations!
        </Animated.Text>
        
        <Animated.Text style={styles.subtitle}>
          You are one step closer to achieving conversational fluency
        </Animated.Text>
      </Animated.View>
      
      {/* Get Started Button - positioned the same as other screens */}
      <View style={styles.buttonSection}>
        {/* Login Option moved directly above the button */}
        <TouchableOpacity 
          onPress={handleLogin} 
          style={styles.loginButton}
          activeOpacity={0.7}
        >
          <Text style={styles.loginText}>
            Already using Shira? <Text style={[styles.loginTextHighlight, { color: PURPLE_COLOR }]}>Log in</Text>
          </Text>
        </TouchableOpacity>
        
        <OnboardingNextButton
          title="Get Started"
          onPress={handleGetStarted}
          gradientColors={[PURPLE_COLOR, ACCENT_COLOR]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  imageContainer: {
    marginBottom: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheepImage: {
    width: 300,
    height: 300,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: colors.subText,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
    opacity: 0.9,
  },
  buttonSection: {
    marginBottom: 40,
    paddingHorizontal: 0,
    zIndex: 2,
  },
  loginButton: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
  },
  loginText: {
    fontSize: 16,
    color: colors.subText,
  },
  loginTextHighlight: {
    color: PURPLE_COLOR,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen; 