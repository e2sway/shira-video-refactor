# Superwall Client Documentation

## Overview

The `superwallClient.ts` file provides a wrapper around the Superwall SDK to integrate paywalls into the Shira app. It handles initialization, user synchronization, and paywall presentation, making it easy to show paywalls at specific points in the app's onboarding flow.

## Main Features

- **Initialization**: Configures the Superwall SDK with the app's API key
- **User Management**: Syncs the current Supabase user with Superwall
- **Paywall Presentation**: Shows paywalls tied to specific placement events
- **State Management**: Tracks initialization state and provides helper functions

## API Reference

### `initializeSuperwall()`

Initializes the Superwall SDK with the configured API key.

```typescript
async function initializeSuperwall(): Promise<boolean>
```

**Returns:** A Promise resolving to `true` if initialization was successful, `false` otherwise.

**Example:**
```typescript
import { initializeSuperwall } from '../superwall/superwallClient';

// Initialize Superwall when the app starts
useEffect(() => {
  initializeSuperwall();
}, []);
```

### `syncUserWithSuperwall()`

Syncs the current Supabase user with Superwall, ensuring that the user's attributes are available for targeting and personalization.

```typescript
async function syncUserWithSuperwall(): Promise<boolean>
```

**Returns:** A Promise resolving to `true` if the user was synced successfully, `false` otherwise.

**Example:**
```typescript
import { syncUserWithSuperwall } from '../superwall/superwallClient';

// Sync user after successful login
const handleLoginSuccess = async () => {
  await syncUserWithSuperwall();
};
```

### `presentPaywall()`

Presents a paywall for a specific placement.

```typescript
async function presentPaywall(
  placementName: string = 'onboarding_complete',
  params: Record<string, any> = {}
): Promise<boolean>
```

**Parameters:**
- `placementName` (string): The identifier/name of the placement to show a paywall for
- `params` (Record<string, any>): Additional parameters to pass to the paywall

**Returns:** A Promise resolving to `true` if the paywall was presented, `false` otherwise.

**Example:**
```typescript
import { presentPaywall } from '../superwall/superwallClient';

// Show a paywall at the end of onboarding
const showOnboardingPaywall = async () => {
  const didPresent = await presentPaywall('onboarding_complete', {
    userLanguage: 'en',
    userGoal: 'language_learning'
  });
  
  if (didPresent) {
    console.log('Paywall presented successfully');
  }
};
```

### `isSuperwallInitialized()`

Checks if Superwall has been initialized.

```typescript
function isSuperwallInitialized(): boolean
```

**Returns:** `true` if Superwall is initialized, `false` otherwise.

**Example:**
```typescript
import { isSuperwallInitialized } from '../superwall/superwallClient';

// Check before showing a paywall
if (isSuperwallInitialized()) {
  // Safe to present paywall
} else {
  // Need to initialize first
  await initializeSuperwall();
}
```

### `resetSuperwallState()`

Resets the Superwall state, typically used during logout.

```typescript
async function resetSuperwallState(): Promise<boolean>
```

**Returns:** A Promise resolving to `true` if the state was reset successfully, `false` otherwise.

**Example:**
```typescript
import { resetSuperwallState } from '../superwall/superwallClient';

// Reset state during logout
const handleLogout = async () => {
  await resetSuperwallState();
};
```

### `checkForPaywalls()`

Checks for paywalls that need to be shown based on the user's status.

```typescript
async function checkForPaywalls(): Promise<void>
```

**Example:**
```typescript
import { checkForPaywalls } from '../superwall/superwallClient';

// Check for paywalls after app initialization
useEffect(() => {
  checkForPaywalls();
}, []);
```

## Integration with Onboarding Flow

To integrate the Superwall client with the app's onboarding flow, you should:

1. Initialize Superwall in your app's entry point or during the onboarding flow
2. Sync the user after account creation
3. Show a paywall at the end of the onboarding process by triggering the `onboarding_complete` placement

```typescript
// In your onboarding flow
import { initializeSuperwall, syncUserWithSuperwall, presentPaywall } from '../superwall/superwallClient';
import { useRouter } from 'expo-router';

export function OnboardingFlow() {
  const router = useRouter();
  
  // Initialize when component mounts
  useEffect(() => {
    initializeSuperwall();
  }, []);
  
  // After user creates account
  const handleAccountCreated = async (userId) => {
    await syncUserWithSuperwall();
    
    // Show paywall
    const result = await presentPaywall('onboarding_complete', {
      // Add any relevant user data for targeting
    });
    
    // Navigate to app's main screen whether user subscribed or not
    router.replace('/learn');
  };
  
  // Rest of component...
}
```

## Technical Notes

- The client handles initialization state tracking using AsyncStorage to persist initialization status.
- User synchronization is done by mapping Supabase user attributes to Superwall user attributes.
- The paywall presentation includes handlers for presentation, dismissal, errors, and skips.
- RevenueCat is integrated for subscription status management via the `identifyUser()` function.

## Troubleshooting

If you encounter issues with the Superwall integration:

1. Check that the API key is correctly configured in the client
2. Ensure that the user is properly synced before showing a paywall
3. Verify that the placement names match those created in the Superwall dashboard
4. Look for error messages in the console logs from the handler callbacks

## Superwall Dashboard Configuration

To work with this client, you'll need to configure the following in the Superwall dashboard:

1. Create a campaign for the `onboarding_complete` placement
2. Design the paywall in the Superwall editor
3. Configure the products to match those set up in RevenueCat
4. Set up appropriate audience targeting rules if needed

## Resources

- [Superwall Documentation](https://superwall.com/docs)
- [React Native SDK Documentation](https://superwall.com/docs/installation-via-package) 