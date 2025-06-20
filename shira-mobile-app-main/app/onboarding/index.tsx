// app/onboarding/index.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOnboarding, OnboardingState } from './hooks/useOnboardingState';
import { useRouter } from 'expo-router';
import { colors } from './styles';

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen';
import GoalSelectionScreen from './screens/GoalSelectionScreen';
import KeyPhraseExplanationScreen from './screens/KeyPhraseExplanationScreen';
import ShiraIntroductionScreen from './screens/ShiraIntroductionScreen';
import SwipeGestureScreen from './screens/SwipeGestureScreen';
import SurveyIntroScreen from './screens/SurveyIntroScreen';
import SurveyQuestionScreen from './screens/SurveyQuestionScreen';
import SurveyInsightsScreen from './screens/SurveyInsightsScreen';
import AccountCreationScreen from './screens/AccountCreationScreen';
import PlaceholderScreen from './screens/placeholder';

// Import survey question data
import { 
  biggestStruggleQuestion,
  learningMethodQuestion,
  dailyGoalQuestion,
  proficiencyLevelQuestion,
  culturalInterestQuestion,
  surveyQuestions
} from './utils/surveyQuestions';

/**
 * Main onboarding screen that manages the flow between steps
 * using the onboarding context for state management.
 */
export default function OnboardingScreen() {
  const { state } = useOnboarding();
  const router = useRouter();

  // Render the appropriate step based on the current step in state
  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <WelcomeScreen />;
      case 2:
        return <LanguageSelectionScreen />;
      case 3:
        return <GoalSelectionScreen />;
      case 4:
        return <KeyPhraseExplanationScreen />;
      case 5:
        return <ShiraIntroductionScreen />;
      case 6:
        return <SwipeGestureScreen />;
      case 7:
        return <SurveyIntroScreen />;
      case 8:
        return <SurveyQuestionScreen 
          questionKey="biggestStruggle"
          title={biggestStruggleQuestion.title}
          options={biggestStruggleQuestion.options}
          currentStep={0}
          totalSteps={5}
          questionNumber={8}
        />;
      case 9:
        return <SurveyQuestionScreen 
          questionKey="currentLearningMethod"
          title={learningMethodQuestion.title}
          options={learningMethodQuestion.options}
          currentStep={1}
          totalSteps={5}
          questionNumber={9}
        />;
      case 10:
        return <SurveyQuestionScreen 
          questionKey="dailyLessonGoal"
          title={dailyGoalQuestion.title}
          options={dailyGoalQuestion.options}
          currentStep={2}
          totalSteps={5}
          questionNumber={10}
        />;
      case 11:
        return <SurveyQuestionScreen 
          questionKey="proficiencyLevel"
          title={proficiencyLevelQuestion.title}
          options={proficiencyLevelQuestion.options}
          currentStep={3}
          totalSteps={5}
          questionNumber={11}
        />;
      case 12:
        return <SurveyQuestionScreen 
          questionKey="culturalInterests"
          title={culturalInterestQuestion.title}
          options={culturalInterestQuestion.options}
          currentStep={4}
          totalSteps={5}
          questionNumber={12}
        />;
      case 13:
        return <SurveyInsightsScreen />;
      case 14:
        return <AccountCreationScreen />;
      default:
        return <PlaceholderScreen 
          stepName="Unknown Step"
          stepNumber={state.step}
        />;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
