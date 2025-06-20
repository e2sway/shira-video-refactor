import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  Image
} from 'react-native';
import { colors } from '../styles';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';
import { Ionicons } from '@expo/vector-icons';

// Define the purple accent color
const PURPLE_ACCENT = '#5a51e1';
// Define caption purple background color (from image)
const CAPTION_PURPLE = '#6659db';
// Define yellow for highlighting
const YELLOW_COLOR = '#FFD700';
// Define grey colors
const DARK_GREY = '#333333';
const LIGHTER_GREY = '#999999';

const KeyPhraseExplanationScreen: React.FC = () => {
  const { goToNextStep, goToPreviousStep, state } = useOnboarding();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Run animations on mount
  useEffect(() => {
    // Main content animation
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
  }, []);

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
          <Text style={styles.headerText}>How learning a language works on Shira</Text>
        </View>

        <Text style={styles.explanationText}>
          You will be shown a video clip, which will contain a{' '}
          <Text style={styles.keyPhraseText}>key phrase</Text>
        </Text>
        
        <View style={styles.videoExampleContainer}>
          <View style={styles.videoPreview}>
            <Image 
              source={require('../../../assets/images/key_phrase.jpg')} 
              style={styles.keyPhraseImage}
              resizeMode="cover"
            />
          </View>
        </View>
        
        <Text style={styles.bottomText}>
          Internalize the key phrase by engaging with the clip, and translating the captions
        </Text>
      </Animated.View>

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
  mainContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 50,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  keyPhraseText: {
    color: YELLOW_COLOR,
    fontWeight: 'bold',
  },
  videoExampleContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  videoPreview: {
    borderRadius: 12,
    width: '90%',
    overflow: 'hidden',
  },
  keyPhraseImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  bottomText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  buttonSection: {
    marginBottom: 40,
    paddingHorizontal: 0
  },
});

export default KeyPhraseExplanationScreen; 