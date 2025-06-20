# Profile Screen Paywall Implementation Plan

## Current Issue
Currently, the Profile screen is using a `PaywallView` component to show a paywall when the user presses the "Go Pro" button. However, this approach is not working correctly. The paywall fails to appear when the button is pressed.

## Root Cause
Based on the Superwall documentation, we're not correctly implementing the paywall presentation. Instead of using a custom `PaywallView` component, we should use Superwall's direct `register()` method which is the recommended approach for triggering paywalls.

## Implementation Plan

### 1. Update the Profile Screen

Replace the current `PaywallView` implementation with a direct Superwall integration:

1. Remove the `PaywallView` import and related state management
2. Update the `handleShowPaywall` function to use Superwall's `register()` method
3. Keep the `handlePurchaseSuccess` function for updating the user status after purchase

### 2. Code Changes

Here's the implementation we'll use for the `handleShowPaywall` function:

```typescript
const handleShowPaywall = () => {
  if (!currentUser) {
    Alert.alert('Error', 'User data not loaded yet. Please wait a moment.');
    return;
  }
  
  console.log('[Profile] Showing Superwall paywall');
  
  // Prepare user attributes
  const userAttributes = {
    userId: currentUser.id,
    email: currentUser.email || 'unknown@email.com',
    displayName: displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
    targetLanguage: currentUser.target_lang || 'Spanish',
    isPro: currentUser.is_pro || false,
    fromProfileTab: true,
  };
  
  // Set user attributes first
  Superwall.shared.setUserAttributes(userAttributes)
    .then(() => {
      // Register the placement to trigger the paywall
      Superwall.shared.register({
        placement: 'pro_button_press',
        params: {
          source: 'profile_tab',
          context: 'go_pro_button'
        },
        feature: async () => {
          // This function is called when:
          // 1. The user completes a purchase
          // 2. The user already has access to the feature
          // 3. The paywall is set to non-gated and user dismisses it
          console.log('[Profile] Feature callback executed - purchase successful or user already has access');
          
          // Refresh user data to update the UI
          await refreshUser();
          setRefreshKey(prev => prev + 1);
          
          // Optionally show success message
          Alert.alert('Subscription Active', 'Shira Pro is now active!');
        },
        handler: {
          onPresent: () => {
            console.log('[Profile] Paywall presented');
          },
          onDismiss: () => {
            console.log('[Profile] Paywall dismissed');
          },
          onError: (error) => {
            console.error('[Profile] Error presenting paywall:', error);
            Alert.alert('Error', 'Could not load subscription options. Please try again.');
          },
          onSkip: (reason) => {
            console.log(`[Profile] Paywall skipped, reason: ${String(reason)}`);
          }
        }
      });
    })
    .catch(error => {
      console.error('[Profile] Error setting user attributes:', error);
      Alert.alert('Error', 'Failed to prepare subscription options.');
    });
};
```

### 3. Remove PaywallView Component

Since we'll be using the direct Superwall integration, we should:

1. Remove the `isPaywallVisible` state
2. Remove the `handleClosePaywall` function
3. Remove the `PaywallView` component from the JSX
4. Keep `handlePurchaseSuccess` functionality but inline it in the `feature` callback

### 4. Migration Steps

1. Make the changes to the `handleShowPaywall` function
2. Remove the `PaywallView` component from the JSX at the bottom of the component
3. Remove the unused state variables and functions related to the modal approach
4. Test the implementation by clicking the "Go Pro" button

### Benefits of This Approach

1. **Direct Integration**: Uses Superwall's recommended approach for showing paywalls
2. **Simpler Code**: Removes the need for a separate component and modal management
3. **Better Error Handling**: Includes proper error handling and logging
4. **Consistent User Experience**: Follows Superwall's best practices for paywall presentation

This implementation will ensure that when a user clicks the "Go Pro" button, the Superwall paywall appears correctly based on the server-configured rules for the "pro_button_press" placement. 