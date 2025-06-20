import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../styles';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';
import OnboardingConversationView from '../components/OnboardingConversationView';

// Define constants
const PURPLE_ACCENT = colors.primary;
// Add the storage key constant to match the one in OnboardingConversationView
const CONVERSATION_DISABLED_KEY = '@shira_conversationDisabled';

const ShiraIntroductionScreen: React.FC = () => {
  const { goToNextStep, goToPreviousStep } = useOnboarding();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Add state to force re-render of conversation component
  const [conversationComponentKey, setConversationComponentKey] = useState(0);
  
  // Sample conversation data to pass to the OnboardingConversationView
  const conversationData = {
    responsePrompt: "Hola, ¿cómo estás hoy?",
    responsePromptTranslation: "Hello, how are you today?",
    speakingPhrase: "Yo odio el calor",
    speakingPhraseTranslation: "I hate the heat"
  };
  
  // Update reset function to re-render the conversation component
  const resetConversationState = async () => {
    try {
      await AsyncStorage.removeItem(CONVERSATION_DISABLED_KEY);
      console.log('Conversation disabled state reset');
      
      // Trigger haptic feedback for confirmation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Increment the key to force a re-render of the conversation component
      setConversationComponentKey(prevKey => prevKey + 1);
      
      // Show confirmation to user
      Alert.alert(
        'Reset Complete',
        'Conversation state has been reset.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error resetting conversation state:', error);
      
      // Show error to user
      Alert.alert(
        'Reset Failed',
        'Failed to reset conversation state. Please try again.',
        [{ text: 'OK' }]
      );
      
      // Trigger haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  // Run entry animations on mount
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

  // Handle completion of the conversation component
  const handleConversationComplete = () => {
    // Navigate to the next step when the user has reached interaction limits
    goToNextStep();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBlock}>
        <OnboardingBackButton onPress={goToPreviousStep} />
        
        {/* Add reset button for testing */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetConversationState}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-circle" size={32} color="rgba(255, 255, 255, 0.5)" />
        </TouchableOpacity>
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
          <Text style={styles.headerText}>Say Hi to Shira, Your Personal Language Coach</Text>
        </View>

        <Text style={styles.explanationText}>
          Start with the key phrase and Shira will guide you through an endless lifelike conversation.
        </Text>

        {/* Render OnboardingConversationView and pass onContinue callback */}
        <View style={styles.conversationComponentContainer}>
          <OnboardingConversationView 
            key={conversationComponentKey}
            conversationalData={conversationData} 
            onContinue={handleConversationComplete}
          />
        </View>
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
    flexDirection: 'row', // Make it a row to position the reset button
    justifyContent: 'space-between', // Space items apart
    alignItems: 'center', // Align items vertically
  },
  resetButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 100, 100, 0.2)', // Subtle background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    display: 'none', // Hide the button
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  conversationComponentContainer: {
    width: '100%',
    height: 300,
    marginBottom: 30,
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonSection: {
    marginBottom: 40,
    paddingHorizontal: 0
  },
  continueButton: {
    width: '90%',
  },
});

export default ShiraIntroductionScreen; 