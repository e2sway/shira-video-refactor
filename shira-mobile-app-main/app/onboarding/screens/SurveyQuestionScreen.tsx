import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  ScrollView 
} from 'react-native';
import { colors } from '../styles';
import { useOnboarding, OnboardingState } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import SelectionButton from '../components/SelectionButton';
import { SurveyOption } from '../utils/surveyQuestions';

// Define constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const PURPLE_ACCENT = colors.primary;
const TRANSITION_DURATION = 300; // Animation duration for question transitions

export interface SurveyQuestionProps {
  questionKey: keyof OnboardingState['surveyAnswers'];
  title: string;
  options: SurveyOption[];
  currentStep: number; // 0-4 representing which question in the survey (0-indexed)
  totalSteps: number;  // 5 (total survey questions)
  questionNumber: number; // For navigation between questions (8-12)
}

const SurveyQuestionScreen: React.FC<SurveyQuestionProps> = ({
  questionKey,
  title,
  options,
  currentStep,
  totalSteps,
  questionNumber
}) => {
  const { goToNextStep, goToPreviousStep, setSurveyAnswer, state } = useOnboarding();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Set the initial selected option from state if available
  useEffect(() => {
    if (state.surveyAnswers[questionKey]) {
      setSelectedOption(state.surveyAnswers[questionKey]);
    }
  }, [state.surveyAnswers, questionKey]);

  // Calculate proper progress based on currentStep (0-4)
  const calculateProgress = () => {
    // currentStep is already 0-indexed (0-4), so we add 1 to show 1/5 through 5/5
    return (currentStep + 1) / totalSteps;
  };

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
      }),
      Animated.timing(progressAnim, {
        toValue: calculateProgress(),
        duration: 800,
        useNativeDriver: false,
      })
    ]).start();
  }, [currentStep, totalSteps]);

  // Handle option selection and auto-advance
  const handleOptionSelect = (optionId: string) => {
    // Don't process if already transitioning
    if (isTransitioning) return;
    
    setSelectedOption(optionId);
    setIsTransitioning(true);
    
    // Save the selection
    setSurveyAnswer(questionKey, optionId);
    
    // Fade out current question
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

  // Replace [Language] placeholders with the selected language
  const getFormattedTitle = () => {
    if (state.selectedLanguage && title.includes('[Language]')) {
      return title.replace(/\[Language\]/g, state.selectedLanguage);
    }
    return title;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBlock}>
        <OnboardingBackButton onPress={goToPreviousStep} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View 
          style={[
            styles.progressBarFill,
            { width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} 
        />
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
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{getFormattedTitle()}</Text>
        </View>

        <ScrollView 
          style={styles.optionsScrollView}
          contentContainerStyle={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {options.map((option) => (
            <SelectionButton
              key={option.id}
              title={option.title}
              onPress={() => handleOptionSelect(option.id)}
              selected={selectedOption === option.id}
              style={styles.optionButton}
            />
          ))}
        </ScrollView>
      </Animated.View>
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
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.progressBarBackground,
    borderRadius: 3,
    width: '100%',
    marginBottom: 30,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.progressBarFill,
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingBottom: 20,
  },
  optionButton: {
    marginBottom: 12,
    width: '100%',
  },
});

export default SurveyQuestionScreen; 