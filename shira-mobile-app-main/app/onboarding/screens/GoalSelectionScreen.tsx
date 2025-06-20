import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  ScrollView
} from 'react-native';
import { colors } from '../styles';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import SelectionButton from '../components/SelectionButton';
import { goalOptions } from '../utils/surveyQuestions';

// Define constants
const PURPLE_ACCENT = '#5a51e1';
const TRANSITION_DURATION = 300; // Animation duration for transitions

const GoalSelectionScreen: React.FC = () => {
  const { goToNextStep, goToPreviousStep, setMainGoal, state } = useOnboarding();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Initialize selectedGoal from state if available
  useEffect(() => {
    if (state.mainGoal) {
      setSelectedGoal(state.mainGoal);
    }
  }, [state.mainGoal]);

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
  }, []);

  const handleGoalSelect = (goalId: string) => {
    // Don't process if already transitioning
    if (isTransitioning) return;
    
    setSelectedGoal(goalId);
    setIsTransitioning(true);
    
    // Update context state
    setMainGoal(goalId);
    
    // Fade out current screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: TRANSITION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      // After fade out, proceed to next step
      goToNextStep();
      
      // Reset transition status (will be unmounted, but good practice)
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    });
  };

  // Get header text with selected language if available
  const getHeaderText = () => {
    if (state.selectedLanguage) {
      return `Why are you diving into ${state.selectedLanguage}?`;
    }
    return 'Why are you diving into language learning?';
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
          <Text style={styles.headerText}>{getHeaderText()}</Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.goalsContainer}>
            {goalOptions.options.map((option) => (
              <SelectionButton
                key={option.id}
                title={option.title}
                onPress={() => handleGoalSelect(option.id)}
                selected={selectedGoal === option.id}
                style={styles.goalButton}
              />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
      
      {/* Continue button removed as auto-advancement is implemented */}
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
    marginBottom: 30,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 80, // Increased bottom padding since button is removed
  },
  goalsContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  goalButton: {
    marginBottom: 12,
    width: '100%',
  },
  // buttonSection removed as continue button is no longer needed
});

export default GoalSelectionScreen; 