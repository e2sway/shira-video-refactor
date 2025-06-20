import React from 'react';
import { Stack } from 'expo-router';
import { OnboardingProvider } from './hooks/useOnboardingState';
import { StatusBar } from 'react-native';
import { colors } from './styles';

/**
 * Layout for the onboarding flow, setting up navigation and providing
 * the OnboardingProvider for state management across screens.
 */
export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
        {/* Define screens with specific options */}
        <Stack.Screen
          name="index"
          options={{
            // Initial screen with no animation
            animation: 'fade',
          }}
        />
        
        {/* Conversation preview modal in step 5 */}
        <Stack.Screen
          name="screens/ConversationPreviewModal"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
            freezeOnBlur: true,
          }}
        />
      </Stack>
    </OnboardingProvider>
  );
} 