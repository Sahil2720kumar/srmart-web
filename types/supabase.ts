// types/supabase.ts
import { Database } from './database.types'

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type CustomerAddress = Database['public']['Tables']['customer_addresses']['Row']
export type CustomerAddressInsert = Database['public']['Tables']['customer_addresses']['Insert']
export type CustomerAddressUpdate = Database['public']['Tables']['customer_addresses']['Update']

// ============================================================================
// VENDOR TYPES
// ============================================================================

export type Vendor = Database['public']['Tables']['vendors']['Row']
export type VendorInsert = Database['public']['Tables']['vendors']['Insert']
export type VendorUpdate = Database['public']['Tables']['vendors']['Update']

export type VendorBankDetails = Database['public']['Tables']['vendor_bank_details']['Row']
export type VendorBankDetailsInsert = Database['public']['Tables']['vendor_bank_details']['Insert']
export type VendorBankDetailsUpdate = Database['public']['Tables']['vendor_bank_details']['Update']

export type VendorPayout = Database['public']['Tables']['vendor_payouts']['Row']
export type VendorPayoutInsert = Database['public']['Tables']['vendor_payouts']['Insert']
export type VendorPayoutUpdate = Database['public']['Tables']['vendor_payouts']['Update']

// ============================================================================
// DELIVERY BOY TYPES
// ============================================================================

export type DeliveryBoy = Database['public']['Tables']['delivery_boys']['Row']
export type DeliveryBoyInsert = Database['public']['Tables']['delivery_boys']['Insert']
export type DeliveryBoyUpdate = Database['public']['Tables']['delivery_boys']['Update']

export type DeliveryBoyBankDetails = Database['public']['Tables']['delivery_boy_bank_details']['Row']
export type DeliveryBoyBankDetailsInsert = Database['public']['Tables']['delivery_boy_bank_details']['Insert']
export type DeliveryBoyBankDetailsUpdate = Database['public']['Tables']['delivery_boy_bank_details']['Update']

export type DeliveryVehicle = Database['public']['Tables']['delivery_vehicles']['Row']
export type DeliveryVehicleInsert = Database['public']['Tables']['delivery_vehicles']['Insert']
export type DeliveryVehicleUpdate = Database['public']['Tables']['delivery_vehicles']['Update']

export type DeliveryEarning = Database['public']['Tables']['delivery_earnings']['Row']
export type DeliveryEarningInsert = Database['public']['Tables']['delivery_earnings']['Insert']
export type DeliveryEarningUpdate = Database['public']['Tables']['delivery_earnings']['Update']

// ============================================================================
// PRODUCT & CATEGORY TYPES
// ============================================================================

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type SubCategory = Database['public']['Tables']['sub_categories']['Row']
export type SubCategoryInsert = Database['public']['Tables']['sub_categories']['Insert']
export type SubCategoryUpdate = Database['public']['Tables']['sub_categories']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ProductImage = Database['public']['Tables']['product_images']['Row']
export type ProductImageInsert = Database['public']['Tables']['product_images']['Insert']
export type ProductImageUpdate = Database['public']['Tables']['product_images']['Update']

// ============================================================================
// ORDER TYPES
// ============================================================================

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderGroup = Database['public']['Tables']['order_groups']['Row']
export type OrderGroupInsert = Database['public']['Tables']['order_groups']['Insert']
export type OrderGroupUpdate = Database['public']['Tables']['order_groups']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type OrderTracking = Database['public']['Tables']['order_tracking']['Row']
export type OrderTrackingInsert = Database['public']['Tables']['order_tracking']['Insert']
export type OrderTrackingUpdate = Database['public']['Tables']['order_tracking']['Update']

// ============================================================================
// CART & WISHLIST TYPES
// ============================================================================

export type Cart = Database['public']['Tables']['cart']['Row']
export type CartInsert = Database['public']['Tables']['cart']['Insert']
export type CartUpdate = Database['public']['Tables']['cart']['Update']

export type Wishlist = Database['public']['Tables']['wishlist']['Row']
export type WishlistInsert = Database['public']['Tables']['wishlist']['Insert']
export type WishlistUpdate = Database['public']['Tables']['wishlist']['Update']

// ============================================================================
// COUPON & OFFER TYPES
// ============================================================================

export type Coupon = Database['public']['Tables']['coupons']['Row']
export type CouponInsert = Database['public']['Tables']['coupons']['Insert']
export type CouponUpdate = Database['public']['Tables']['coupons']['Update']

export type CouponUsage = Database['public']['Tables']['coupon_usage']['Row']
export type CouponUsageInsert = Database['public']['Tables']['coupon_usage']['Insert']
export type CouponUsageUpdate = Database['public']['Tables']['coupon_usage']['Update']

export type Offer = Database['public']['Tables']['offers']['Row']
export type OfferInsert = Database['public']['Tables']['offers']['Insert']
export type OfferUpdate = Database['public']['Tables']['offers']['Update']

export type OfferProduct = Database['public']['Tables']['offer_products']['Row']
export type OfferProductInsert = Database['public']['Tables']['offer_products']['Insert']
export type OfferProductUpdate = Database['public']['Tables']['offer_products']['Update']

export type FlashSale = Database['public']['Tables']['flash_sales']['Row']
export type FlashSaleInsert = Database['public']['Tables']['flash_sales']['Insert']
export type FlashSaleUpdate = Database['public']['Tables']['flash_sales']['Update']

// ============================================================================
// PAYMENT & WALLET TYPES
// ============================================================================

export type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row']
export type PaymentTransactionInsert = Database['public']['Tables']['payment_transactions']['Insert']
export type PaymentTransactionUpdate = Database['public']['Tables']['payment_transactions']['Update']

export type Wallet = Database['public']['Tables']['wallets']['Row']
export type WalletInsert = Database['public']['Tables']['wallets']['Insert']
export type WalletUpdate = Database['public']['Tables']['wallets']['Update']

export type WalletTransaction = Database['public']['Tables']['wallet_transactions']['Row']
export type WalletTransactionInsert = Database['public']['Tables']['wallet_transactions']['Insert']
export type WalletTransactionUpdate = Database['public']['Tables']['wallet_transactions']['Update']

export type CashoutRequest = Database['public']['Tables']['cashout_requests']['Row']
export type CashoutRequestInsert = Database['public']['Tables']['cashout_requests']['Insert']
export type CashoutRequestUpdate = Database['public']['Tables']['cashout_requests']['Update']

// ============================================================================
// REVIEW & RATING TYPES
// ============================================================================

export type Review = Database['public']['Tables']['reviews']['Row']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']

// ============================================================================
// STOCK & INVENTORY TYPES
// ============================================================================

export type StockMovement = Database['public']['Tables']['stock_movements']['Row']
export type StockMovementInsert = Database['public']['Tables']['stock_movements']['Insert']
export type StockMovementUpdate = Database['public']['Tables']['stock_movements']['Update']

// ============================================================================
// KYC & DOCUMENT TYPES
// ============================================================================

export type KycDocument = Database['public']['Tables']['kyc_documents']['Row']
export type KycDocumentInsert = Database['public']['Tables']['kyc_documents']['Insert']
export type KycDocumentUpdate = Database['public']['Tables']['kyc_documents']['Update']

// ============================================================================
// SEARCH & ANALYTICS TYPES
// ============================================================================

export type RecentSearch = Database['public']['Tables']['recent_searches']['Row']
export type RecentSearchInsert = Database['public']['Tables']['recent_searches']['Insert']
export type RecentSearchUpdate = Database['public']['Tables']['recent_searches']['Update']

export type SearchAnalytics = Database['public']['Tables']['search_analytics']['Row']
export type SearchAnalyticsInsert = Database['public']['Tables']['search_analytics']['Insert']
export type SearchAnalyticsUpdate = Database['public']['Tables']['search_analytics']['Update']

export type SearchClick = Database['public']['Tables']['search_clicks']['Row']
export type SearchClickInsert = Database['public']['Tables']['search_clicks']['Insert']
export type SearchClickUpdate = Database['public']['Tables']['search_clicks']['Update']

export type TrendingSearchCache = Database['public']['Tables']['trending_searches_cache']['Row']
export type TrendingSearchCacheInsert = Database['public']['Tables']['trending_searches_cache']['Insert']
export type TrendingSearchCacheUpdate = Database['public']['Tables']['trending_searches_cache']['Update']

// ============================================================================
// SUPPORT & NOTIFICATION TYPES
// ============================================================================

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row']
export type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert']
export type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update']

export type TicketMessage = Database['public']['Tables']['ticket_messages']['Row']
export type TicketMessageInsert = Database['public']['Tables']['ticket_messages']['Insert']
export type TicketMessageUpdate = Database['public']['Tables']['ticket_messages']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

// ============================================================================
// VIEW TYPES
// ============================================================================

export type BestSellerProduct = Database['public']['Views']['v_best_seller_products']['Row']
export type LowStockProduct = Database['public']['Views']['v_low_stock_products']['Row']
export type TrendingProduct = Database['public']['Views']['v_trending_products']['Row']
export type OrderSummary = Database['public']['Views']['v_order_summary']['Row']
export type VendorPerformance = Database['public']['Views']['v_vendor_performance']['Row']
export type DailyRevenue = Database['public']['Views']['v_daily_revenue']['Row']
export type CommissionOverview = Database['public']['Views']['v_commission_overview']['Row']

// ============================================================================
// FUNCTION RETURN TYPES
// ============================================================================

export type WalletDetails = Database['public']['Functions']['get_wallet_details']['Returns'][number]
export type VendorInventory = Database['public']['Functions']['get_vendor_inventory']['Returns'][number]
export type TrendingSearches = Database['public']['Functions']['get_trending_searches']['Returns'][number]
export type RecentSearches = Database['public']['Functions']['get_recent_searches']['Returns'][number]
export type FreeDeliveryEligibility = Database['public']['Functions']['check_free_delivery_eligibility']['Returns'][number]

// Function argument types
export type CreateOrderGroupWithOrdersArgs = Database['public']['Functions']['create_order_group_with_orders']['Args']
export type CreateOrderGroupWithOrdersSimpleArgs = Database['public']['Functions']['create_order_group_with_orders_simple']['Args']
export type AssignDeliveryPartnerArgs = Database['public']['Functions']['assign_delivery_partner']['Args']
export type VendorAcceptOrderArgs = Database['public']['Functions']['vendor_accept_order']['Args']
export type VendorRejectOrderArgs = Database['public']['Functions']['vendor_reject_order']['Args']
export type MarkOrderReadyArgs = Database['public']['Functions']['mark_order_ready']['Args']
export type CustomerCancelOrderArgs = Database['public']['Functions']['customer_cancel_order']['Args']
export type UpdateProductStockArgs = Database['public']['Functions']['update_product_stock']['Args']
export type RequestCashoutArgs = Database['public']['Functions']['request_cashout']['Args']
export type ApproveCashoutArgs = Database['public']['Functions']['approve_cashout']['Args']
export type CompleteCashoutArgs = Database['public']['Functions']['complete_cashout']['Args']
export type CalculateCouponDiscountArgs = Database['public']['Functions']['calculate_coupon_discount']['Args']
export type CalculateDeliveryFeeArgs = Database['public']['Functions']['calculate_delivery_fee']['Args']
export type CalculateProductCommissionArgs = Database['public']['Functions']['calculate_product_commission']['Args']

// ============================================================================
// HELPER TYPES & UNIONS
// ============================================================================

// User role union type
export type UserRole = 'customer' | 'vendor' | 'delivery_boy' | 'admin'

export type VehicleType = 'bike' | 'scooter' | 'bicycle' | 'car' | 'van';

export type BankVerificationStatus =
  | 'not_added'
  | 'pending'
  | 'approved'
  | 'rejected';

export type BankAccountType = 'savings' | 'current';
export type WalletUserType = 'vendor' | 'delivery_boy';


export type CashoutRequestStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'transferred'
  | 'completed'
  | 'rejected'
  | 'cancelled';

// Order status union
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'all';

export type CancelledBy = 'customer' | 'vendor' | 'admin' | 'system';

export type OrderFilterStatus = OrderStatus | 'all' | 'active' | 'completed';

export type OrderGroupStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'partially_delivered'
  | 'delivered'
  | 'cancelled'
  | 'refunded';


export type PaymentMethod = 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// KYC status union
export type KycDocumentStatus =
  | 'not_uploaded'
  | 'pending'
  | 'verified'
  | 'approved'
  | 'rejected';

export type KycDocumentType =
  | 'aadhaar'
  | 'pan'
  | 'driving_license'
  | 'bank_passbook'
  | 'profile_photo';

// Stock status union
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

// Discount type union
export type DiscountType =
  | 'percentage'
  | 'flat'
  | 'bogo';

export type CouponApplicableTo = 'all' | 'category' | 'vendor' | 'product';

export type OfferApplicableTo =
  | 'all'
  | 'category'
  | 'vendor'
  | 'product';

export type OfferType =
  | 'discount'
  | 'bogo'
  | 'bundle'
  | 'free_delivery'
  | 'clearance'
  | 'combo'
  | 'flash_sale';

// Review type union
export type ReviewType = 'product' | 'vendor' | 'delivery'

// Transaction type union
export type TransactionType = 'credit' | 'debit' | 'refund' | 'withdrawal'

// Movement type union
export type MovementType = 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage'

// ============================================================================
// COMPOSITE TYPES FOR COMPLEX OPERATIONS
// ============================================================================

// Order creation payload
export type CreateOrderPayload = {
  customer_id: string
  vendor_id: string
  delivery_address_id: string
  payment_method: PaymentMethod
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
  coupon_code?: string
  special_instructions?: string
}

// Cart item with product details
export type CartItemWithProduct = Cart & {
  product: Product
  product_images?: ProductImage[]
}

// Order with relations
export type OrderWithRelations = Order & {
  customer?: Customer
  vendor?: Vendor
  delivery_boy?: DeliveryBoy | null
  order_items?: OrderItem[]
  order_tracking?: OrderTracking[]
  delivery_address?: CustomerAddress
}

// Product with relations
export type ProductWithRelations = Product & {
  category?: Category
  sub_category?: SubCategory | null
  vendor?: Vendor
  product_images?: ProductImage[]
  reviews?: Review[]
}

// Vendor with stats
export type VendorWithStats = Vendor & {
  total_products?: number
  total_orders?: number
  total_revenue?: number
  wallet?: Wallet
}

// Wallet with recent transactions
export type WalletWithTransactions = Wallet & {
  recent_transactions?: WalletTransaction[]
  pending_cashouts?: CashoutRequest[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  success: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================================
// FILTER & QUERY TYPES
// ============================================================================

export type ProductFilters = {
  category_id?: string
  sub_category_id?: string
  vendor_id?: string
  is_available?: boolean
  is_featured?: boolean
  is_trending?: boolean
  is_best_seller?: boolean
  min_price?: number
  max_price?: number
  search?: string
}

export type OrderFilters = {
  customer_id?: string
  vendor_id?: string
  delivery_boy_id?: string
  status?: OrderStatus
  payment_status?: PaymentStatus
  date_from?: string
  date_to?: string
}

export type VendorFilters = {
  is_verified?: boolean
  is_open?: boolean
  city?: string
  state?: string
  min_rating?: number
}