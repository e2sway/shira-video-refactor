import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Define the insight interface
export interface Insight {
  title: string;
  description: string;
}

// Define the response from the edge function
export interface InsightsResponse {
  insights: Insight[];
}

// Survey data interface that matches what we send to the edge function
export interface SurveyData {
  language: string;
  mainGoal: string;
  biggestStruggle: string;
  currentLearningMethod: string;
  dailyLessonGoal: string;
  proficiencyLevel: string;
  culturalInterests: string;
}

// Initialize Supabase client
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'https://friwhmjhptjucqwdsqei.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaXdobWpocHRqdWNxd2RzcWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU1MzU2ODAsImV4cCI6MjAzMTExMTY4MH0.4SsK5Jh9ZtaR_p5-4KFFXZMEO9-YQpdPR59JBSuaUnA';

console.log('[DEBUG] Initializing Supabase client with URL:', supabaseUrl);
console.log('[DEBUG] Anon key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);

// Construct the full function URL for debugging
const functionUrl = `${supabaseUrl}/functions/v1/insights-service`;
console.log('[DEBUG] Expected function URL:', functionUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches personalized insights based on the user's survey responses
 * @param surveyData - The user's survey responses
 * @returns A promise that resolves to the insights response
 */
export async function fetchInsights(surveyData: SurveyData): Promise<InsightsResponse> {
  try {
    console.log('[DEBUG] fetchInsights called with data:', JSON.stringify(surveyData));
    console.log('[DEBUG] Supabase client initialized:', !!supabase);
    console.log('[DEBUG] Supabase functions available:', !!supabase.functions);
    
    // Check if any fields are missing or empty
    const missingFields = Object.entries(surveyData)
      .filter(([_, value]) => !value || value === '')
      .map(([key]) => key);
      
    if (missingFields.length > 0) {
      console.warn('[DEBUG] Missing or empty fields in surveyData:', missingFields);
    }
    
    console.log('[DEBUG] About to invoke insights-service function');
    
    // Call the Supabase Edge Function - try with and without hyphen to see which works
    try {
      console.log('[DEBUG] Trying function name with hyphen: insights-service');
      const { data, error } = await supabase.functions.invoke('insights-service', {
        body: surveyData,
      });
      
      console.log('[DEBUG] Function invoke completed with hyphenated name');
      
      if (error) {
        console.error('[DEBUG] Error calling insights-service function:', error);
        console.error('[DEBUG] Error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to get insights');
      }
      
      console.log('[DEBUG] Successfully received data from function:', data ? 'yes' : 'no');
      
      if (!data || !data.insights) {
        console.error('[DEBUG] Data missing expected structure:', JSON.stringify(data));
        throw new Error('Response missing insights data');
      }
      
      return data as InsightsResponse;
    } catch (firstAttemptError) {
      console.log('[DEBUG] First attempt failed, trying function name without hyphen');
      
      try {
        // Try with alternative name format
        const { data, error } = await supabase.functions.invoke('insights_service', {
          body: surveyData,
        });
        
        console.log('[DEBUG] Function invoke completed with underscore name');
        
        if (error) {
          console.error('[DEBUG] Error calling insights_service function:', error);
          console.error('[DEBUG] Error details:', JSON.stringify(error, null, 2));
          throw new Error(error.message || 'Failed to get insights');
        }
        
        console.log('[DEBUG] Successfully received data from function with underscore name:', data ? 'yes' : 'no');
        
        if (!data || !data.insights) {
          console.error('[DEBUG] Data missing expected structure from underscore function:', JSON.stringify(data));
          throw new Error('Response missing insights data');
        }
        
        return data as InsightsResponse;
      } catch (secondAttemptError) {
        console.error('[DEBUG] Both function name attempts failed');
        throw secondAttemptError;
      }
    }
  } catch (error: unknown) {
    console.error('[DEBUG] Error in fetchInsights:', error);
    console.error('[DEBUG] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    
    // Fallback insights if the function call fails
    return {
      insights: [
        {
          title: 'Personalized Learning',
          description: `Shira adapts to your ${surveyData.proficiencyLevel} level and helps with your specific struggle: ${surveyData.biggestStruggle}.`
        },
        {
          title: 'Interactive Practice',
          description: `Speak directly with Shira in guided conversations to improve your ${surveyData.language} speaking skills naturally.`
        },
        {
          title: 'Cultural Immersion',
          description: `Learn about ${surveyData.culturalInterests} through authentic short-form videos, enhancing your cultural understanding.`
        }
      ]
    };
  }
}

/**
 * Mock function for development purposes when Supabase isn't set up yet
 * @param surveyData - The user's survey responses
 * @returns A promise that resolves to mock insights
 */
export async function fetchMockInsights(surveyData: SurveyData): Promise<InsightsResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    insights: [
      {
        title: 'Personalized Learning Path',
        description: `Based on your goal to ${surveyData.mainGoal}, Shira will customize your ${surveyData.language} learning journey with relevant content.`
      },
      {
        title: 'Overcome Your Challenges',
        description: `Shira's interactive approach will help you tackle ${surveyData.biggestStruggle} through daily practice sessions.`
      },
      {
        title: 'Cultural Connection',
        description: `Explore ${surveyData.culturalInterests} in ${surveyData.language} through authentic videos and conversations with native speakers.`
      }
    ]
  };
} 