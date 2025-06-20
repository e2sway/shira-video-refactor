/**
 * This is a placeholder file to ensure the screens directory exists.
 * Individual screen components will be added in separate files.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';
import ProgressBar from '../components/ProgressBar';

interface PlaceholderScreenProps {
  stepName: string;
  stepNumber: number;
  surveyProgress?: {
    currentStep: number;
    totalSteps: number;
  } | null;
}

export default function PlaceholderScreen({ 
  stepName, 
  stepNumber,
  surveyProgress 
}: PlaceholderScreenProps) {
  const { goToNextStep, goToPreviousStep } = useOnboarding();
  
  return (
    <View style={styles.container}>
      {stepNumber > 1 && (
        <OnboardingBackButton 
          onPress={goToPreviousStep} 
          style={styles.backButton} 
        />
      )}
      
      {/* Display progress bar for survey questions */}
      {surveyProgress && (
        <View style={styles.progressContainer}>
          <ProgressBar 
            currentStep={surveyProgress.currentStep} 
            totalSteps={surveyProgress.totalSteps} 
          />
          <Text style={styles.progressText}>
            Question {surveyProgress.currentStep} of {surveyProgress.totalSteps}
          </Text>
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <Text style={styles.stepIndicator}>Step {stepNumber}</Text>
        <Text style={styles.title}>{stepName}</Text>
        <Text style={styles.description}>
          This screen is under development. It will be implemented soon.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <OnboardingNextButton 
          title="Continue" 
          onPress={goToNextStep} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 50,
    marginBottom: 20,
  },
  progressText: {
    color: colors.subText,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    color: colors.primary,
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: colors.subText,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
}); 