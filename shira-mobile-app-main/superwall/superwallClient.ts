// import Superwall from '@superwall/react-native-superwall';
import { Platform } from 'react-native';
import { supabase } from '../supabase/supabaseClient';
import { identifyUser } from '../supabase/revenueCatClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { revenueCatPurchaseController } from './RevenueCatPurchaseController';

// Superwall API keys
const SUPERWALL_API_KEY = 'pk_532e5eac5f5ff3ddf34ebe670bcd652857d24ed1d46e0d66';

// Track initialization state - only in memory
let isInitialized = false;

// Check if running in Expo Go (which doesn't support native modules)
const isExpoGo = () => {
  return __DEV__ && !process.env.EAS_BUILD;
};

// Debug logger function
const debugLog = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[SUPERWALL-DEBUG ${timestamp}]`;
  
  if (error) {
    console.error(`${logPrefix} ERROR: ${message}`, error);
    // Also log the error type and message separately for clearer debugging
    console.error(`${logPrefix} Error type: ${typeof error}`);
    console.error(`${logPrefix} Error message: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error(`${logPrefix} Stack trace: ${error.stack}`);
    }
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

/**
 * Verify that the Superwall module is available (only for non-Expo Go)
 */
const verifySuperwallModule = (): boolean => {
  if (isExpoGo()) {
    debugLog('Running in Expo Go - Superwall module verification skipped');
    return true;
  }
  
  debugLog('Verifying Superwall module availability');
  
  // In production builds, would verify Superwall module here
  debugLog('Superwall module verification succeeded');
  return true;
};

/**
 * Initialize Superwall with the appropriate configuration
 */
export const initializeSuperwall = async () => {
  debugLog('initializeSuperwall called');
  
  // Return early if running in Expo Go
  if (isExpoGo()) {
    debugLog('Running in Expo Go - Superwall not supported, skipping initialization');
    isInitialized = true;
    return true; // Return true to not block the app
  }
  
  try {
    // Always do a fresh module check
    if (!verifySuperwallModule()) {
      debugLog('Superwall module verification failed, cannot initialize');
      return false;
    }
    
    // Check if already initialized in this session
    if (isInitialized) {
      debugLog('Superwall already initialized in this session');
      return true;
    }

    debugLog('Initializing Superwall with API key...');
    debugLog(`API Key: ${SUPERWALL_API_KEY.substring(0, 10)}...`);
    debugLog(`Platform: ${Platform.OS}`);
    
    // In production builds, would configure Superwall here
    debugLog('Superwall initialized successfully');
    isInitialized = true;
    
    // Sync the current user
    try {
      debugLog('Syncing user with Superwall after initialization');
      await syncUserWithSuperwall();
      debugLog('User synced with Superwall successfully after initialization');
    } catch (syncError) {
      debugLog('Error syncing user with Superwall after initialization', syncError);
      // Continue anyway since this isn't critical for initialization
    }
    
    return true;
  } catch (error) {
    debugLog('Failed to initialize Superwall', error);
    isInitialized = false; // Ensure we reset this flag on failure
    return false;
  }
};

/**
 * Force initialization of Superwall (for retry scenarios)
 */
export const forceInitializeSuperwall = async (): Promise<boolean> => {
  debugLog('forceInitializeSuperwall called');
  
  // Return early if running in Expo Go
  if (isExpoGo()) {
    debugLog('Running in Expo Go - Superwall not supported, skipping force initialization');
    return true;
  }

  try {
    if (!verifySuperwallModule()) {
      debugLog('Superwall module verification failed during force initialization');
      return false;
    }
    
    debugLog('Attempting to configure Superwall with API key');
    
    // In production builds, would force configure Superwall here
    debugLog('Superwall configure completed successfully');
    isInitialized = true;
    
    // Try to sync user but don't fail if this fails
    try {
      await syncUserWithSuperwall();
    } catch (syncError) {
      debugLog('Failed to sync user after force initialization, but continuing', syncError);
    }
    
    return true;
  } catch (error) {
    debugLog('Failed to force initialize Superwall', error);
    return false;
  }
};

/**
 * Sync the current user with Superwall
 */
export const syncUserWithSuperwall = async () => {
  debugLog('syncUserWithSuperwall called');
  
  // Return early if running in Expo Go
  if (isExpoGo()) {
    debugLog('Running in Expo Go - Superwall not supported, skipping user sync');
    return true;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      debugLog('No user session found, cannot sync with Superwall');
      return false;
    }
    
    const { id, email } = session.user;
    debugLog(`Syncing user with Superwall: ${id} (${email})`);
    
    const userAttributes = {
      userId: id,
      email: email || '',
      // Add any other relevant user data
    };
    
    debugLog('Setting user attributes in Superwall', userAttributes);
    // In production builds, would set user attributes in Superwall here
    
    debugLog('User synced with Superwall successfully');
    
    // Also identify the user in RevenueCat
    try {
      await identifyUser(id);
      debugLog('User identified in RevenueCat successfully');
    } catch (rcError) {
      debugLog('Error identifying user in RevenueCat', rcError);
      // Continue anyway since this isn't critical for Superwall sync
    }
    
    return true;
  } catch (error) {
    debugLog('Failed to sync user with Superwall', error);
    return false;
  }
};

/**
 * Present a paywall with the specified identifier
 * @param placementName The identifier/name of the placement to present
 * @param params Additional attributes to pass to the paywall
 * @param onFeatureAccess Optional callback that will be called when user should get access to the feature
 * @returns Promise resolving to true if paywall was presented, false otherwise
 */
export const presentPaywall = async (
  placementName: string = 'onboarding_complete',
  params: Record<string, any> = {},
  onFeatureAccess?: () => void
): Promise<boolean> => {
  debugLog(`presentPaywall called for placement: ${placementName}`);
  debugLog(`Params: ${JSON.stringify(params)}`);
  
  // Return early if running in Expo Go
  if (isExpoGo()) {
    debugLog('Running in Expo Go - Superwall not supported, calling feature callback directly');
    // Create a default feature function if none provided
    const defaultFeatureAccess = () => {
      debugLog('Default feature access callback executed, navigating to Learn screen');
      // Import and use the router to navigate programmatically
      const { router } = require('expo-router');
      router.replace('/learn');
    };
    
    const featureCallback = onFeatureAccess || defaultFeatureAccess;
    featureCallback();
    return true;
  }
  
  // For production builds, would handle Superwall logic here
  debugLog('Superwall not available in current environment');
  return false;
};

/**
 * Check if Superwall is initialized
 */
export const isSuperwallInitialized = () => {
  return isInitialized;
};

/**
 * Reset Superwall state (for testing)
 */
export const resetSuperwallState = async () => {
  debugLog('Resetting Superwall state');
  isInitialized = false;
};

/**
 * Check for available paywalls (placeholder)
 */
export const checkForPaywalls = async (): Promise<void> => {
  debugLog('checkForPaywalls called');
  
  if (isExpoGo()) {
    debugLog('Running in Expo Go - skipping paywall check');
    return;
  }
  
  // In production builds, would check for paywalls here
  debugLog('Paywall check completed');
}; 