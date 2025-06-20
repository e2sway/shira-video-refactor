import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TouchableOpacity,
    SafeAreaView,
    StatusBar
} from 'react-native';
import Superwall from '@superwall/react-native-superwall';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from '@/supabase/supabaseClient'; // Assuming path alias setup

// --- Constants ---
const DARK_BACKGROUND = '#181818';
const PURPLE_PRIMARY = '#8E6CEF';
const PINK_ACCENT = '#ff66c4';

// --- Props Interface ---
interface PaywallViewProps {
  isVisible: boolean;
  onClose: () => void;
  placement: string;
  userId: string;
  userAttributes: { [key: string]: any };
  onPurchaseSuccess: () => Promise<void>; // Callback for successful purchase logic (e.g., DB update)
}

/**
 * PaywallView displays the Superwall paywall as a modal.
 * It handles the Superwall registration and callbacks.
 */
const PaywallView: React.FC<PaywallViewProps> = ({
  isVisible,
  onClose,
  placement,
  userId,
  userAttributes,
  onPurchaseSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(true); // Loading state for attribute setting/registration
  const [error, setError] = useState<string | null>(null);
  const [setupInitiated, setSetupInitiated] = useState(false); // Track if setup ran

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (isVisible) {
        // Only run setup if modal is visible AND setup hasn't run yet for this session
        if (!setupInitiated) {
            console.log('[PaywallView] isVisible is true and setup not initiated. Running setup.');
            setSetupInitiated(true); // Mark setup as initiated
            setIsLoading(true);      // Ensure loading state is active
            setError(null);

            // Introduce setTimeout like in the working PaywallScreen
            timerId = setTimeout(async () => {
                 console.log(`[PaywallView] Executing setup inside setTimeout for: ${placement}`);
                 try {
                    // Log the attributes just before setting them
                    console.log('[PaywallView] Attributes being passed:', JSON.stringify(userAttributes, null, 2));
        
                    // Set user attributes in Superwall
                    await Superwall.shared.setUserAttributes(userAttributes);
                    console.log('[PaywallView] User attributes set in Superwall');
        
                    // Register the placement
                    console.log(`[PaywallView] Registering paywall placement: ${placement}`);
                    Superwall.shared.register({
                      placement: placement,
                      feature: async () => {
                        console.log('[PaywallView] Feature callback triggered.');
                        try {
                          // Call the external success handler (e.g., trigger refreshUser)
                          await onPurchaseSuccess(); 
                        } catch (successHandlerError) {
                          console.error('[PaywallView] Error in onPurchaseSuccess handler:', successHandlerError);
                        } finally {
                            // Always close the modal after the feature block runs
                            onClose(); 
                        }
                      },
                      handler: {
                        onPresent: () => {
                            console.log('[PaywallView] Paywall presented');
                            setIsLoading(false); // Stop loading once paywall is shown
                        },
                        onDismiss: () => {
                            console.log('[PaywallView] Paywall dismissed');
                            onClose(); // Close modal
                        },
                        // @ts-expect-error Incorrect type definition for onError handler in SDK?
                        onError: (paywallError: Error) => {
                            console.error('[PaywallView] Error presenting paywall:', paywallError);
                            setError('Could not load subscription options. Please try again.');
                            setIsLoading(false); // Stop loading on error
                        },
                        onSkip: (reason: unknown) => {
                            console.log(`[PaywallView] Paywall skipped, reason: ${String(reason)}`);
                            onClose();
                        },
                      },
                    });
                    console.log('[PaywallView] Paywall registration initiated.');
                } catch (setupError) {
                    console.error('[PaywallView] Error setting attributes or registering inside setTimeout:', setupError);
                    setError('Failed to prepare subscription options.');
                    setIsLoading(false); // Stop loading on error during setup
                } 
                // Removed finally block for loading here, handled by onPresent/onError
            }, 500); // Delay like in PaywallScreen
        } else {
             console.log('[PaywallView] isVisible is true but setup already initiated. Skipping.');
        }
    } else {
        // Reset state when modal becomes hidden
        console.log('[PaywallView] isVisible is false. Resetting state.');
        setIsLoading(true); 
        setError(null);
        setSetupInitiated(false); // Reset flag for next time
    }

    // Cleanup function to clear timeout if component unmounts or visibility changes
    return () => {
        if (timerId) {
             clearTimeout(timerId);
        }
    };

  }, [isVisible, placement, userId, userAttributes, onPurchaseSuccess, onClose, setupInitiated]); // Added setupInitiated to dependencies

  const handleCloseOnError = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose} // Handle hardware back button on Android
    >
      <SafeAreaView style={styles.modalContainer}>
         <StatusBar barStyle="light-content" />
        {/* We render loading/error states, Superwall renders the actual paywall UI */}
        {isLoading && !error && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PURPLE_PRIMARY} />
            <Text style={styles.loadingText}>Loading options...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <FontAwesome name="exclamation-circle" size={50} color={PINK_ACCENT} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseOnError}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Paywall appears here presented by Superwall SDK */}
        {!isLoading && !error && (
             <View style={styles.waitingContainer} /> // Placeholder while waiting for Superwall UI
        )}
      </SafeAreaView>
    </Modal>
  );
};

// --- Styles (adapted from PaywallScreen) ---
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: DARK_BACKGROUND, // Can be semi-transparent: 'rgba(24, 24, 24, 0.9)'
    justifyContent: 'center',
    alignItems: 'center',
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
  closeButton: {
    backgroundColor: PURPLE_PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    minWidth: '60%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  waitingContainer: {
      flex: 1, // Takes up space but is transparent
  },
});

export default PaywallView; 