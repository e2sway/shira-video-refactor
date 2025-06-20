/**
 * Defines the data structure for survey questions
 */
export interface SurveyQuestion {
  title: string;
  subtitle: string;
  options: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

/**
 * Define the SurveyOption interface directly here to avoid circular imports
 */
export interface SurveyOption {
  id: string;
  title: string;
}

/**
 * Goal selection options (moved from survey to step 3)
 */
export const goalOptions = {
  title: "What's Driving You to Learn?",
  subtitle: "Why are you diving into language learning?",
  options: [
    { id: 'travel', title: 'Travel with Confidence', description: 'Speak with locals and navigate new places with ease.' },
    { id: 'career', title: 'Career Advancement', description: 'Open up new professional opportunities and connections.' },
    { id: 'study', title: 'Study Abroad', description: 'Prepare for academic experiences in another country.' },
    { id: 'friends', title: 'Make New Friends', description: 'Connect with people from different cultures and backgrounds.' },
    { id: 'personal', title: 'Personal Growth', description: 'Challenge yourself and expand your horizons.' },
  ]
};

/**
 * Question 1: Biggest struggle in language learning
 */
export const biggestStruggleQuestion = {
  key: 'biggestStruggle',
  title: "What's the toughest part of learning [Language] for you?",
  options: [
    { id: 'speaking', title: 'Struggling with spontaneous speaking.' },
    { id: 'vocabulary', title: 'Remembering new words and phrases.' },
    { id: 'cultural', title: 'Wrapping my head around cultural quirks.' },
    { id: 'grammar', title: 'Cracking tricky grammar rules.' },
    { id: 'anxiety', title: 'Feeling nervous when practicing.' },
  ] as SurveyOption[]
};

/**
 * Question 2: Current learning method
 */
export const learningMethodQuestion = {
  key: 'currentLearningMethod',
  title: "What's your go-to method for language learning?",
  options: [
    { id: 'apps', title: 'Mobile apps & quick videos.' },
    { id: 'classes', title: 'Traditional classes or one-on-one tutoring.' },
    { id: 'exchange', title: 'Language exchange with friends.' },
    { id: 'self', title: 'Self-study (books, podcasts, online stuff).' },
    { id: 'mixed', title: 'A mix of digital courses and interactive tools.' },
  ] as SurveyOption[]
};

/**
 * Question 3: Daily goal
 */
export const dailyGoalQuestion = {
  key: 'dailyLessonGoal',
  title: "Select a daily goal.",
  options: [
    { id: '3', title: '3 lessons' },
    { id: '5', title: '5 lessons' },
    { id: '10', title: '10 lessons' },
    { id: '15', title: '15 lessons' },
  ] as SurveyOption[]
};

/**
 * Question 4: Proficiency level
 */
export const proficiencyLevelQuestion = {
  key: 'proficiencyLevel',
  title: "How would you rate your current skills?",
  options: [
    { id: 'beginner', title: 'Beginner' },
    { id: 'basic', title: 'Basic' },
    { id: 'conversational', title: 'Conversational' },
    { id: 'advanced', title: 'Advanced' },
    { id: 'fluent', title: 'Fluent' },
  ] as SurveyOption[]
};

/**
 * Question 5: Cultural interests
 */
export const culturalInterestQuestion = {
  key: 'culturalInterests',
  title: "Which aspects of [Language] culture spark your interest?",
  options: [
    { id: 'slang', title: 'Local slang & everyday expressions.' },
    { id: 'etiquette', title: 'Social norms & etiquette.' },
    { id: 'history', title: 'Historical and cultural backstories.' },
    { id: 'pop', title: 'Modern slang and pop culture.' },
    { id: 'regional', title: 'Regional traditions and current trends.' },
  ] as SurveyOption[]
};

// Collect all survey questions for easy access
export const surveyQuestions = [
  biggestStruggleQuestion,
  learningMethodQuestion,
  dailyGoalQuestion,
  proficiencyLevelQuestion,
  culturalInterestQuestion
]; 