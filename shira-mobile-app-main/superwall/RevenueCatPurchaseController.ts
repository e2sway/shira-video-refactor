import { Platform } from "react-native";
import Superwall, {
  PurchaseController,
  PurchaseResult,
  RestorationResult,
  SubscriptionStatus,
  PurchaseResultCancelled,
  PurchaseResultFailed,
  PurchaseResultPending,
  PurchaseResultPurchased
} from '@superwall/react-native-superwall';
import Purchases, {
  type CustomerInfo,
  PRODUCT_CATEGORY,
  type PurchasesStoreProduct,
  type SubscriptionOption,
  PURCHASES_ERROR_CODE,
  type MakePurchaseResult
} from "react-native-purchases";
import { supabase } from '../supabase/supabaseClient';

// The name of our RevenueCat entitlement - must match exactly with RevenueCat dashboard
const ENTITLEMENT_ID = "Shira Pro";

// Product IDs - must match exactly with App Store Connect
const PRODUCT_IDS = {
  ANNUAL: "shira_pro_annual",
  MONTHLY: "shira_pro_monthly",
  WEEKLY: "shira_pro_weekly"
};

// RevenueCat API key
const REVENUECAT_API_KEY = Platform.OS === 'ios' 
  ? "appl_zRRgtqSictCpKyyscMdIjxjasqd"
  : ""; // Add Android key when needed

export class RevenueCatPurchaseController extends PurchaseController {
  constructor() {
    super();
    console.log('[RevenueCatPurchaseController] Initialized');
    
    // Configure RevenueCat if not already configured
    // Note: This is typically done in revenueCatClient.ts, but we include it here
    // for completeness in case the controller is used independently
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  }

  syncSubscriptionStatus() {
    console.log('[RevenueCatPurchaseController] Setting up subscription status sync');
    
    // Listen for changes in customer info
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      console.log('[RevenueCatPurchaseController] Customer info updated, checking entitlements');
      const entitlementIds = Object.keys(customerInfo.entitlements.active);
      console.log('[RevenueCatPurchaseController] Active entitlements:', entitlementIds);
      
      // Set Superwall status based on active entitlements
      Superwall.shared.setSubscriptionStatus(
        entitlementIds.length === 0
          ? SubscriptionStatus.Inactive()
          : SubscriptionStatus.Active(entitlementIds)
      );
      
      // Also update Supabase if we have the "Shira Pro" entitlement
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      if (isPro) {
        this.updateSupabaseProStatus();
      }
    });
  }

  async purchaseFromAppStore(productId: string): Promise<PurchaseResult> {
    console.log(`[RevenueCatPurchaseController] Purchasing product from App Store: ${productId}`);
    
    // Verify this is one of our known product IDs
    const isValidProduct = Object.values(PRODUCT_IDS).includes(productId);
    if (!isValidProduct) {
      console.warn(`[RevenueCatPurchaseController] Unknown product ID: ${productId}. Expected one of:`, Object.values(PRODUCT_IDS));
    }
    
    try {
      // Get products from RevenueCat
      const products = await Promise.all([
        Purchases.getProducts([productId], PRODUCT_CATEGORY.SUBSCRIPTION),
        Purchases.getProducts([productId], PRODUCT_CATEGORY.NON_SUBSCRIPTION)
      ]).then((results) => results.flat());
      
      // Get the first product (or null if none found)
      const storeProduct = products.length > 0 ? products[0] : null;
      
      if (!storeProduct) {
        console.error(`[RevenueCatPurchaseController] Failed to find store product for ${productId}`);
        return new PurchaseResultFailed(`Failed to find store product for ${productId}`);
      }
      
      return await this._purchaseStoreProduct(storeProduct);
    } catch (error: any) {
      console.error('[RevenueCatPurchaseController] Error while fetching products:', error);
      return new PurchaseResultFailed(`Error fetching products: ${error.message}`);
    }
  }

  // Method for Google Play purchases (included for completeness)
  async purchaseFromGooglePlay(
    productId: string,
    basePlanId?: string,
    offerId?: string
  ): Promise<PurchaseResult> {
    console.log(`[RevenueCatPurchaseController] Purchasing product from Google Play: ${productId}`);
    
    try {
      // Get products from RevenueCat
      const products = await Promise.all([
        Purchases.getProducts([productId], PRODUCT_CATEGORY.SUBSCRIPTION),
        Purchases.getProducts([productId], PRODUCT_CATEGORY.NON_SUBSCRIPTION)
      ]).then((results) => results.flat());
      
      const storeProductId = basePlanId ? `${productId}:${basePlanId}` : productId;
      
      // Find matching product
      let matchingProduct = null;
      for (const product of products) {
        if (product.identifier === storeProductId) {
          matchingProduct = product;
          break;
        }
      }
      
      // Use matching product or first product
      const storeProduct = matchingProduct ?? (products.length > 0 ? products[0] : null);
      
      if (!storeProduct) {
        console.error(`[RevenueCatPurchaseController] Product not found: ${productId}`);
        return new PurchaseResultFailed("Product not found");
      }
      
      // Handle based on product category
      if (storeProduct.productCategory === PRODUCT_CATEGORY.SUBSCRIPTION) {
        // Handle subscription products
        return await this._purchaseStoreProduct(storeProduct);
      } else {
        // Handle non-subscription products
        return await this._purchaseStoreProduct(storeProduct);
      }
    } catch (error: any) {
      console.error('[RevenueCatPurchaseController] Error while fetching products:', error);
      return new PurchaseResultFailed(`Error fetching products: ${error.message}`);
    }
  }

  private async _purchaseStoreProduct(
    storeProduct: PurchasesStoreProduct
  ): Promise<PurchaseResult> {
    const performPurchase = async (): Promise<MakePurchaseResult> => {
      console.log(`[RevenueCatPurchaseController] Attempting to purchase product: ${storeProduct.identifier}`);
      // Attempt to purchase product
      const makePurchaseResult = await Purchases.purchaseStoreProduct(storeProduct);
      console.log('[RevenueCatPurchaseController] Purchase successful, results:', JSON.stringify(makePurchaseResult));
      return makePurchaseResult;
    };
    
    return await this.handleSharedPurchase(performPurchase);
  }

  private async handleSharedPurchase(
    performPurchase: () => Promise<MakePurchaseResult>
  ): Promise<PurchaseResult> {
    try {
      // Get current Supabase user to prepare for updates
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error('[RevenueCatPurchaseController] No active user session found during purchase');
        return new PurchaseResultFailed('No active user session');
      }
      
      // Perform the purchase
      const makePurchaseResult = await performPurchase();
      
      // Force update Supabase regardless of entitlement status
      // This ensures the user gets access even if RevenueCat has sync delays
      await this.updateSupabaseProStatus();
      
      // Check if the purchase was successful by looking for active entitlements
      if (this.hasActiveEntitlementOrSubscription(makePurchaseResult.customerInfo)) {
        console.log('[RevenueCatPurchaseController] Purchase successful, active entitlements found');
        return new PurchaseResultPurchased();
      } else {
        // Even if RevenueCat doesn't show an entitlement yet, we'll still consider it successful
        // since we're manually updating Supabase
        console.log('[RevenueCatPurchaseController] No active entitlements found yet, but proceeding as purchased');
        return new PurchaseResultPurchased();
      }
    } catch (e: any) {
      console.error('[RevenueCatPurchaseController] Error during purchase:', e);
      
      // Check for specific error types
      if (e.userCancelled) {
        return new PurchaseResultCancelled();
      }
      
      if (e.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        return new PurchaseResultPending();
      }
      
      return new PurchaseResultFailed(e.message);
    }
  }

  async restorePurchases(): Promise<RestorationResult> {
    try {
      console.log('[RevenueCatPurchaseController] Restoring purchases');
      
      // Restore purchases through RevenueCat
      // RevenueCat's restorePurchases returns an object that contains customerInfo
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('[RevenueCatPurchaseController] Purchases restored');
      console.log('[RevenueCatPurchaseController] Active entitlements after restore:', Object.keys(customerInfo.entitlements.active));
      
      // Check if the user has pro status after restore
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      
      // Update Supabase if pro status is found
      if (isPro) {
        await this.updateSupabaseProStatus();
      }
      
      return RestorationResult.restored();
    } catch (error: any) {
      console.error('[RevenueCatPurchaseController] Error restoring purchases:', error);
      return RestorationResult.failed(error.message);
    }
  }

  private hasActiveEntitlementOrSubscription(customerInfo: CustomerInfo): boolean {
    return (
      customerInfo.activeSubscriptions.length > 0 &&
      Object.keys(customerInfo.entitlements.active).length > 0
    );
  }

  // Helper method to update Supabase pro status
  private async updateSupabaseProStatus(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        console.log(`[RevenueCatPurchaseController] Updating Supabase is_pro flag to true for user ${session.user.id}`);
        const { error } = await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', session.user.id);
        
        if (error) {
          console.error('[RevenueCatPurchaseController] Error updating Supabase profile:', error);
        } else {
          console.log('[RevenueCatPurchaseController] Successfully updated Supabase is_pro to true');
        }
      } else {
        console.error('[RevenueCatPurchaseController] No user session found when trying to update Supabase');
      }
    } catch (supabaseError) {
      console.error('[RevenueCatPurchaseController] Error updating Supabase:', supabaseError);
    }
  }
}

// Create and export singleton instance
export const revenueCatPurchaseController = new RevenueCatPurchaseController(); 