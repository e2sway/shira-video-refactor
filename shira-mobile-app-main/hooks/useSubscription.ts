import { useState, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { supabase } from '../supabase/supabaseClient';

// Must match with RevenueCat dashboard
const ENTITLEMENT_ID = "Shira Pro";

export function useSubscription() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const checkSubscriptionStatus = async () => {
    setLoading(true);
    try {
      // Check both RevenueCat and Supabase for subscription status
      const [revenueCatStatus, supabaseStatus] = await Promise.all([
        checkRevenueCatStatus(),
        checkSupabaseStatus()
      ]);
      
      // User is Pro if either system says they are
      // This provides more reliability in case of sync issues
      const userIsPro = revenueCatStatus || supabaseStatus;
      console.log(`[useSubscription] Status check: RevenueCat=${revenueCatStatus}, Supabase=${supabaseStatus}, Final=${userIsPro}`);
      setIsPro(userIsPro);
    } catch (error) {
      console.error('[useSubscription] Error checking subscription status:', error);
      // Default to false on errors
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  };
  
  const checkRevenueCatStatus = async () => {
    try {
      console.log('[useSubscription] Checking RevenueCat subscription status');
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      console.log(`[useSubscription] RevenueCat status: ${hasPro ? 'PRO' : 'NOT PRO'}`);
      return hasPro;
    } catch (error) {
      console.error('[useSubscription] Error checking RevenueCat status:', error);
      return false;
    }
  };
  
  const checkSupabaseStatus = async () => {
    try {
      console.log('[useSubscription] Checking Supabase subscription status');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log('[useSubscription] No Supabase session found');
        return false;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error('[useSubscription] Supabase error:', error);
        return false;
      }
      
      console.log(`[useSubscription] Supabase status: ${data?.is_pro ? 'PRO' : 'NOT PRO'}`);
      return !!data?.is_pro;
    } catch (error) {
      console.error('[useSubscription] Error checking Supabase status:', error);
      return false;
    }
  };
  
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);
  
  return {
    isPro,
    loading,
    refreshStatus: checkSubscriptionStatus
  };
} 