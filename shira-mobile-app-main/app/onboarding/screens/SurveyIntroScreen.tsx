import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Dimensions
} from 'react-native';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';
import { colors } from '../styles';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

// Define constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const PURPLE_ACCENT = colors.primary;
const PINK_ACCENT = '#e15190';

// Custom gradient sparkle icon
const GradientSparkle = ({ size = 44 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="sparkleGradient" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={PURPLE_ACCENT} />
        <Stop offset="1" stopColor={PINK_ACCENT} />
      </LinearGradient>
    </Defs>
    <Path 
      d="M12 2L11.12 7.71C10.9 9.04 9.04 10.9 7.71 11.12L2 12L7.71 12.88C9.04 13.1 10.9 14.96 11.12 16.29L12 22L12.88 16.29C13.1 14.96 14.96 13.1 16.29 12.88L22 12L16.29 11.12C14.96 10.9 13.1 9.04 12.88 7.71L12 2Z"
      fill="url(#sparkleGradient)"
    />
  </Svg>
);

const SurveyIntroScreen: React.FC = () => {
  const { goToNextStep, goToPreviousStep, state } = useOnboarding();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // Run animations on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();

    // Animated sparkle effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topBlock}>
        <OnboardingBackButton onPress={goToPreviousStep} />
      </View>

      <View style={styles.contentWrapper}>
        <Animated.View 
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="person-outline" size={85} color={PURPLE_ACCENT} />
            </View>
            <Animated.View 
              style={[
                styles.sparkle, 
                {
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3]
                  }),
                  transform: [{ 
                    scale: sparkleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.9, 1.2, 0.9]
                    }) 
                  }]
                }
              ]}
            >
              <GradientSparkle size={55} />
            </Animated.View>
          </View>

          <Text style={styles.headerText}>
            Let's Craft Your Perfect Learning Journey
          </Text>
          
        </Animated.View>
      </View>

      <View style={styles.buttonSection}>
        <OnboardingNextButton 
          title="Continue" 
          onPress={goToNextStep}
          gradientColors={[PURPLE_ACCENT, `${PURPLE_ACCENT}dd`]}
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
  },
  topBlock: {
    paddingTop: 50,
    marginBottom: 20,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center', // Center vertically
    alignItems: 'center',     // Center horizontally
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  iconContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  iconBackground: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(90, 81, 225, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -15,
    right: -15,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  descriptionText: {
    fontSize: 17,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    letterSpacing: 0.3,
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  buttonSection: {
    marginBottom: 40,
    paddingHorizontal: 0
  },
  continueButton: {
    width: '90%',
  },
});

export default SurveyIntroScreen; 