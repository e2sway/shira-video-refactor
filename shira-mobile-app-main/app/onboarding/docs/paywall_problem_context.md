# Paywall Navigation and Status Update Context (Onboarding)

This document summarizes the debugging process related to the paywall behavior during the onboarding flow.

## Problem Description

1.  **Initial Blank Screen Issue:** After completing the signup process (`AccountCreationScreen.tsx`), navigating to the `PaywallScreen.tsx`, and then dismissing the paywall (without purchasing), the user encountered a blank screen instead of being navigated to the main app route (`/learn`).
2.  **Post-Purchase `is_pro` Status Issue:** When a user *completes* a purchase on the `PaywallScreen.tsx`, they are correctly navigated to `/learn`. However, their `is_pro` status (managed by the `useUser` hook) does not immediately reflect the purchase, showing `false` initially.

## Debugging Steps Taken

1.  **Initial Log Analysis:** Reviewed logs from the signup flow, identifying RevenueCat initialization, user identification with Google, and RevenueCat identification steps. Confirmed the user ID was being set correctly in RevenueCat during signup.
2.  **UUID Error Identification:** Upon app restart after signup (simulating the blank screen scenario), logs revealed a `22P02: invalid input syntax for type uuid: \"[object Object]"` error originating from the `useUser` hook when calling `updateUserStreak`.
3.  **UUID Error Fix:**
    *   Added detailed logging to `useUser.ts` (`handleUser` function) before the `updateUserStreak` call.
    *   Confirmed `profileData.id` was a string, indicating the error was inside `updateUserStreak`.
    *   Examined `shira_app/supabase/progressService.ts` and found `updateUserStreak` expected a `userId: string` but was being called with the entire `profileData` object in `useUser.ts`.
    *   Corrected the call in `useUser.ts` to pass `profileData.id`.
4.  **Blank Screen After Paywall Dismissal (Post-UUID Fix):** The blank screen persisted even after fixing the UUID error.
5.  **Paywall Navigation Logging:** Added detailed `DEBUG` logs to `PaywallScreen.tsx`:
    *   Inside Superwall handler callbacks (`onDismiss`, `onError`, `onSkip`).
    *   Within the `navigateToLearn` function (start, before `router.replace`, after `router.replace`, end).
6.  **Purchase Flow Test & Log Analysis:**
    *   User completed the signup and *purchased* the subscription via the paywall.
    *   Logs confirmed:
        *   Superwall's `feature` callback executed correctly after purchase.
        *   `navigateToLearn` was called and `router.replace('/learn')` executed successfully.
        *   The user landed on the `/learn` screen.
        *   The `useUser` hook ran, fetched the profile (`is_pro: false`).
        *   Crucially, the subsequent call to `checkSubscriptionStatus` (which uses `Purchases.getCustomerInfo()`) returned `isPro: false`.
        *   Because both the DB and the immediate RevenueCat check showed `false`, the Supabase profile was *not* updated to `is_pro: true`.

## Current Hypothesis

The primary remaining issue is a **timing delay**.

*   Superwall detects the purchase completion and triggers navigation almost instantly.
*   The `useUser` hook runs immediately upon navigation to `/learn`.
*   The call to `Purchases.getCustomerInfo()` within `useUser` happens *before* RevenueCat's backend has fully processed the purchase and updated the user's entitlements across its system.
*   Therefore, the check returns `false`, and the UI doesn't reflect the "Pro" status until a later refresh/check occurs.

## Potential Solutions Discussed

1.  **Update Supabase Directly from `PaywallScreen`:** Simpler but less robust.
2.  **Trigger Refresh in `PaywallScreen`:** Add delay post-navigation and trigger `refreshUser` (requires exposing `refreshUser` via context).
3.  **Retry/Delayed Check in `useUser`:** Complex client-side logic.
4.  **Rely on Webhooks (Backend):** Most robust long-term solution.
5.  **Manual Refresh:** User-initiated refresh action.
6.  **Remove Supabase `is_pro` Sync:** Rely solely on real-time RevenueCat checks in `useUser`. (Pros: Simpler, fixes immediate issue. Cons: Performance, offline usability, dependency on RC availability). 