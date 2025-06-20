import Purchases, { LOG_LEVEL, PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

// RevenueCat API keys from environment variables
const REVENUECAT_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_zRRgtqSictCpKyyscMdIjxjasqd',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'appl_zRRgtqSictCpKyyscMdIjxjasqd',
};

// Storage key for RevenueCat user ID
const RC_USER_ID_KEY = '@shira_revenuecat_user_id';

// Track initialization state
let isInitialized = false;
let currentIdentifiedUser: string | null = null;

// Initialize RevenueCat with the appropriate API key
export const initializeRevenueCat = async () => {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('RevenueCat SDK already initialized, skipping');
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = Platform.OS === 'ios' 
    ? REVENUECAT_API_KEYS.ios 
    : REVENUECAT_API_KEYS.android;
    
  console.log(`Initializing RevenueCat with API key for ${Platform.OS} platform`);
  console.log(`Using ${__DEV__ ? 'development' : 'production'} environment`);

  try {
    // FIXED: Always check for Supabase session first (prioritize current session)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        // Use current Supabase user ID if available
        console.log(`Found active Supabase session, using user ID: ${session.user.id}`);
        
        // Configure RevenueCat with the session user ID
        Purchases.configure({
          apiKey,
          appUserID: session.user.id
        });
        currentIdentifiedUser = session.user.id;
        
        // Update stored ID to match current session
        await AsyncStorage.setItem(RC_USER_ID_KEY, session.user.id);
        console.log(`Updated stored RevenueCat user ID to match session: ${session.user.id}`);
        
        // Mark as initialized and exit
        isInitialized = true;
        console.log('RevenueCat SDK initialized with current Supabase session user');
        
        // Verify the initialization
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          console.log(`RevenueCat initialized with user ID: ${customerInfo.originalAppUserId}`);
        } catch (verifyError) {
          console.error('Error verifying initialization with session user:', verifyError);
        }
        
        return true;
      }
      
      // If no active session, fall back to stored ID
      console.log('No active Supabase session found, checking for stored ID');
    } catch (sessionError) {
      console.error('Error checking Supabase session:', sessionError);
      console.log('Falling back to stored ID due to session error');
    }
    
    // Only if no active session, check for stored ID
    let storedUserId = null;
    try {
      storedUserId = await AsyncStorage.getItem(RC_USER_ID_KEY);
      if (storedUserId) {
        console.log(`No active session but found stored RevenueCat user ID: ${storedUserId}`);
      }
    } catch (storageError) {
      console.error('Error checking stored RevenueCat user ID:', storageError);
    }
    
    // Use stored ID if available (but only if no active session)
    if (storedUserId) {
      console.log(`Initializing RevenueCat with stored user ID: ${storedUserId}`);
      Purchases.configure({
        apiKey,
        appUserID: storedUserId
      });
      currentIdentifiedUser = storedUserId;
    } else {
      // No session and no stored ID, use anonymous user
      console.log('No active session or stored ID, initializing with anonymous user');
      Purchases.configure({
        apiKey,
        appUserID: null
      });
    }
    
    // Mark as initialized
    isInitialized = true;
    console.log('RevenueCat SDK initialized successfully');
    
    // Verify the initialization
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log(`RevenueCat initialized with user ID: ${customerInfo.originalAppUserId}`);
    } catch (verifyError) {
      console.error('Error verifying initialization:', verifyError);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    throw error;
  }
};

// Check if RevenueCat is initialized
export const isRevenueCatInitialized = () => {
  return isInitialized;
};

// Get the current RevenueCat user ID
export const getCurrentRevenueCatUserId = async (): Promise<string | null> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.originalAppUserId;
  } catch (error) {
    console.error('Error getting current RevenueCat user ID:', error);
    return null;
  }
};

// Set the user ID for RevenueCat
export const identifyUser = async (userId: string) => {
    const functionStartTime = Date.now();
    console.log(`[identifyUser] Attempting to identify user: ${userId}`);

    try {
        // Ensure RevenueCat is initialized
        if (!isInitialized) {
            console.log('[identifyUser] RC not initialized, initializing...');
            await initializeRevenueCat();
        }

        // Get current app user ID before attempting identification
        console.log('[identifyUser] Getting current RC user ID...');
        const initialCustomerInfo = await Purchases.getCustomerInfo();
        const currentAppUserId = initialCustomerInfo.originalAppUserId;
        console.log(`[identifyUser] Current RC user: ${currentAppUserId}, Target user: ${userId}`);

        // FIXED: Check if this is a new account
        const isNewAccount = await AsyncStorage.getItem('isCreatingNewAccount') === 'true';
        
        // FIXED: Don't skip identification for new accounts, even if IDs match
        if (currentAppUserId === userId && !isNewAccount) {
            console.log(`[identifyUser] User already correctly identified as: ${userId} and not a new account. Skipping.`);
            currentIdentifiedUser = userId; // Update local cache just in case
            
            // FIXED: Still update AsyncStorage to ensure consistency
            await AsyncStorage.setItem(RC_USER_ID_KEY, userId);
            console.log('[identifyUser] Updated AsyncStorage with current user ID');
            
            return initialCustomerInfo;
        }
        
        // If this is a new account, log it
        if (isNewAccount) {
            console.log('[identifyUser] This is a new account. Forcing identification even if IDs match.');
            // Clear the flag after use
            await AsyncStorage.removeItem('isCreatingNewAccount');
        }

        // --- Attempt 1: Direct Configuration --- 
        console.log('[identifyUser] Attempt 1: Using direct configuration approach');
        const apiKey = Platform.OS === 'ios' 
            ? REVENUECAT_API_KEYS.ios 
            : REVENUECAT_API_KEYS.android;
        
        console.log('[identifyUser] Calling Purchases.configure...');
        Purchases.configure({
            apiKey,
            appUserID: userId
        });
        console.log('[identifyUser] Purchases.configure called.');

        // Verification 1 (with delay)
        console.log('[identifyUser] Waiting 1 second before verification 1...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add delay
        console.log('[identifyUser] Verifying configuration 1...');
        const updatedInfo1 = await Purchases.getCustomerInfo();
        console.log(`[identifyUser] Verification 1: RC user after configure: ${updatedInfo1.originalAppUserId}`);

        if (updatedInfo1.originalAppUserId === userId) {
            console.log('[identifyUser] Attempt 1 (Configure) SUCCEEDED');
            currentIdentifiedUser = userId;
            console.log('[identifyUser] Saving userId to AsyncStorage...');
            await AsyncStorage.setItem(RC_USER_ID_KEY, userId);
            console.log(`[identifyUser] Completed in ${Date.now() - functionStartTime}ms`);
            return updatedInfo1;
        }

        // --- Attempt 2: Login Fallback --- 
        console.warn(`[identifyUser] Attempt 1 (Configure) FAILED verification. Expected ${userId} but got ${updatedInfo1.originalAppUserId}`);
        console.log('[identifyUser] Attempt 2: Using login approach as fallback');
        
        console.log('[identifyUser] Calling Purchases.logIn...');
        const { customerInfo: loginInfo, created } = await Purchases.logIn(userId);
        console.log(`[identifyUser] Purchases.logIn completed. RC user: ${loginInfo.originalAppUserId}, Created new user: ${created}`);

        // Verification 2
        if (loginInfo.originalAppUserId === userId) {
            console.log('[identifyUser] Attempt 2 (Login) SUCCEEDED');
            currentIdentifiedUser = userId;
             console.log('[identifyUser] Saving userId to AsyncStorage...');
            await AsyncStorage.setItem(RC_USER_ID_KEY, userId);
            console.log(`[identifyUser] Completed in ${Date.now() - functionStartTime}ms`);
            return loginInfo;
        }

        // --- Failure --- 
        console.error(`[identifyUser] Attempt 2 (Login) FAILED verification. Expected ${userId} but got ${loginInfo.originalAppUserId}`);
        throw new Error(`Failed to identify user ${userId} with RevenueCat after configure and login attempts.`);

    } catch (error) {
        console.error(`[identifyUser] CRITICAL ERROR during identification for ${userId}:`, error);
        console.log(`[identifyUser] Failed after ${Date.now() - functionStartTime}ms`);
        // Re-throw the error so calling functions know it failed
        throw error; 
    }
};

// Reset user ID (for logout)
export const resetUser = async () => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.log('RevenueCat SDK not initialized, skipping logout');
      return;
    }
    
    // Check if the current user is anonymous
    const customerInfo = await Purchases.getCustomerInfo();
    const currentAppUserId = customerInfo.originalAppUserId;
    const isAnonymous = currentAppUserId?.startsWith('$RCAnonymousID:');
    
    if (isAnonymous) {
      console.log('Current RevenueCat user is anonymous, no need to log out');
      currentIdentifiedUser = null;
      await AsyncStorage.removeItem(RC_USER_ID_KEY);
      return;
    }
    
    // Only attempt to log out if the user is not anonymous
    console.log(`Logging out RevenueCat user: ${currentAppUserId}`);
    
    try {
      // Configure with null user ID to reset to anonymous state
      const apiKey = Platform.OS === 'ios' 
        ? REVENUECAT_API_KEYS.ios 
        : REVENUECAT_API_KEYS.android;
      
      // First try the standard logout
      await Purchases.logOut();
      console.log('Standard logout successful');
    } catch (logoutError) {
      console.error('Error during standard logout:', logoutError);
      
      // If standard logout fails, try reconfiguring with null user ID
      try {
        console.log('Attempting to reconfigure RevenueCat with null user ID');
        Purchases.configure({
          apiKey: Platform.OS === 'ios' 
            ? REVENUECAT_API_KEYS.ios 
            : REVENUECAT_API_KEYS.android,
          appUserID: null
        });
        console.log('Successfully reconfigured RevenueCat with null user ID');
      } catch (configError) {
        console.error('Error reconfiguring RevenueCat:', configError);
      }
    }
    
    currentIdentifiedUser = null;
    
    // Remove stored user ID
    await AsyncStorage.removeItem(RC_USER_ID_KEY);
    
    // Verify the logout worked
    try {
      const verifyInfo = await Purchases.getCustomerInfo();
      const newUserId = verifyInfo.originalAppUserId;
      const isNowAnonymous = newUserId?.startsWith('$RCAnonymousID:');
      
      if (isNowAnonymous) {
        console.log('User successfully logged out from RevenueCat, now anonymous');
      } else if (newUserId === currentAppUserId) {
        console.warn(`Logout may not have worked, user ID is still: ${newUserId}`);
      } else {
        console.log(`User logged out from RevenueCat, new user ID: ${newUserId}`);
      }
    } catch (verifyError) {
      console.error('Error verifying logout:', verifyError);
    }
  } catch (error) {
    console.error('Error logging out user from RevenueCat:', error);
    // Don't throw the error, just log it
    // This ensures the app continues even if RevenueCat logout fails
  }
};

// Get available packages with retry logic
export const getOfferings = async (maxRetries = 3) => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.log('RevenueCat SDK not initialized, initializing now');
      await initializeRevenueCat();
    }
    
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        console.log(`Attempt ${retries + 1} to fetch offerings`);
        const offerings = await Purchases.getOfferings();
        
        if (offerings.current) {
          console.log('Offerings fetched successfully:', offerings.current.identifier);
          console.log('Available packages:', offerings.current.availablePackages?.map(pkg => pkg.product.identifier));
          return offerings.current;
        }
        
        console.log('No current offering available, retrying...');
      } catch (error) {
        console.error(`Error fetching offerings (attempt ${retries + 1}):`, error);
      }
      
      retries++;
      
      if (retries < maxRetries) {
        // Wait before retrying with increasing backoff
        const delay = 1000 * retries;
        console.log(`Waiting ${delay}ms before retry ${retries + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If all retries fail, try fetching individual products as a fallback
    try {
      console.log('Trying to fetch individual products as fallback');
      const productIds = ['shira_pro_weekly', 'shira_pro_monthly', 'shira_pro_annual'];
      console.log('Attempting to fetch products with IDs:', productIds);
      
      const products = await Purchases.getProducts(productIds);
      
      console.log('Individual products fetched:', products);
      
      if (products && products.length > 0) {
        console.log('Some products were fetched successfully, but offerings are still unavailable');
        // We could potentially construct a manual offering here if needed
      } else {
        console.log('No individual products could be fetched either');
      }
    } catch (productError) {
      console.error('Error fetching individual products:', productError);
    }
    
    console.error(`Failed to fetch offerings after ${maxRetries} attempts`);
    return null;
  } catch (error) {
    console.error('Error in getOfferings:', error);
    return null;
  }
};

// Make a purchase
export const purchasePackage = async (packageToPurchase: any) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error) {
    console.error('Error making purchase:', error);
    throw error;
  }
};

// Check subscription status
export const checkSubscriptionStatus = async () => {
  try {
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.log('RevenueCat SDK not initialized, initializing now');
      await initializeRevenueCat();
    }
    
    // Get Supabase session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        // Get current RevenueCat user ID
        const customerInfo = await Purchases.getCustomerInfo();
        const currentAppUserId = customerInfo.originalAppUserId;
        
        console.log(`Subscription status check: isPro=${customerInfo.entitlements.active['Shira Pro'] !== undefined}, userId=${currentAppUserId}`);
        
        // If the current RevenueCat user doesn't match the Supabase user, re-identify
        if (currentAppUserId !== session.user.id) {
          console.log(`RevenueCat user (${currentAppUserId}) doesn't match Supabase user (${session.user.id}), re-identifying`);
          
          try {
            // Use direct configuration approach
            console.log('Using direct configuration approach for re-identification');
            const apiKey = Platform.OS === 'ios' 
              ? REVENUECAT_API_KEYS.ios 
              : REVENUECAT_API_KEYS.android;
            
            // Configure with the user ID directly
            Purchases.configure({
              apiKey,
              appUserID: session.user.id
            });
            
            // Verify the configuration worked
            const updatedInfo = await Purchases.getCustomerInfo();
            console.log(`RevenueCat user after re-identification: ${updatedInfo.originalAppUserId}`);
            
            if (updatedInfo.originalAppUserId !== session.user.id) {
              console.error(`Re-identification failed. Expected ${session.user.id} but got ${updatedInfo.originalAppUserId}`);
              
              // Try login approach as fallback
              console.log('Trying login approach as fallback');
              const { customerInfo: loginInfo } = await Purchases.logIn(session.user.id);
              
              if (loginInfo.originalAppUserId !== session.user.id) {
                console.error(`Login approach failed. Expected ${session.user.id} but got ${loginInfo.originalAppUserId}`);
                // Continue with original customer info
              } else {
                console.log('Login approach successful');
                await AsyncStorage.setItem(RC_USER_ID_KEY, session.user.id);
                return {
                  isPro: loginInfo.entitlements.active['Shira Pro'] !== undefined,
                  customerInfo: loginInfo
                };
              }
            } else {
              console.log('Re-identification successful');
              await AsyncStorage.setItem(RC_USER_ID_KEY, session.user.id);
              return {
                isPro: updatedInfo.entitlements.active['Shira Pro'] !== undefined,
                customerInfo: updatedInfo
              };
            }
          } catch (idError) {
            console.error('Error re-identifying user with RevenueCat during subscription check:', idError);
            // Continue with the original customer info
          }
        }
        
        return {
          isPro: customerInfo.entitlements.active['Shira Pro'] !== undefined,
          customerInfo
        };
      } else {
        console.log('No active Supabase session found during subscription check');
        
        // Get customer info anyway
        const customerInfo = await Purchases.getCustomerInfo();
        
        return {
          isPro: customerInfo.entitlements.active['Shira Pro'] !== undefined,
          customerInfo
        };
      }
    } catch (sessionError) {
      console.error('Error checking session during subscription check:', sessionError);
      
      // Get customer info anyway
      const customerInfo = await Purchases.getCustomerInfo();
      
      return {
        isPro: customerInfo.entitlements.active['Shira Pro'] !== undefined,
        customerInfo
      };
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isPro: false, customerInfo: null };
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      isPro: customerInfo.entitlements.active['Shira Pro'] !== undefined,
      customerInfo
    };
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return { isPro: false, customerInfo: null };
  }
};

// Present RevenueCat's hosted paywall using the direct approach
export const presentPaywall = async (offeringIdentifier: string = 'default'): Promise<boolean> => {
  try {
    console.log(`Presenting RevenueCat paywall for offering: ${offeringIdentifier}`);
    
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.log('RevenueCat SDK not initialized, initializing now');
      await initializeRevenueCat();
    }
    
    // Always re-identify the user before showing the paywall
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        console.log(`Re-identifying user with RevenueCat before showing paywall: ${session.user.id}`);
        
        // Use direct configuration approach
        console.log('Using direct configuration approach for paywall identification');
        const apiKey = Platform.OS === 'ios' 
          ? REVENUECAT_API_KEYS.ios 
          : REVENUECAT_API_KEYS.android;
        
        // Configure with the user ID directly
        Purchases.configure({
          apiKey,
          appUserID: session.user.id
        });
        
        // Verify the configuration worked
        const verifyInfo = await Purchases.getCustomerInfo();
        console.log(`RevenueCat user after paywall identification: ${verifyInfo.originalAppUserId}`);
        
        if (verifyInfo.originalAppUserId !== session.user.id) {
          console.error(`Paywall identification failed. Expected ${session.user.id} but got ${verifyInfo.originalAppUserId}`);
          
          // Try login approach as fallback
          console.log('Trying login approach as fallback for paywall');
          const { customerInfo: loginInfo } = await Purchases.logIn(session.user.id);
          
          if (loginInfo.originalAppUserId !== session.user.id) {
            console.error(`Login approach failed for paywall. Expected ${session.user.id} but got ${loginInfo.originalAppUserId}`);
            throw new Error('Failed to identify user with RevenueCat for paywall');
          } else {
            console.log('Login approach successful for paywall');
            await AsyncStorage.setItem(RC_USER_ID_KEY, session.user.id);
          }
        } else {
          console.log('Paywall identification successful');
          await AsyncStorage.setItem(RC_USER_ID_KEY, session.user.id);
        }
      } else {
        console.log('No Supabase session found, cannot identify user with RevenueCat');
        throw new Error('You must be logged in to access premium features');
      }
    } catch (idError) {
      console.error('Error identifying user before presenting paywall:', idError);
      throw new Error('You must be logged in to access premium features');
    }
    
    // Use the direct approach to present the paywall
    console.log('Presenting RevenueCat hosted paywall using direct approach');
    const paywallResult = await RevenueCatUI.presentPaywall();
    
    // Handle the result
    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
        console.log('Paywall: Purchase successful');
        return true;
      case PAYWALL_RESULT.RESTORED:
        console.log('Paywall: Restore successful');
        return true;
      case PAYWALL_RESULT.CANCELLED:
        console.log('Paywall: User cancelled');
        return false;
      case PAYWALL_RESULT.ERROR:
        console.error('Paywall: Error occurred');
        return false;
      case PAYWALL_RESULT.NOT_PRESENTED:
        console.log('Paywall: Not presented');
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error presenting paywall:', error);
    throw error;
  }
};

// Present RevenueCat's hosted paywall only if the user doesn't have the entitlement
export const presentPaywallIfNeeded = async (entitlementIdentifier: string = 'Shira Pro'): Promise<boolean> => {
  try {
    console.log(`Presenting RevenueCat paywall if needed for entitlement: ${entitlementIdentifier}`);
    
    // Ensure RevenueCat is initialized
    if (!isInitialized) {
      console.log('RevenueCat SDK not initialized, initializing now');
      await initializeRevenueCat();
    }
    
    // Always re-identify the user before showing the paywall
    try {
      // Get Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        console.log(`Re-identifying user with RevenueCat before conditional paywall: ${session.user.id}`);
        
        // Use direct configuration approach
        console.log('Using direct configuration approach for conditional paywall');
        const apiKey = Platform.OS === 'ios' 
          ? REVENUECAT_API_KEYS.ios 
          : REVENUECAT_API_KEYS.android;
        
        // Configure with the user ID directly
        Purchases.configure({
          apiKey,
          appUserID: session.user.id
        });
        
        // Verify the configuration worked
        const verifyInfo = await Purchases.getCustomerInfo();
        console.log(`RevenueCat user after conditional paywall identification: ${verifyInfo.originalAppUserId}`);
        
        if (verifyInfo.originalAppUserId !== session.user.id) {
          console.error(`Conditional paywall identification failed. Expected ${session.user.id} but got ${verifyInfo.originalAppUserId}`);
          
          // Try login approach as fallback
          console.log('Trying login approach as fallback for conditional paywall');
          const { customerInfo: loginInfo } = await Purchases.logIn(session.user.id);
          
          if (loginInfo.originalAppUserId !== session.user.id) {
            console.error(`Login approach failed for conditional paywall. Expected ${session.user.id} but got ${loginInfo.originalAppUserId}`);
            throw new Error('Failed to identify user with RevenueCat for conditional paywall');
          } else {
            console.log('Login approach successful for conditional paywall');
            await AsyncStorage.setItem(RC_USER_ID_KEY, session.user.id);
          }
        } else {
          console.log('Conditional paywall identification successful');
          await AsyncStorage.setItem(RC_USER_ID_KEY, session.user.id);
        }
      } else {
        console.log('No Supabase session found, cannot identify user with RevenueCat');
        throw new Error('You must be logged in to access premium features');
      }
    } catch (idError) {
      console.error('Error identifying user before presenting conditional paywall:', idError);
      throw new Error('You must be logged in to access premium features');
    }
    
    // Use the conditional approach to present the paywall
    console.log(`Presenting RevenueCat hosted paywall if needed for entitlement: ${entitlementIdentifier}`);
    const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: entitlementIdentifier
    });
    
    // Handle the result
    switch (paywallResult) {
      case PAYWALL_RESULT.PURCHASED:
        console.log('Paywall: Purchase successful');
        return true;
      case PAYWALL_RESULT.RESTORED:
        console.log('Paywall: Restore successful');
        return true;
      case PAYWALL_RESULT.CANCELLED:
        console.log('Paywall: User cancelled');
        return false;
      case PAYWALL_RESULT.ERROR:
        console.error('Paywall: Error occurred');
        return false;
      case PAYWALL_RESULT.NOT_PRESENTED:
        console.log('Paywall: Not presented (user already has entitlement)');
        return true; // User already has the entitlement, so consider it a success
      default:
        return false;
    }
  } catch (error) {
    console.error('Error presenting paywall:', error);
    throw error;
  }
};

// Completely reset the RevenueCat SDK
export const completelyResetRevenueCat = async () => {
  try {
    console.log('Completely resetting RevenueCat SDK');
    
    // First try to log out
    try {
      await Purchases.logOut();
      console.log('Successfully logged out from RevenueCat');
    } catch (logoutError) {
      console.error('Error logging out from RevenueCat:', logoutError);
      // Continue even if logout fails
    }
    
    // Clear stored user ID
    await AsyncStorage.removeItem(RC_USER_ID_KEY);
    currentIdentifiedUser = null;
    
    // Reset initialization flag
    isInitialized = false;
    
    // Reconfigure with null user ID
    const apiKey = Platform.OS === 'ios' 
      ? REVENUECAT_API_KEYS.ios 
      : REVENUECAT_API_KEYS.android;
    
    Purchases.configure({
      apiKey,
      appUserID: null
    });
    
    // Add a delay after reconfiguration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark as initialized again
    isInitialized = true;
    
    console.log('RevenueCat SDK completely reset');
    
    // Verify the reset worked
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const newUserId = customerInfo.originalAppUserId;
      const isNowAnonymous = newUserId?.startsWith('$RCAnonymousID:');
      
      if (isNowAnonymous) {
        console.log('RevenueCat reset successful, now using anonymous user:', newUserId);
      } else {
        console.warn('RevenueCat reset may not have worked completely, current user:', newUserId);
      }
    } catch (verifyError) {
      console.error('Error verifying RevenueCat reset:', verifyError);
    }
    
    return true;
  } catch (error) {
    console.error('Error completely resetting RevenueCat:', error);
    return false;
  }
};