// hooks/query-keys.ts

/**
 * Query key factory for React Query
 * Provides consistent and type-safe query keys across the application
 */
export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    byAuth: (authId: string) => [...queryKeys.users.all, 'auth', authId] as const,
  },

  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.customers.all, 'user', userId] as const,
    addresses: (customerId: string) => [...queryKeys.customers.detail(customerId), 'addresses'] as const,
  },

  // Vendors
  vendors: {
    all: ['vendors'] as const,
    lists: () => [...queryKeys.vendors.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.vendors.lists(), filters] as const,
    details: () => [...queryKeys.vendors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vendors.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.vendors.all, 'user', userId] as const,
    bankDetails: (vendorId: string) => [...queryKeys.vendors.detail(vendorId), 'bank-details'] as const,
    performance: (vendorId: string) => [...queryKeys.vendors.detail(vendorId), 'performance'] as const,
    payouts: (vendorId: string) => [...queryKeys.vendors.detail(vendorId), 'payouts'] as const,
    inventory: (vendorId: string) => [...queryKeys.vendors.detail(vendorId), 'inventory'] as const,
  },

  // Delivery Boys
  deliveryBoys: {
    all: ['delivery-boys'] as const,
    lists: () => [...queryKeys.deliveryBoys.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.deliveryBoys.lists(), filters] as const,
    details: () => [...queryKeys.deliveryBoys.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.deliveryBoys.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.deliveryBoys.all, 'user', userId] as const,
    bankDetails: (deliveryBoyId: string) => [...queryKeys.deliveryBoys.detail(deliveryBoyId), 'bank-details'] as const,
    vehicle: (deliveryBoyId: string) => [...queryKeys.deliveryBoys.detail(deliveryBoyId), 'vehicle'] as const,
    earnings: (deliveryBoyId: string) => [...queryKeys.deliveryBoys.detail(deliveryBoyId), 'earnings'] as const,
    available: () => [...queryKeys.deliveryBoys.all, 'available'] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    byVendor: (vendorId: string) => [...queryKeys.products.all, 'vendor', vendorId] as const,
    byCategory: (categoryId: string) => [...queryKeys.products.all, 'category', categoryId] as const,
    bySubCategory: (subCategoryId: string) => [...queryKeys.products.all, 'sub-category', subCategoryId] as const,
    images: (productId: string) => [...queryKeys.products.detail(productId), 'images'] as const,
    reviews: (productId: string) => [...queryKeys.products.detail(productId), 'reviews'] as const,
    trending: () => [...queryKeys.products.all, 'trending'] as const,
    bestSellers: () => [...queryKeys.products.all, 'best-sellers'] as const,
    lowStock: () => [...queryKeys.products.all, 'low-stock'] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    active: () => [...queryKeys.categories.all, 'active'] as const,
    withProducts: (categoryId: string) => [...queryKeys.categories.detail(categoryId), 'products'] as const,
  },

  // Sub Categories
  subCategories: {
    all: ['sub-categories'] as const,
    lists: () => [...queryKeys.subCategories.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.subCategories.lists(), filters] as const,
    details: () => [...queryKeys.subCategories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.subCategories.details(), id] as const,
    byCategory: (categoryId: string) => [...queryKeys.subCategories.all, 'category', categoryId] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    byCustomer: (customerId: string) => [...queryKeys.orders.all, 'customer', customerId] as const,
    byVendor: (vendorId: string) => [...queryKeys.orders.all, 'vendor', vendorId] as const,
    byDeliveryBoy: (deliveryBoyId: string) => [...queryKeys.orders.all, 'delivery-boy', deliveryBoyId] as const,
    byGroup: (groupId: string) => [...queryKeys.orders.all, 'group', groupId] as const,
    items: (orderId: string) => [...queryKeys.orders.detail(orderId), 'items'] as const,
    tracking: (orderId: string) => [...queryKeys.orders.detail(orderId), 'tracking'] as const,
    summary: () => [...queryKeys.orders.all, 'summary'] as const,
  },

  // Order Groups
  orderGroups: {
    all: ['order-groups'] as const,
    lists: () => [...queryKeys.orderGroups.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.orderGroups.lists(), filters] as const,
    details: () => [...queryKeys.orderGroups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orderGroups.details(), id] as const,
    byCustomer: (customerId: string) => [...queryKeys.orderGroups.all, 'customer', customerId] as const,
  },

  // Cart
  cart: {
    all: ['cart'] as const,
    byCustomer: (customerId: string) => [...queryKeys.cart.all, 'customer', customerId] as const,
    count: (customerId: string) => [...queryKeys.cart.byCustomer(customerId), 'count'] as const,
  },

  // Wishlist
  wishlist: {
    all: ['wishlist'] as const,
    byCustomer: (customerId: string) => [...queryKeys.wishlist.all, 'customer', customerId] as const,
    count: (customerId: string) => [...queryKeys.wishlist.byCustomer(customerId), 'count'] as const,
  },

  // Coupons
  coupons: {
    all: ['coupons'] as const,
    lists: () => [...queryKeys.coupons.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.coupons.lists(), filters] as const,
    details: () => [...queryKeys.coupons.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.coupons.details(), id] as const,
    byCode: (code: string) => [...queryKeys.coupons.all, 'code', code] as const,
    active: () => [...queryKeys.coupons.all, 'active'] as const,
    usage: (couponId: string) => [...queryKeys.coupons.detail(couponId), 'usage'] as const,
  },

  // Offers
  offers: {
    all: ['offers'] as const,
    lists: () => [...queryKeys.offers.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.offers.lists(), filters] as const,
    details: () => [...queryKeys.offers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.offers.details(), id] as const,
    active: () => [...queryKeys.offers.all, 'active'] as const,
    products: (offerId: string) => [...queryKeys.offers.detail(offerId), 'products'] as const,
  },

  // Flash Sales
  flashSales: {
    all: ['flash-sales'] as const,
    lists: () => [...queryKeys.flashSales.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.flashSales.lists(), filters] as const,
    details: () => [...queryKeys.flashSales.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.flashSales.details(), id] as const,
    active: () => [...queryKeys.flashSales.all, 'active'] as const,
  },

  // Wallets
  wallets: {
    all: ['wallets'] as const,
    byUser: (userId: string) => [...queryKeys.wallets.all, 'user', userId] as const,
    transactions: (walletId: string) => [...queryKeys.wallets.all, 'transactions', walletId] as const,
    details: (userId: string) => [...queryKeys.wallets.all, 'details', userId] as const,
  },

  // Cashout Requests
  cashoutRequests: {
    all: ['cashout-requests'] as const,
    lists: () => [...queryKeys.cashoutRequests.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.cashoutRequests.lists(), filters] as const,
    details: () => [...queryKeys.cashoutRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cashoutRequests.details(), id] as const,
    byWallet: (walletId: string) => [...queryKeys.cashoutRequests.all, 'wallet', walletId] as const,
  },

  // Reviews
  reviews: {
    all: ['reviews'] as const,
    lists: () => [...queryKeys.reviews.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.reviews.lists(), filters] as const,
    details: () => [...queryKeys.reviews.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reviews.details(), id] as const,
    byProduct: (productId: string) => [...queryKeys.reviews.all, 'product', productId] as const,
    byVendor: (vendorId: string) => [...queryKeys.reviews.all, 'vendor', vendorId] as const,
    byDeliveryBoy: (deliveryBoyId: string) => [...queryKeys.reviews.all, 'delivery-boy', deliveryBoyId] as const,
    byCustomer: (customerId: string) => [...queryKeys.reviews.all, 'customer', customerId] as const,
  },

  // Stock Movements
  stockMovements: {
    all: ['stock-movements'] as const,
    byProduct: (productId: string) => [...queryKeys.stockMovements.all, 'product', productId] as const,
  },

  // KYC Documents
  kycDocuments: {
    all: ['kyc-documents'] as const,
    byUser: (userId: string, userType: string) => [...queryKeys.kycDocuments.all, 'user', userId, userType] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    byUser: (userId: string) => [...queryKeys.notifications.all, 'user', userId] as const,
    unread: (userId: string) => [...queryKeys.notifications.byUser(userId), 'unread'] as const,
    count: (userId: string) => [...queryKeys.notifications.byUser(userId), 'count'] as const,
  },

  // Support Tickets
  supportTickets: {
    all: ['support-tickets'] as const,
    lists: () => [...queryKeys.supportTickets.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.supportTickets.lists(), filters] as const,
    details: () => [...queryKeys.supportTickets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.supportTickets.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.supportTickets.all, 'user', userId] as const,
    messages: (ticketId: string) => [...queryKeys.supportTickets.detail(ticketId), 'messages'] as const,
  },

  // Search
  search: {
    all: ['search'] as const,
    recent: (customerId: string) => [...queryKeys.search.all, 'recent', customerId] as const,
    trending: () => [...queryKeys.search.all, 'trending'] as const,
    analytics: () => [...queryKeys.search.all, 'analytics'] as const,
  },

  // Analytics & Reports
  analytics: {
    all: ['analytics'] as const,
    dailyRevenue: (filters?: Record<string, any>) => [...queryKeys.analytics.all, 'daily-revenue', filters] as const,
    commissionOverview: () => [...queryKeys.analytics.all, 'commission-overview'] as const,
    vendorPerformance: (vendorId?: string) => [...queryKeys.analytics.all, 'vendor-performance', vendorId] as const,
  },
} as const;