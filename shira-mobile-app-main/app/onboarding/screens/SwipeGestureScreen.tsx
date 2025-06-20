import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  Easing,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';
import { colors } from '../styles';

// Define constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const PURPLE_ACCENT = colors.primary;
const ANIMATION_DURATION = 2500;
const MOVEMENT_DURATION = 900; // Consistent duration for both up and down movements
const PAUSE_DURATION = 1500;
const DARK_GREY = '#333333';
const LIGHTER_GREY = '#999999';

// Define image sources
const IMAGE_SOURCES = [
  require('../../../assets/images/key_phrase.jpg'),
  require('../../../assets/images/scroll_preview_2.jpg'),
  require('../../../assets/images/scroll_preview_1.jpg'),
];

const SwipeGestureScreen: React.FC = () => {
  const { goToNextStep, goToPreviousStep } = useOnboarding();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardPosition = useRef(new Animated.Value(SCREEN_HEIGHT * 0.5)).current;

  // Run initial animations
  useEffect(() => {
    // Fade in content
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

    // Start card animations
    startAnimations();
  }, []);

  // Loop the animations
  const startAnimations = () => {
    // Reset animations
    cardPosition.setValue(SCREEN_HEIGHT * 0.5);
    cardOpacity.setValue(0);
    
    // Create animation sequence
    Animated.sequence([
      // Initial delay
      Animated.delay(500),
      
      // Card appears and moves to center
      Animated.parallel([
        // Fade in card
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500, // Slightly longer fade-in for smoother appearance
          useNativeDriver: true,
        }),
        // Move card to center - SLOWED DOWN
        Animated.timing(cardPosition, {
          toValue: 0, // Center position
          duration: MOVEMENT_DURATION, // Consistent slower duration
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]),
      
      // Pause in the middle
      Animated.delay(PAUSE_DURATION),
      
      // Continue movement off screen
      Animated.parallel([
        // Keep opacity while moving
        Animated.sequence([
          // Keep full opacity during initial movement
          Animated.delay(400), // Delay fade-out to match with slower movement
          // Then fade out as it reaches the top
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: 500, // Slower fade out
            useNativeDriver: true,
          })
        ]),
        // Move card off screen (upward) - SLOWED DOWN
        Animated.timing(cardPosition, {
          toValue: -SCREEN_HEIGHT * 0.5,
          duration: MOVEMENT_DURATION, // Consistent with entry animation
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        })
      ]),
      
      // Brief delay before restarting
      Animated.delay(400) // Slightly longer delay before restart
    ]).start(() => {
      // Change to next image before restarting animation
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % IMAGE_SOURCES.length);
      // Restart animation when complete
      startAnimations();
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBlock}>
        <OnboardingBackButton onPress={goToPreviousStep} />
      </View>

      <Animated.View 
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Flow Through Your Learning Journey</Text>
          <Text style={styles.subHeaderText}>
            Swipe between videos to learn at your own pace and discover phrases that resonate with you.
          </Text>
        </View>

        <View style={styles.demoContainer}>
          {/* Video card that animates from bottom to top */}
          <Animated.View 
            style={[
              styles.videoCard,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardPosition }]
              }
            ]}
          >
            <Image 
              source={IMAGE_SOURCES[currentImageIndex]} 
              style={styles.cardImage}
              resizeMode="cover"
            />
          </Animated.View>
        </View>
      </Animated.View>

      <View style={styles.buttonSection}>
        <OnboardingNextButton 
          title="Got it" 
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
  mainContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subHeaderText: {
    fontSize: 17,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: SCREEN_WIDTH * 0.85,
    letterSpacing: 0.3,
  },
  demoContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },
  videoCard: {
    width: SCREEN_WIDTH * 0.85,
    height: 200,
    backgroundColor: DARK_GREY,
    borderRadius: 12,
    position: 'absolute',
    zIndex: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  buttonSection: {
    marginBottom: 40,
    paddingHorizontal: 0
  },
});

export default SwipeGestureScreen; 