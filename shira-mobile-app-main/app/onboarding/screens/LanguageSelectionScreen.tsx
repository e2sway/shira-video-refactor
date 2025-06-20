import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
  Animated
} from 'react-native';
import { colors } from '../styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguageButton from '../components/LanguageButton';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';
import { useOnboarding } from '../hooks/useOnboardingState';

// Define the purple accent color
const PURPLE_ACCENT = '#5a51e1';

const LanguageSelectionScreen: React.FC = () => {
  const { goToNextStep, goToPreviousStep, setLanguage } = useOnboarding();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, []);

  const handleLanguageSelect = (language: string, isComingSoon: boolean = false) => {
    if (isComingSoon) {
      Alert.alert(
        "Coming Soon!",
        `${language} courses are coming soon! Stay tuned for updates.`,
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    setSelectedLanguage(prev => (prev === language ? null : language));
  };

  const handleContinue = async () => {
    if (!selectedLanguage) {
      Alert.alert('Please Select', 'Please select a language to continue.');
      return;
    }

    try {
      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem('targetLang', selectedLanguage);
      
      // Update context state
      setLanguage(selectedLanguage);
      
      // Navigate to next step
      goToNextStep();
    } catch (error) {
      console.error('AsyncStorage Error:', error);
      Alert.alert('Error', 'Failed to save language selection. Please try again.');
    }
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
          <Text style={styles.headerText}>Choose your language</Text>
          <Text style={styles.subHeaderText}>What language would you like to learn?</Text>
        </View>

        <View style={styles.languagesContainer}>
          <LanguageButton
            emoji="🇪🇸"
            language="Spanish"
            onPress={() => handleLanguageSelect('Spanish')}
            selected={selectedLanguage === 'Spanish'}
            style={styles.languageButton}
          />
          
          {/* Coming Soon Languages */}
          <LanguageButton
            emoji="🇫🇷"
            language="French"
            onPress={() => handleLanguageSelect('French', true)}
            selected={false}
            disabled={true}
            comingSoon={true}
            style={styles.languageButton}
          />
          
          <LanguageButton
            emoji="🇮🇹"
            language="Italian"
            onPress={() => handleLanguageSelect('Italian', true)}
            selected={false}
            disabled={true}
            comingSoon={true}
            style={styles.languageButton}
          />
          
          <LanguageButton
            emoji="🇰🇷"
            language="Korean"
            onPress={() => handleLanguageSelect('Korean', true)}
            selected={false}
            disabled={true}
            comingSoon={true}
            style={styles.languageButton}
          />
        </View>
      </Animated.View>

      <View style={styles.buttonSection}>
        <OnboardingNextButton 
          title="Continue" 
          onPress={handleContinue}
          disabled={!selectedLanguage}
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
  },
  headerContainer: {
    marginBottom: 40,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subHeaderText: {
    fontSize: 18,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 24,
  },
  languagesContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  languageButton: {
    marginBottom: 16,
    width: '100%',
  },
  buttonSection: {
    marginBottom: 40,
    paddingHorizontal: 0
  },
  continueButton: {
    width: '90%',
  },
});

export default LanguageSelectionScreen; 