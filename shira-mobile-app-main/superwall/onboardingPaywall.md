# Onboarding Paywall Integration Plan

## Current Issue
The app currently shows a paywall to users after account creation by navigating to a separate `PaywallScreen.tsx` file. However, there are navigation issues when dismissing the paywall, and users are not being properly directed to the learn route as expected.

## Root Cause
Based on our successful refactoring of the Profile screen's paywall implementation, we've identified that the separate `PaywallScreen` approach isn't optimal. The navigation flow is broken, likely due to a problematic implementation of Superwall in the `PaywallScreen.tsx` file.

## Implementation Plan

### 1. Replace Separate PaywallScreen with Inline Implementation

Instead of navigating to a separate `PaywallScreen` after account creation, we'll integrate the paywall directly into the `AccountCreationScreen.tsx` as the final step of the onboarding process.

### 2. Refactoring Steps

1. Modify the account creation flow in `AccountCreationScreen.tsx`:
   - Keep all existing account creation logic (Supabase auth, profile creation, RevenueCat identification)
   - Replace the `goToNextStep()` call with inline Superwall paywall presentation
   - Add navigation logic to route to the learn screen after paywall interaction

2. Remove reliance on the separate `PaywallScreen.tsx` file:
   - Update the onboarding navigation flow to skip the paywall screen step
   - Handle all paywall presentation logic directly in `AccountCreationScreen.tsx`

### 3. Implementation Details

#### Update AccountCreationScreen.tsx

We'll add a new function `showOnboardingPaywall()` that will be called after successful account creation:

```typescript
const showOnboardingPaywall = () => {
  console.log('[AccountCreation] Showing onboarding complete paywall');
  
  // Prepare user attributes
  const userAttributes = {
    userId: userId, // From the account creation response
    email: email,
    displayName: name || email.split('@')[0],
    targetLanguage: state.selectedLanguage || 'Spanish',
    fromOnboarding: true,
  };
  
  // Set user attributes first
  Superwall.shared.setUserAttributes(userAttributes)
    .then(() => {
      // Register the placement to trigger the paywall
      Superwall.shared.register({
        placement: 'onboarding_complete',
        params: {
          source: 'onboarding',
          context: 'account_creation_complete'
        },
        feature: async () => {
          // This function is called when:
          // 1. The user completes a purchase
          // 2. The user already has access to the feature
          // 3. The paywall is set to non-gated and user dismisses it
          console.log('[AccountCreation] Feature callback executed - purchase successful or user already has access');
          
          // Navigate to the learn screen
          router.replace('/learn');
        },
        handler: {
          onPresent: () => {
            console.log('[AccountCreation] Paywall presented');
            setLoading(false); // Stop loading state
          },
          onDismiss: () => {
            console.log('[AccountCreation] Paywall dismissed');
            // Still navigate to the learn screen even if user dismisses
            router.replace('/learn');
          },
          onError: (error) => {
            console.error('[AccountCreation] Error presenting paywall:', error);
            setLoading(false);
            Alert.alert('Error', 'Could not load subscription options. Continuing to app.');
            router.replace('/learn');
          },
          onSkip: (reason) => {
            console.log(`[AccountCreation] Paywall skipped, reason: ${String(reason)}`);
            router.replace('/learn');
          }
        }
      });
    })
    .catch(error => {
      console.error('[AccountCreation] Error setting user attributes:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to prepare subscription options. Continuing to app.');
      router.replace('/learn');
    });
};
```

#### Modify the Email Signup Handler

We'll update the `handleEmailSignUp` function to call our new method:

```typescript
const handleEmailSignUp = async () => {
  // [Existing validation code remains unchanged]

  try {
    setLoading(true);
    
    // [Existing user registration code remains unchanged]
    
    // Create user profile
    try {
      // [Existing profile creation code remains unchanged]
      
      // FIXED: Mark that we're creating a new account for RevenueCat
      await AsyncStorage.setItem('isCreatingNewAccount', 'true');
      console.log('Marked as new account for RevenueCat identification');
      
      // Identify user with RevenueCat
      try {
        await identifyUser(userId);
        console.log(`User identified with RevenueCat: ${userId}`);
      } catch (rcError) {
        console.error('Error identifying user with RevenueCat:', rcError);
        // Continue even if RevenueCat identification fails
      }
      
      // CHANGE: Instead of going to next step (PaywallScreen), show paywall directly
      // goToNextStep(); <-- Remove this line
      
      // Show onboarding paywall directly
      showOnboardingPaywall();
      
    } catch (profileError) {
      // [Existing error handling remains unchanged]
    }
  } catch (error) {
    // [Existing error handling remains unchanged]
  }
};
```

#### Modify the Social Signup Handler

Similarly, we'll update the `handleSocialSignUp` function:

```typescript
const handleSocialSignUp = async (provider: 'google' | 'apple') => {
  try {
    // [Existing social sign-in code remains unchanged]
    
    // CHANGE: Instead of going to next step (PaywallScreen), show paywall directly
    // goToNextStep(); <-- Remove this line
    
    // Show onboarding paywall directly
    showOnboardingPaywall();
    
  } catch (error) {
    // [Existing error handling remains unchanged]
  }
};
```

### 4. Additional Required Changes

#### Import Superwall

Add the Superwall import to AccountCreationScreen.tsx:

```typescript
import Superwall from '@superwall/react-native-superwall';
import { initializeSuperwall } from '../../../superwall/superwallClient';
```

#### Initialize Superwall

In a useEffect hook, initialize Superwall when the component mounts:

```typescript
useEffect(() => {
  // Initialize Superwall when component mounts
  const setupSuperwall = async () => {
    try {
      await initializeSuperwall();
      console.log('[AccountCreation] Superwall initialized successfully');
    } catch (error) {
      console.error('[AccountCreation] Error initializing Superwall:', error);
      // Continue anyway since we'll retry initialization before showing the paywall
    }
  };
  
  setupSuperwall();
  
  // [Existing useEffect code remains unchanged]
}, []);
```

#### Update showOnboardingPaywall to ensure Superwall is initialized

```typescript
const showOnboardingPaywall = async () => {
  console.log('[AccountCreation] Showing onboarding complete paywall');
  
  // Make sure Superwall is initialized
  try {
    const success = await initializeSuperwall();
    if (!success) {
      console.error('[AccountCreation] Failed to initialize Superwall');
      setLoading(false);
      router.replace('/learn');
      return;
    }
  } catch (error) {
    console.error('[AccountCreation] Error initializing Superwall:', error);
    setLoading(false);
    router.replace('/learn');
    return;
  }
  
  // [Rest of the paywall presentation code]
};
```

### 5. Update Onboarding Flow

We need to update the onboarding flow to remove the PaywallScreen step. This would typically be in the `useOnboardingState.tsx` hook:

1. Remove the PaywallScreen step from the onboarding flow
2. Update any references to the onboarding step indices

### 6. Benefits of This Approach

1. **Simplified Flow**: The entire account creation and paywall presentation process happens in one place
2. **More Reliable Navigation**: Direct navigation to /learn instead of relying on multiple navigation steps
3. **Better User Experience**: Smoother transition from account creation to paywall to app
4. **Error Resilience**: Even if the paywall fails, users will still be directed to the app
5. **Better Code Organization**: Following the successful pattern we established in the Profile screen

### 7. Testing Strategy

To ensure this implementation works correctly:

1. Test the complete flow from start to finish:
   - Create a new account (via email, Google, and Apple)
   - Verify paywall appears
   - Verify purchase flow works
   - Verify dismissal properly navigates to /learn

2. Test error handling:
   - Simulate network failures
   - Verify users can still access the app even if paywall fails

3. Test account variations:
   - New accounts
   - Existing accounts
   - Accounts with/without profiles

This implementation will ensure a smooth onboarding experience with proper paywall presentation and consistent navigation to the learn screen regardless of user choices or error conditions. 