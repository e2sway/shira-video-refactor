# Handling Paywall Dismissal in Superwall

## Overview

This document outlines how to properly handle the dismissal of Superwall paywalls in a React Native application. Correctly implementing dismissal handling is crucial for maintaining proper navigation flow and user experience.

## Correct Implementation Pattern

According to the Superwall documentation, you should use the `PaywallPresentationHandler` class to handle paywall events including dismissal. Below is the recommended pattern:

```typescript
import Superwall, { PaywallPresentationHandler } from '@superwall/react-native-superwall';

// 1. Create a dedicated handler object
const handler = new PaywallPresentationHandler();

// 2. Add the onDismiss handler to it
handler.onDismiss((paywallInfo, paywallResult) => {
  console.log(`Paywall dismissed: ${paywallInfo?.name}`);
  
  // Perform navigation or other actions after dismissal
  router.replace('/destination-route');
});

// 3. Add other handlers as needed
handler.onPresent((paywallInfo) => {
  console.log(`Paywall presented: ${paywallInfo?.name}`);
});

handler.onError((error) => {
  console.error(`Error presenting paywall: ${error}`);
});

handler.onSkip((skipReason) => {
  console.log(`Paywall skipped: ${String(skipReason)}`);
});

// 4. Register the placement with the handler object
Superwall.shared.register({
  placement: 'your_placement_name',
  params: {
    source: 'your_source',
    context: 'your_context'
  },
  handler: handler,  // Pass the handler object here
  feature: async () => {
    // This is called when the user purchases or already has access
    console.log('Feature callback executed');
  }
});
```

## Common Mistakes to Avoid

1. **Using an inline object literal for handlers**:

   ```typescript
   // ❌ INCORRECT APPROACH
   Superwall.shared.register({
     placement: 'your_placement_name',
     handler: {
       onDismiss: () => {
         // This may not be called correctly
         router.replace('/destination-route');
       }
     },
     feature: () => { /* ... */ }
   });
   ```

2. **Not creating a dedicated handler object**:

   The Superwall SDK expects a `PaywallPresentationHandler` instance, not a plain object with handler properties.

3. **Not including all necessary handlers**:

   For complete event handling, implement all four handlers: `onPresent`, `onDismiss`, `onError`, and `onSkip`.

## Handling Dismiss vs. Feature Callback

It's important to understand when each callback gets triggered:

- **onDismiss**: Called when the paywall is dismissed for any reason, including after a purchase is completed or when the user taps the close button.

- **feature**: Called only when:
  1. The user completes a purchase
  2. The user already has access to the feature
  3. The paywall is set to non-gated and the user dismisses it

For proper navigation flow, you may need to include navigation logic in both the `onDismiss` handler and the `feature` callback, depending on your app's requirements.

## Complete Example with Error Handling

```typescript
const showPaywall = async () => {
  try {
    // Initialize Superwall if needed
    await initializeSuperwall();
    
    // Set user attributes
    await Superwall.shared.setUserAttributes({
      userId: currentUser.id,
      // Other attributes...
    });
    
    // Create handler
    const handler = new PaywallPresentationHandler();
    
    // Add handlers
    handler.onPresent((paywallInfo) => {
      console.log(`Paywall presented: ${paywallInfo?.name}`);
      setLoading(false);
    });
    
    handler.onDismiss((paywallInfo, paywallResult) => {
      console.log(`Paywall dismissed: ${paywallInfo?.name}`);
      
      // Navigate regardless of purchase outcome
      router.replace('/destination-route');
    });
    
    handler.onError((error) => {
      console.error(`Error presenting paywall: ${error}`);
      
      // Handle error gracefully
      setLoading(false);
      Alert.alert('Error', 'Could not load subscription options');
      router.replace('/destination-route');
    });
    
    handler.onSkip((skipReason) => {
      console.log(`Paywall skipped: ${String(skipReason)}`);
      router.replace('/destination-route');
    });
    
    // Register the placement
    Superwall.shared.register({
      placement: 'your_placement_name',
      params: {
        source: 'your_source',
        context: 'your_context'
      },
      handler: handler,
      feature: async () => {
        console.log('Feature callback executed');
        
        // Optional: Update user state after successful purchase
        await refreshUser();
        
        // Navigate to destination
        router.replace('/destination-route');
      }
    });
  } catch (error) {
    console.error('Error showing paywall:', error);
    setLoading(false);
    Alert.alert('Error', 'Failed to show subscription options');
    router.replace('/destination-route');
  }
};
```

## Best Practices

1. **Add Detailed Logging**: Include console logs to track the flow through different handlers
2. **Handle Errors Gracefully**: Always provide fallback navigation in error handlers
3. **Use try/catch**: Wrap the entire paywall presentation in try/catch for robust error handling
4. **Set Loading States**: Manage loading indicators appropriately in each handler
5. **Account for Edge Cases**: Ensure the user can always continue using the app, even if paywall presentation fails

By following these patterns, you can ensure proper handling of paywall dismissal and maintain a smooth user experience in your app. 