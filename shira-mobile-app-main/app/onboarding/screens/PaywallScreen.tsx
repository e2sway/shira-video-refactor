import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../hooks/useOnboardingState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Superwall from '@superwall/react-native-superwall';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../../supabase/supabaseClient';
import { checkSubscriptionStatus } from '../../../supabase/revenueCatClient';
import { initializeSuperwall } from '../../../superwall/superwallClient';

// Constants
const DARK_BACKGROUND = '#181818';
const PURPLE_PRIMARY = '#8E6CEF';
const PINK_ACCENT = '#ff66c4';

/**
 * PaywallScreen displays the Superwall paywall as part of the onboarding flow
 * after account creation. It automatically presents the paywall when mounted
 * and handles navigation based on user actions (subscribe or skip).
 */
export default function PaywallScreen() {
  const router = useRouter();
  const { goToNextStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebugOptions, setShowDebugOptions] = useState(false);
  
  useEffect(() => {
    const setupAndShowPaywall = async () => {
      try {
        console.log('[PaywallScreen] Setting up and showing paywall with Purchase Controller');
        
        // Initialize Superwall - this handles configuration and purchase controller setup
        try {
          const success = await initializeSuperwall();
          if (!success) {
            console.error('[PaywallScreen] Failed to initialize Superwall');
            setError('Failed to configure subscription options. Please try again later.');
            setIsLoading(false);
            return;
          }
          console.log('[PaywallScreen] Superwall initialized successfully');
        } catch (configError) {
          console.error('[PaywallScreen] Error initializing Superwall:', configError);
          setError('Failed to configure subscription options. Please try again later.');
          setIsLoading(false);
          return;
        }
        
        // Fetch user information to pass to the paywall
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
          console.error('[PaywallScreen] No user ID found in session');
          setError('User session not found. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        // Get user's profile information to pass to the paywall for targeting
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        setIsLoading(false);
        
        // Add a delay to allow Superwall to initialize fully
        setTimeout(async () => {
          try {
            // Set user attributes in Superwall (recommended practice)
            await Superwall.shared.setUserAttributes({
              userId,
              email: session.user.email || '',
              name: profile?.display_name || session.user.email?.split('@')[0] || '',
              targetLanguage: profile?.target_lang || 'Spanish',
            });
            console.log('[PaywallScreen] User attributes set in Superwall');
          } catch (attributesError) {
            console.error('[PaywallScreen] Error setting user attributes:', attributesError);
            // Continue anyway as this isn't critical
          }

          // Register the placement - simplified since Purchase Controller handles the purchase flow
          console.log('[PaywallScreen] Registering paywall placement');
          
          // Register with the simplified pattern for using with Purchase Controller
          Superwall.shared.register({
            placement: 'onboarding_complete',
            feature: async () => {
              // This is called when the user has completed a purchase or is already subscribed
              console.log('[PaywallScreen] Entering feature callback - purchase/subscription confirmed');
              
              // Add a small delay to allow systems to sync
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Navigate to the learn screen
              navigateToLearn();
            },
            handler: {
              onPresent: () => {
                // Paywall was presented to the user
                console.log('[PaywallScreen] Paywall presented to user');
              },
              onDismiss: () => {
                // Paywall was dismissed without purchase
                console.log('[PaywallScreen] Paywall dismissed without purchase');
                navigateToLearn(); 
              },
              onError: (error: unknown) => {
                // An error occurred while presenting the paywall
                console.error('[PaywallScreen] Error presenting paywall:', error);
                setError('There was a problem showing the subscription options.');
                navigateToLearn();
              },
              onSkip: (reason: unknown) => {
                // Paywall was skipped
                console.log(`[PaywallScreen] Paywall skipped, reason: ${String(reason)}`);
                navigateToLearn();
              }
            }
          });
          
          console.log('[PaywallScreen] Paywall registration completed');
        }, 500); // 500ms delay
        
      } catch (error) {
        console.error('[PaywallScreen] Unexpected error:', error);
        setError('Something went wrong. Please try again later.');
        setIsLoading(false);
        
        // Wait a moment then navigate to Learn on error
        setTimeout(() => {
          navigateToLearn();
        }, 2000);
      }
    };
    
    setupAndShowPaywall();
    
    // Handle any necessary cleanup
    return () => {
      // Any cleanup needed when component unmounts
    };
  }, []);
  
  // Function to navigate to the Learn screen
  const navigateToLearn = () => {
    console.log('[PaywallScreen] Navigating to learn screen');
    // Navigate to the main app learn screen
    try {
      router.replace('/learn');
    } catch (navError) {
      console.error('[PaywallScreen] Error navigating:', navError);
    }
  };
  
  // Function to skip paywall and continue to app without pro status
  const handleSkip = () => {
    console.log('[PaywallScreen] User skipped paywall');
    navigateToLearn();
  };
  
  // Loading screen while setting up the paywall
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE_PRIMARY} />
          <Text style={styles.loadingText}>
            Setting up your personalized experience...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Error screen if paywall fails to load
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={50} color={PINK_ACCENT} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={navigateToLearn}
          >
            <Text style={styles.continueButtonText}>Continue to App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Empty view as the paywall is shown by Superwall
  // The Superwall.shared.register handles showing the UI
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 20,
    marginBottom: 30,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: PURPLE_PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    width: '80%',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 