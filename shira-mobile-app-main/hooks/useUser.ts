import { useEffect, useState, useCallback, useRef } from 'react';
import { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabaseClient';
import { Profile } from '../supabase/types';
import { updateUserStreak } from '../supabase/progressService';
import { identifyUser, resetUser, checkSubscriptionStatus, getCurrentRevenueCatUserId } from '../supabase/revenueCatClient';

// Extend the Supabase User type with our profile data
export interface User extends SupabaseUser {
    target_lang?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    current_streak?: number | null;
    daily_goal?: number | null;
    is_pro?: boolean | null;
    xp_level?: number | null;
    daily_videos_watched?: number | null;
    free_videos?: number | null;
}

// Throttle subscription status checks
const SUBSCRIPTION_CHECK_INTERVAL = 60000; // 1 minute

function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    // Add a refresh counter to trigger re-fetching
    const [refreshCounter, setRefreshCounter] = useState(0);
    
    // Use refs to avoid circular dependencies
    const userRef = useRef<User | null>(null);
    const lastSubscriptionCheckRef = useRef<number>(0);

    // Update the ref when user changes
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Function to refresh user data
    const refreshUser = useCallback(async () => {
        console.log('useUser: Manually refreshing user data');
        setLoading(true);
        setError(null); // Reset error on refresh
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // HandleUser now includes the sync logic
                await handleUser(session.user); 
                console.log('useUser: User data refreshed successfully');
            } else {
                console.log('useUser: No active session found during refresh');
                setUser(null); // Ensure user state is cleared
                await checkAndResetRevenueCatUser(); // Check if RC needs reset
            }
        } catch (refreshError: any) {
            console.error('useUser: Error refreshing user data:', refreshError);
            setError(refreshError); // Set error state
        } finally {
             setLoading(false);
        }
    }, []); // Removed handleUser from dependency array

    useEffect(() => {
        console.log('useUser: Setting up auth state listener');
        
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('useUser: Initial session check', {
                hasSession: !!session,
                userId: session?.user?.id
            });
            
            if (session?.user) {
                handleUser(session.user);
            } else {
                // Check if we need to reset RevenueCat user
                checkAndResetRevenueCatUser();
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('useUser: Auth state changed', {
                event: event,
                userId: session?.user?.id
            });
            
            if (session?.user) {
                if (event === 'SIGNED_IN') {
                    // User signed in, identify with RevenueCat
                    try {
                        await identifyUser(session.user.id);
                        console.log('useUser: User identified with RevenueCat after sign in:', session.user.id);
                    } catch (rcError) {
                        console.error('useUser: Error identifying user with RevenueCat after sign in:', rcError);
                    }
                }
                
                handleUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                // User signed out, reset RevenueCat user
                try {
                    await resetUser();
                    console.log('useUser: User logged out from RevenueCat after sign out');
                } catch (rcError) {
                    console.error('useUser: Error logging out user from RevenueCat after sign out:', rcError);
                }
                
                setUser(null);
                setLoading(false);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            console.log('useUser: Cleaning up auth listener');
            subscription.unsubscribe();
        };
    }, []); // Changed dependency back to empty array for initial setup

    // Check if we need to reset RevenueCat user
    async function checkAndResetRevenueCatUser() {
        try {
            const rcUserId = await getCurrentRevenueCatUserId();
            
            // If there's a RevenueCat user ID but no Supabase session, reset RevenueCat
            if (rcUserId && !rcUserId.startsWith('$RCAnonymousID:')) {
                console.log('useUser: Found identified RevenueCat user but no Supabase session, resetting RevenueCat user');
                await resetUser();
            }
        } catch (error) {
            console.error('useUser: Error checking RevenueCat user:', error);
        }
    }

    // Main function to handle user authentication and profile fetching/syncing
    async function handleUser(authUser: SupabaseUser) {
        console.log('[handleUser] Processing user:', authUser.id);
        // Don't set loading here, let refreshUser control it

        try {
            // Ensure user is identified with RevenueCat
            try {
                console.log('[handleUser] Identifying user with RevenueCat:', authUser.id);
                await identifyUser(authUser.id);
                console.log('[handleUser] User identified successfully.');
            } catch (rcError) {
                console.error('[handleUser] Error identifying user with RevenueCat:', rcError);
                // Continue, but profile sync might be inaccurate if identification failed
            }
            
            // 1. Fetch profile data from Supabase
            console.log('[handleUser] Fetching profile from Supabase...');
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError) {
                console.error('[handleUser] Error fetching profile:', profileError);
                // If profile doesn't exist, maybe create it? For now, throw error.
                // Consider creating a default profile if error is specifically 'PGRST116' (0 rows)
                throw profileError; 
            }
            if (!profileData) {
                 throw new Error('Profile data not found for user.');
            }

            console.log('[handleUser] Profile fetched:', { is_pro: profileData.is_pro });

            // 2. Check subscription status with RevenueCat (throttled)
            let revenueCatIsPro = false; // Default to false
            const now = Date.now();
            // Check immediately if user is not marked as pro in DB, otherwise throttle
            if (!profileData.is_pro || now - lastSubscriptionCheckRef.current > SUBSCRIPTION_CHECK_INTERVAL) {
                console.log(`[handleUser] Checking RevenueCat status (DB is_pro: ${profileData.is_pro}, Throttled: ${now - lastSubscriptionCheckRef.current <= SUBSCRIPTION_CHECK_INTERVAL})...`);
                lastSubscriptionCheckRef.current = now;
                try {
                    const { isPro } = await checkSubscriptionStatus();
                    revenueCatIsPro = isPro;
                    console.log('[handleUser] RevenueCat status check result:', { isPro });
                } catch (rcStatusError) {
                    console.error('[handleUser] Error checking RevenueCat status:', rcStatusError);
                    // Proceed using Supabase status, but log the error
                    revenueCatIsPro = profileData.is_pro || false; // Fallback to DB status on error
                }
            } else {
                 console.log('[handleUser] Skipping throttled RevenueCat status check.');
                 revenueCatIsPro = profileData.is_pro || false; // Use DB status if throttled
            }

            // 3. Compare and Sync Supabase if needed
            let finalIsPro = profileData.is_pro || false;
            if (revenueCatIsPro !== finalIsPro) {
                console.log(`[handleUser] Discrepancy found! RC isPro: ${revenueCatIsPro}, DB is_pro: ${finalIsPro}. Updating DB.`);
                try {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ is_pro: revenueCatIsPro })
                        .eq('id', authUser.id);
                    
                    if (updateError) {
                        console.error('[handleUser] Error updating Supabase is_pro status:', updateError);
                        // Keep using the potentially stale DB value if update fails
                    } else {
                        console.log('[handleUser] Supabase is_pro status synced successfully.');
                        finalIsPro = revenueCatIsPro; // Update the status used for the state
                    }
                } catch (syncError) {
                     console.error('[handleUser] Exception during Supabase is_pro sync:', syncError);
                }
            }

            // 4. Update user streak (keep existing logic)
            console.log(`[handleUser] Preparing to update streak. Profile ID type: ${typeof profileData.id}, Value: ${profileData.id}`); // Added detailed log
            const updatedStreakValue = await updateUserStreak(profileData.id);

            // 5. Construct final user state
            const finalUser: User = {
                ...authUser,
                target_lang: profileData.target_lang,
                display_name: profileData.display_name,
                avatar_url: profileData.avatar_url,
                current_streak: updatedStreakValue, // Use the returned streak value
                daily_goal: profileData.daily_goal,
                is_pro: finalIsPro, // Use the potentially synced value
                xp_level: profileData.xp_level,
                daily_videos_watched: profileData.daily_videos_watched,
                free_videos: profileData.free_videos
            };

            console.log('[handleUser] Setting final user state:', { is_pro: finalUser.is_pro, current_streak: finalUser.current_streak }); // Log streak too
            setUser(finalUser);
            setError(null); // Clear any previous errors

        } catch (handleError: any) {
            console.error('useUser: Error in handleUser:', handleError);
            setError(handleError);
            setUser(null); // Clear user state on error
        } finally {
             // Ensure loading is false after handling user, only if refreshUser isn't managing it
             // setLoading(false); // Moved loading control entirely to refreshUser
        }
    }

    return { user, loading, error, refreshUser };
}

export default useUser; 