# Superwall & RevenueCat Integration Plan

## Overview
This document outlines the implementation plan for integrating Superwall paywalls with RevenueCat subscription management into the Shira app's onboarding flow. The paywall will be presented as the final step in the onboarding process, immediately after account creation in both Supabase and RevenueCat.

## Implementation Flow
1. User completes all onboarding steps
2. User creates an account (via email/password or social login)
3. Account is created in Supabase and linked to RevenueCat
4. Superwall paywall is presented
5. Based on user action:
   - If user subscribes: Process payment via RevenueCat, grant entitlements, navigate to Learn screen
   - If user closes paywall: Navigate to Learn screen with free tier access

## Technical Requirements

### 1. Dependencies
```json
"dependencies": {
  "superwall-react-native": "^4.x.x",
  "react-native-purchases": "^6.x.x"
}
```

### 2. Integration Steps

#### A. Initialize Services

Create a `superwallClient.ts` file to set up Superwall:

```typescript
import Superwall from 'superwall-react-native';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { identifyUser } from '../lib/revenueCatClient';

export const initializeSuperwall = async () => {
  try {
    const options = {
      paywallDismissalHandler: () => {
        console.log('Paywall dismissed');
      },
      subscriptionStatusDidChangeHandler: (isSubscribed: boolean) => {
        console.log('Subscription status changed:', isSubscribed);
      }
    };

    if (Platform.OS === 'ios') {
      await Superwall.configure('YOUR_IOS_API_KEY', options);
    } else {
      await Superwall.configure('YOUR_ANDROID_API_KEY', options);
    }

    // Set up delegate to handle purchases through RevenueCat
    await Superwall.setPurchaseDelegate({
      shouldPurchase: async (productId) => {
        // Return false to let Superwall handle the purchase
        return false;
      },
      handlePurchaseCompleted: async (productId, purchased) => {
        // Logic after purchase completion
        if (purchased) {
          console.log(`Purchase completed for product: ${productId}`);
        }
      }
    });

    console.log('Superwall initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Superwall:', error);
  }
};

export const syncUserWithSuperwall = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { id, email } = session.user;
      
      // Set user attributes in Superwall
      await Superwall.setUserAttributes({
        userId: id,
        email: email || ''
      });
      
      console.log('User synced with Superwall:', id);
    }
  } catch (error) {
    console.error('Failed to sync user with Superwall:', error);
  }
};
```

#### B. Update RevenueCat Client (if needed)

Ensure RevenueCat client has proper methods for Superwall integration:

```typescript
// lib/revenueCatClient.ts (add or modify)
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export const identifyUser = async (userId: string) => {
  try {
    await Purchases.logIn(userId);
    console.log('User identified in RevenueCat:', userId);
    return true;
  } catch (error) {
    console.error('Failed to identify user in RevenueCat:', error);
    return false;
  }
};

export const getOfferings = async (): Promise<PurchasesPackage[] | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || null;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<boolean> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (error) {
    console.error('Purchase failed:', error);
    return false;
  }
};
```

#### C. Modify Onboarding Flow to Show Paywall

Update the `useOnboardingState.tsx` hook to include a new step:

```typescript
// Add to OnboardingStep enum in useOnboardingState.tsx
export enum OnboardingStep {
  // Existing steps...
  ACCOUNT_CREATION,
  PAYWALL,
  COMPLETE
}
```

#### D. Create Paywall Component

Create a new file `PaywallScreen.tsx` in the onboarding components:

```typescript
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Superwall from 'superwall-react-native';
import { useOnboardingState } from '../hooks/useOnboardingState';
import { initializeSuperwall, syncUserWithSuperwall } from '../superwallClient';
import { PURPLE_PRIMARY, DARK_BACKGROUND } from '../../constants/Colors';

export function PaywallScreen() {
  const router = useRouter();
  const { goToNextStep } = useOnboardingState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupPaywall = async () => {
      try {
        // Initialize Superwall if not already initialized
        await initializeSuperwall();
        
        // Sync user data with Superwall
        await syncUserWithSuperwall();
        
        setIsLoading(false);
        
        // Present the paywall
        await Superwall.registerEvent('onboarding_complete', {
          onPresent: () => {
            console.log('Paywall presented');
          },
          onDismiss: () => {
            console.log('Paywall dismissed');
            navigateToLearn();
          },
          onError: (error) => {
            console.error('Paywall error:', error);
            navigateToLearn(); // Fallback to free tier on error
          }
        });
      } catch (error) {
        console.error('Error setting up paywall:', error);
        setIsLoading(false);
        navigateToLearn(); // Fallback to free tier
      }
    };

    setupPaywall();
  }, []);

  const navigateToLearn = () => {
    goToNextStep();
    router.replace('/learn');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={PURPLE_PRIMARY} />
      </View>
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

#### E. Update the Main Onboarding Screen

Modify the `index.tsx` file in the onboarding folder to include the new paywall step:

```typescript
// Add to the renderStep function in index.tsx
const renderStep = () => {
  switch (step) {
    // Existing cases...
    case OnboardingStep.ACCOUNT_CREATION:
      return <AccountCreationScreen />;
    case OnboardingStep.PAYWALL:
      return <PaywallScreen />;
    case OnboardingStep.COMPLETE:
      return null; // This should immediately redirect to Learn
    default:
      return <WelcomeScreen />;
  }
};
```

## Data Flow Diagram

```
┌─────────────┐     ┌───────────┐     ┌──────────────┐
│ Onboarding  │────►│ Supabase  │────►│ User Created │
│ Completion  │     │ Auth      │     │ in Supabase  │
└─────────────┘     └───────────┘     └──────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌───────────┐     ┌──────────────┐
│ Superwall   │◄────│ Paywall   │◄────│ RevenueCat   │
│ Paywall     │     │ Screen    │     │ Integration  │
└─────────────┘     └───────────┘     └──────────────┘
       │                                      
       ├─────────────┐                        
       │             │                        
       ▼             ▼                        
┌─────────────┐     ┌───────────┐            
│ Subscribe   │     │ Skip      │            
│ (Payment)   │     │ (Free)    │            
└─────────────┘     └───────────┘            
       │                 │                    
       ▼                 ▼                    
┌─────────────────────────────────┐          
│           Learn Screen          │          
└─────────────────────────────────┘          
```

## Testing Guidelines

1. Test account creation with both email/password and social logins
2. Verify user is properly created in both Supabase and RevenueCat
3. Confirm paywall appears after account creation
4. Test purchase flow with test products
5. Test paywall dismissal flow
6. Verify navigation to Learn screen in both scenarios
7. Test error handling (network issues, initialization failures)

## Configuration Notes

1. Superwall Dashboard:
   - Create a paywall specifically for onboarding completion
   - Configure the paywall to use RevenueCat products
   - Set up event triggers for 'onboarding_complete'

2. RevenueCat Dashboard:
   - Ensure products and offerings are properly configured
   - Set up appropriate entitlements for premium features

## Implementation Timeline

1. Day 1: Set up dependencies and configure services
2. Day 2: Implement Superwall and RevenueCat client code
3. Day 3: Integrate paywall into onboarding flow
4. Day 4: Testing and debugging
5. Day 5: Final adjustments and deployment prep

## Next Steps

After implementation, track conversion metrics to optimize:
- Paywall conversion rate
- User drop-off points
- A/B test different paywall designs 