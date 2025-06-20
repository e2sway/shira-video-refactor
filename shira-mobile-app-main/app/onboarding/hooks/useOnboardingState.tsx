import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';

// Define the onboarding state interface
export interface OnboardingState {
  step: number;
  selectedLanguage: string;
  mainGoal: string;
  surveyAnswers: {
    biggestStruggle: string;
    currentLearningMethod: string;
    dailyLessonGoal: string;
    proficiencyLevel: string;
    culturalInterests: string;
  };
  geminiInsights: string | null;
}

// Define action types
type ActionType = 
  | { type: 'GO_TO_NEXT_STEP' }
  | { type: 'GO_TO_PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_MAIN_GOAL'; payload: string }
  | { type: 'SET_SURVEY_ANSWER'; payload: { question: keyof OnboardingState['surveyAnswers']; answer: string } }
  | { type: 'SET_GEMINI_INSIGHTS'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: OnboardingState = {
  step: 1,
  selectedLanguage: '',
  mainGoal: '',
  surveyAnswers: {
    biggestStruggle: '',
    currentLearningMethod: '',
    dailyLessonGoal: '',
    proficiencyLevel: '',
    culturalInterests: '',
  },
  geminiInsights: null,
};

// Create the reducer function
function onboardingReducer(state: OnboardingState, action: ActionType): OnboardingState {
  switch (action.type) {
    case 'GO_TO_NEXT_STEP':
      return {
        ...state,
        step: state.step + 1,
      };
    case 'GO_TO_PREVIOUS_STEP':
      return {
        ...state,
        step: Math.max(1, state.step - 1),
      };
    case 'GO_TO_STEP':
      return {
        ...state,
        step: action.payload,
      };
    case 'SET_LANGUAGE':
      return {
        ...state,
        selectedLanguage: action.payload,
      };
    case 'SET_MAIN_GOAL':
      return {
        ...state,
        mainGoal: action.payload,
      };
    case 'SET_SURVEY_ANSWER':
      return {
        ...state,
        surveyAnswers: {
          ...state.surveyAnswers,
          [action.payload.question]: action.payload.answer,
        },
      };
    case 'SET_GEMINI_INSIGHTS':
      return {
        ...state,
        geminiInsights: action.payload,
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Create context type
interface OnboardingContextType {
  state: OnboardingState;
  dispatch: Dispatch<ActionType>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  setLanguage: (language: string) => void;
  setMainGoal: (goal: string) => void;
  setSurveyAnswer: (question: keyof OnboardingState['surveyAnswers'], answer: string) => void;
  setGeminiInsights: (insights: string) => void;
  resetState: () => void;
}

// Create the context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Create provider props interface
interface OnboardingProviderProps {
  children: ReactNode;
}

// Create the provider component
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  // Action creators
  const goToNextStep = () => dispatch({ type: 'GO_TO_NEXT_STEP' });
  const goToPreviousStep = () => dispatch({ type: 'GO_TO_PREVIOUS_STEP' });
  const goToStep = (step: number) => dispatch({ type: 'GO_TO_STEP', payload: step });
  const setLanguage = (language: string) => dispatch({ type: 'SET_LANGUAGE', payload: language });
  const setMainGoal = (goal: string) => dispatch({ type: 'SET_MAIN_GOAL', payload: goal });
  const setSurveyAnswer = (question: keyof OnboardingState['surveyAnswers'], answer: string) => 
    dispatch({ type: 'SET_SURVEY_ANSWER', payload: { question, answer } });
  const setGeminiInsights = (insights: string) => 
    dispatch({ type: 'SET_GEMINI_INSIGHTS', payload: insights });
  const resetState = () => dispatch({ type: 'RESET_STATE' });

  const value = {
    state,
    dispatch,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    setLanguage,
    setMainGoal,
    setSurveyAnswer,
    setGeminiInsights,
    resetState,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook for using the context
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}; 