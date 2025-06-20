import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  ScrollView,
  Image,
  Easing
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';

// Define constants
const PURPLE_ACCENT = colors.primary;
const PINK_ACCENT = '#ff66c4';
const MIN_LOADING_TIME = 5000; // Minimum time to show loading state (5 seconds)
const DARK_GREY = '#262626'; // Slightly lighter than #181818 for contrast
const DOT_ANIMATION_SPEED = 250; // Faster dots animation (ms)
const PHRASE_CHANGE_INTERVAL = 1250; // Time between phrases (ms)
const HOP_DURATION = 500; // Duration of a single hop (ms)
const HOP_HEIGHT = 20; // Height of each hop in pixels
const HOP_DISTANCE = 30; // Horizontal distance to hop (pixels)

// Loading phrases to cycle through
const LOADING_PHRASES = [
  "personalizing",
  "thinking sheep",
  "you're interesting",
  "here we go"
];

// Define insight type
interface InsightItem {
  icon: string;
  title: string;
  description: string;
  category: string;
}

const SurveyInsightsScreen: React.FC = () => {
  const { goToNextStep, goToPreviousStep, state, setGeminiInsights } = useOnboarding();
  const [loading, setLoading] = useState<boolean>(true);
  const [showResults, setShowResults] = useState<boolean>(false); // State for controlling screen state
  const [dots, setDots] = useState<string>('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [personalizedInsights, setPersonalizedInsights] = useState<InsightItem[]>([]);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hopCount, setHopCount] = useState<number>(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const sheepHopY = useRef(new Animated.Value(0)).current;
  const sheepHopX = useRef(new Animated.Value(0)).current;
  
  // Track the current X position with a ref to avoid resetting
  const currentXPosition = useRef(0);
  
  // Set up a listener to track the current value of sheepHopX
  useEffect(() => {
    const id = sheepHopX.addListener(state => {
      currentXPosition.current = state.value;
    });
    
    return () => {
      sheepHopX.removeListener(id);
    };
  }, [sheepHopX]);
  
  // Generate insights only once on component mount
  useEffect(() => {
    const insights = generateInsights();
    setPersonalizedInsights(insights);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Animate dots for loading text with faster animation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev === '') return '.';
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '';
        });
      }, DOT_ANIMATION_SPEED);
      
      return () => clearInterval(interval);
    }
  }, [loading]);
  
  // Cycle through phrases
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
      }, PHRASE_CHANGE_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [loading]);
  
  // Run animations on mount
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
  }, []);
  
  // Animate sheep hopping
  useEffect(() => {
    if (!loading) return;
    
    // Define a single hop animation
    const hop = () => {
      // Reset position before starting a new hop
      sheepHopY.setValue(0);
      
      // Animate the hop (up and down)
      Animated.sequence([
        // Hop up
        Animated.timing(sheepHopY, {
          toValue: -HOP_HEIGHT, // Move up (negative is up in React Native)
          duration: HOP_DURATION / 2,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Hop down
        Animated.timing(sheepHopY, {
          toValue: 0, // Return to original position
          duration: HOP_DURATION / 2,
          easing: Easing.bounce,
          useNativeDriver: true,
        })
      ]).start(() => {
        // After each hop, flip the sheep
        setIsFlipped(prevFlipped => !prevFlipped);
        
        // DO NOT reset X position - this lets the sheep flip in place
        
        // Increment hop count for tracking
        setHopCount(prevCount => prevCount + 1);
      });
      
      // REVERSED: Move horizontally depending on current direction
      // When NOT flipped, sheep should move LEFT
      // When flipped, sheep should move RIGHT
      const direction = isFlipped ? 1 : -1;
      
      // Get current position and add to it instead of resetting
      // This makes the sheep continue from its current position
      const nextXValue = currentXPosition.current + (direction * HOP_DISTANCE);
      
      Animated.timing(sheepHopX, {
        toValue: nextXValue,
        duration: HOP_DURATION,
        useNativeDriver: true,
      }).start();
    };
    
    // Start hopping
    const timer = setTimeout(hop, 300);
    
    return () => clearTimeout(timer);
  }, [loading, isFlipped, hopCount]);
  
  // Generate personalized insights based on user's answers
  const generateInsights = (): InsightItem[] => {
    const { selectedLanguage, mainGoal, surveyAnswers } = state;
    
    console.log("Generating insights based on survey answers:", surveyAnswers);
    
    // Container for all insights
    const allInsights: InsightItem[] = [];
    
    // 1. STRUGGLE insight - always include one
    let struggleInsight: InsightItem | null = null;
    
    if (surveyAnswers.biggestStruggle === "speaking") {
      struggleInsight = {
        icon: "comment",
        title: "Speaking Practice",
        description: `We'll boost your confidence in ${selectedLanguage} conversations with tailored speaking exercises you'll love.`,
        category: "struggle"
      };
    } else if (surveyAnswers.biggestStruggle === "vocabulary") {
      struggleInsight = {
        icon: "book",
        title: "Vocabulary Builder",
        description: `Your ${selectedLanguage} vocabulary will grow rapidly with personalized word lists matched to your interests.`,
        category: "struggle"
      };
    } else if (surveyAnswers.biggestStruggle === "grammar") {
      struggleInsight = {
        icon: "pencil-alt",
        title: "Grammar Simplified",
        description: `No more complex grammar rules—we'll make ${selectedLanguage} patterns intuitive and easy to remember.`,
        category: "struggle"
      };
    } else if (surveyAnswers.biggestStruggle === "listening") {
      struggleInsight = {
        icon: "headphones",
        title: "Listening Skills",
        description: `You'll understand native ${selectedLanguage} speakers better through our adaptive listening exercises.`,
        category: "struggle"
      };
    }
    
    // Default fallback if no struggle is selected
    if (!struggleInsight) {
      struggleInsight = {
        icon: "brain",
        title: "Learning Path",
        description: `We've designed a unique approach to help you master ${selectedLanguage} based on your learning style.`,
        category: "struggle"
      };
    }
    
    allInsights.push(struggleInsight);
    
    // 2. LEARNING METHOD insight - always include one
    let methodInsight: InsightItem | null = null;
    
    if (surveyAnswers.currentLearningMethod === "app") {
      methodInsight = {
        icon: "mobile-alt",
        title: "App Enhancement",
        description: `Shira works alongside your favorite language apps to reinforce what you're already learning.`,
        category: "method"
      };
    } else if (surveyAnswers.currentLearningMethod === "class") {
      methodInsight = {
        icon: "chalkboard-teacher",
        title: "Class Booster",
        description: `Your classroom learning will stick better with our daily practice sessions between classes.`,
        category: "method"
      };
    } else if (surveyAnswers.currentLearningMethod === "tutor") {
      methodInsight = {
        icon: "user-graduate",
        title: "Tutor Companion",
        description: `Make the most of your tutoring by practicing exactly what you need between sessions.`,
        category: "method"
      };
    } else if (surveyAnswers.currentLearningMethod === "self") {
      methodInsight = {
        icon: "book-reader",
        title: "Study Structure",
        description: `We'll add structure to your self-study with organized learning paths you can follow.`,
        category: "method"
      };
    }
    
    // Default fallback if no method is selected
    if (!methodInsight) {
      methodInsight = {
        icon: "graduation-cap",
        title: "Flexible Approach",
        description: `Our guidance adapts perfectly to your unique learning style and preferences.`,
        category: "method"
      };
    }
    
    allInsights.push(methodInsight);
    
    // 3. DAILY GOAL insight - always include one
    let goalInsight: InsightItem | null = null;
    
    if (surveyAnswers.dailyLessonGoal === "5min") {
      goalInsight = {
        icon: "clock",
        title: "Quick Sessions",
        description: `Just 5 minutes daily fits your busy schedule while still making real progress in ${selectedLanguage}.`,
        category: "goal"
      };
    } else if (surveyAnswers.dailyLessonGoal === "15min") {
      goalInsight = {
        icon: "hourglass-half",
        title: "Balanced Learning",
        description: `Your 15-minute daily sessions strike the perfect balance between depth and convenience.`,
        category: "goal"
      };
    } else if (surveyAnswers.dailyLessonGoal === "30min") {
      goalInsight = {
        icon: "calendar-check",
        title: "Deep Practice",
        description: `Your commitment to 30-minute sessions will accelerate your ${selectedLanguage} fluency rapidly.`,
        category: "goal"
      };
    }
    
    // Default fallback if no goal is selected
    if (!goalInsight) {
      goalInsight = {
        icon: "tasks",
        title: "Adaptive Time",
        description: `Our flexible sessions adapt to your schedule, whether you have 5 minutes or 30.`,
        category: "goal"
      };
    }
    
    allInsights.push(goalInsight);
    
    // 4. PROFICIENCY LEVEL insight - always include one
    let levelInsight: InsightItem | null = null;
    
    if (surveyAnswers.proficiencyLevel === "beginner") {
      levelInsight = {
        icon: "seedling",
        title: "Beginner Focus",
        description: `As a beginner, you'll build a solid ${selectedLanguage} foundation step by step without feeling overwhelmed.`,
        category: "level"
      };
    } else if (surveyAnswers.proficiencyLevel === "intermediate") {
      levelInsight = {
        icon: "tree",
        title: "Skill Building",
        description: `At your intermediate level, we'll push your ${selectedLanguage} skills with the right level of challenge.`,
        category: "level"
      };
    } else if (surveyAnswers.proficiencyLevel === "advanced") {
      levelInsight = {
        icon: "star",
        title: "Advanced Mastery",
        description: `Your advanced skills will reach native-like fluency with nuanced ${selectedLanguage} expressions and cultural context.`,
        category: "level"
      };
    }
    
    // Default fallback if no level is selected
    if (!levelInsight) {
      levelInsight = {
        icon: "chart-line",
        title: "Perfect Match",
        description: `All content is precisely matched to your current ${selectedLanguage} abilities for optimal learning.`,
        category: "level"
      };
    }
    
    allInsights.push(levelInsight);
    
    // 5. CULTURAL INTEREST insight - always include one
    let interestInsight: InsightItem | null = null;
    
    if (surveyAnswers.culturalInterests === "food") {
      interestInsight = {
        icon: "utensils",
        title: "Culinary Language",
        description: `Your interest in food makes learning ${selectedLanguage} delicious with cooking terms and food culture.`,
        category: "interest"
      };
    } else if (surveyAnswers.culturalInterests === "music") {
      interestInsight = {
        icon: "music",
        title: "Musical Learning",
        description: `Your love of music will help you discover ${selectedLanguage} through authentic songs and lyrics.`,
        category: "interest"
      };
    } else if (surveyAnswers.culturalInterests === "history") {
      interestInsight = {
        icon: "landmark",
        title: "Cultural Context",
        description: `Your fascination with history brings ${selectedLanguage} to life through captivating historical contexts.`,
        category: "interest"
      };
    } else if (surveyAnswers.culturalInterests === "travel") {
      interestInsight = {
        icon: "plane",
        title: "Travel Ready",
        description: `We'll prepare you for your travels with practical ${selectedLanguage} phrases locals actually use.`,
        category: "interest"
      };
    } else if (surveyAnswers.culturalInterests === "literature") {
      interestInsight = {
        icon: "book-open",
        title: "Literary Exploration",
        description: `Your appreciation for literature will grow as you explore ${selectedLanguage} books at your level.`,
        category: "interest"
      };
    }
    
    // Default fallback if no interest is selected
    if (!interestInsight) {
      interestInsight = {
        icon: "globe-americas",
        title: "Cultural Connect",
        description: `Discover ${selectedLanguage} culture through topics tailored to what interests you most.`,
        category: "interest"
      };
    }
    
    allInsights.push(interestInsight);
    
    // Debug - count insights by category once, not on every render
    console.log("Insights by category:", allInsights.map(insight => insight.category));
    console.log("Total insights:", allInsights.length);
    
    return allInsights;
  };

  // Simulated API call with loading state
  useEffect(() => {
    const simulateInsightsGeneration = async () => {
      try {
        const startTime = Date.now();
        
        // Wait for MIN_LOADING_TIME
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME));
        
        // Mark loading as complete and show results
        setLoading(false);
        
        // Add a small delay before showing results for smoother transition
        setTimeout(() => {
          setShowResults(true);
        }, 300);
      } catch (err) {
        console.error('Failed to generate insights:', err);
        setLoading(false);
      }
    };
    
    simulateInsightsGeneration();
  }, []);

  return (
    <View style={styles.container}>
      {/* Only show back button when results are displayed */}
      {showResults && (
        <View style={styles.topBlock}>
          <OnboardingBackButton onPress={goToPreviousStep} />
        </View>
      )}
      
      <Animated.View 
        style={[
          styles.mainContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {!showResults ? (
          /* Initial Loading State with Sheep */
          <View style={styles.loadingStateContainer}>
            <Animated.View
              style={{
                transform: [
                  { translateY: sheepHopY },
                  { translateX: sheepHopX },
                  { scaleX: isFlipped ? -1 : 1 } // Flip horizontally
                ]
              }}
            >
              <Image 
                source={require('../../../assets/images/shira_thinking_1.png')} 
                style={styles.sheepImage}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={styles.loadingStateText}>
              {LOADING_PHRASES[currentPhraseIndex]}{dots}
            </Text>
          </View>
        ) : (
          /* Results State */
          <>
            <View style={styles.headerContainer}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerText}>Your </Text>
                <Text style={styles.pinkShiraText}>Shira</Text>
                <Text style={styles.headerText}> Insights</Text>
              </View>
              <Text style={styles.subHeaderText}>
                Based on your answers, we've created personalized insights to help you understand how Shira can benefit you.
              </Text>
            </View>

            <View style={styles.scrollViewContainer}>
              <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.insightsContainer}>
                  {personalizedInsights.map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <View style={styles.insightIconContainer}>
                        <FontAwesome5 name={insight.icon} size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightItemTitle}>{insight.title}</Text>
                        <Text style={styles.insightItemText}>{insight.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
              
              {/* Fade-out gradient at the bottom of the scroll view */}
              <LinearGradient
                colors={['rgba(24, 24, 24, 0)', colors.background]}
                style={styles.scrollFadeGradient}
                pointerEvents="none"
              />
            </View>
          </>
        )}
      </Animated.View>

      {/* Only show the buttons when results are displayed */}
      {showResults && (
        <View style={styles.buttonSection}>
          {/* New purple-pink gradient button */}
          <OnboardingNextButton 
            title="These insights + Shira will take you closer to your goal" 
            onPress={goToNextStep}
            gradientColors={[PURPLE_ACCENT, PINK_ACCENT]}
            style={styles.gradientButton}
            textStyle={styles.gradientButtonText}
          />
          
          {/* Original continue button */}
          <OnboardingNextButton 
            title="Continue" 
            onPress={goToNextStep}
            gradientColors={[PURPLE_ACCENT, `${PURPLE_ACCENT}dd`]}
            style={styles.continueButton}
          />
        </View>
      )}
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
  // Loading state styles
  loadingStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheepImage: {
    width: 350,
    height: 350,
    marginBottom: 30,
  },
  loadingStateText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  // Results state styles
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  pinkShiraText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subHeaderText: {
    fontSize: 16,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  insightsContainer: {
    width: '100%',
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
    backgroundColor: DARK_GREY,
    borderRadius: 12,
  },
  insightIconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5a51e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  insightItemText: {
    fontSize: 15,
    color: colors.subText,
    lineHeight: 22,
  },
  buttonSection: {
    marginVertical: 30,
    paddingHorizontal: 0
  },
  gradientButton: {
    marginBottom: 16, // Add margin between buttons
  },
  gradientButtonText: {
    fontSize: 16, // Adjust font size for the longer text
  },
  continueButton: {
    // Styles for continue button
  },
  scrollViewContainer: {
    flex: 1,
    position: 'relative', // For absolute positioning of the gradient
  },
  scrollFadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80, // Height of the fade gradient
    zIndex: 1, // Above scroll content
    pointerEvents: 'none', // Don't block touches to the scrollView
  },
});

export default SurveyInsightsScreen; 