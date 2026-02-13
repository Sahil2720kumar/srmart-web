// ─── TYPES ────────────────────────────────────────────────────────────────────

export type DiscountType = "percentage" | "flat" | "bogo";

export type OfferType =
  | "discount"
  | "bogo"
  | "bundle"
  | "free_delivery"
  | "clearance"
  | "combo"
  | "flash_sale";

export type OfferApplicableTo = "all" | "category" | "vendor" | "product";

export interface OfferProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  sku?: string;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  discount: string;
  offer_type: OfferType;
  discount_type?: DiscountType;
  discount_value?: number;
  applicable_to: OfferApplicableTo;
  applicable_id?: string | null;
  item_count: number;
  min_purchase: number;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  banner_color: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OfferWithProducts extends Offer {
  products: OfferProduct[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const now = new Date();
const d = (n: number) =>
  new Date(now.getTime() + n * 86_400_000).toISOString();

export const MOCK_CATEGORIES = [
  { id: "345cd671-1dd8-4ef1-8a95-063bd30ae829", name: "Vegetables" },
  { id: "cat-fruits", name: "Fruits" },
  { id: "cat-dairy", name: "Dairy & Eggs" },
  { id: "cat-bakery", name: "Bakery" },
  { id: "cat-snacks", name: "Snacks & Beverages" },
];

export const MOCK_VENDORS = [
  { id: "13351d0c-f382-41bd-8490-3c3803b4eca6", name: "FreshMart Supplies" },
  { id: "ven-green", name: "GreenLeaf Organics" },
  { id: "ven-daily", name: "Daily Harvest Co." },
  { id: "ven-farm", name: "Farm Direct Ltd." },
];

export const MOCK_PRODUCTS: OfferProduct[] = [
  { id: "p1", name: "Fresh Spinach 500g", price: 45, image: "🥬", sku: "VEG-001" },
  { id: "p2", name: "Organic Tomatoes 1kg", price: 80, image: "🍅", sku: "VEG-002" },
  { id: "p3", name: "Baby Carrots 250g", price: 35, image: "🥕", sku: "VEG-003" },
  { id: "p4", name: "Bell Peppers Mix", price: 120, image: "🫑", sku: "VEG-004" },
  { id: "p5", name: "Cucumber Pack", price: 30, image: "🥒", sku: "VEG-005" },
  { id: "p6", name: "Broccoli Head", price: 65, image: "🥦", sku: "VEG-006" },
  { id: "p7", name: "Sweet Corn x4", price: 55, image: "🌽", sku: "VEG-007" },
  { id: "p8", name: "Avocado Pair", price: 140, image: "🥑", sku: "FRT-001" },
];

export const MOCK_OFFERS: OfferWithProducts[] = [
  {
    id: "o1",
    title: "Vegetable Fest",
    description: "Fresh vegetables at discounted prices. Stock up and save big.",
    tag: "HOT DEAL",
    discount: "20% OFF",
    offer_type: "discount",
    discount_type: "percentage",
    discount_value: 20,
    applicable_to: "category",
    applicable_id: "345cd671-1dd8-4ef1-8a95-063bd30ae829",
    item_count: 24,
    min_purchase: 150,
    start_date: d(0),
    end_date: d(7),
    is_active: true,
    banner_color: "#16a34a",
    display_order: 1,
    created_at: d(-3),
    updated_at: d(0),
    products: MOCK_PRODUCTS.slice(0, 3),
  },
  {
    id: "o2",
    title: "Top Vendor Deal",
    description: "Special discount from selected vendor.",
    tag: "VENDOR SPECIAL",
    discount: "₹100 OFF",
    offer_type: "discount",
    discount_type: "flat",
    discount_value: 100,
    applicable_to: "vendor",
    applicable_id: "13351d0c-f382-41bd-8490-3c3803b4eca6",
    item_count: 12,
    min_purchase: 500,
    start_date: d(0),
    end_date: d(5),
    is_active: true,
    banner_color: "#2563eb",
    display_order: 2,
    created_at: d(-1),
    updated_at: d(0),
    products: [],
  },
  {
    id: "o3",
    title: "Combo Deal",
    description: "Special combo offer on selected products.",
    tag: "COMBO",
    discount: "15% OFF",
    offer_type: "combo",
    discount_type: "percentage",
    discount_value: 15,
    applicable_to: "product",
    applicable_id: null,
    item_count: 6,
    min_purchase: 200,
    start_date: d(0),
    end_date: d(3),
    is_active: true,
    banner_color: "#7c3aed",
    display_order: 3,
    created_at: d(-5),
    updated_at: d(-1),
    products: MOCK_PRODUCTS.slice(3, 6),
  },
  {
    id: "o4",
    title: "Flash Sale Frenzy",
    description: "24-hour flash sale on all items — don't miss it!",
    tag: "FLASH",
    discount: "30% OFF",
    offer_type: "flash_sale",
    discount_type: "percentage",
    discount_value: 30,
    applicable_to: "all",
    applicable_id: null,
    item_count: 0,
    min_purchase: 0,
    start_date: d(2),
    end_date: d(3),
    is_active: true,
    banner_color: "#dc2626",
    display_order: 4,
    created_at: d(-2),
    updated_at: d(-1),
    products: [],
  },
  {
    id: "o5",
    title: "Free Delivery Weekend",
    description: "No delivery charges all weekend long.",
    tag: "FREE SHIP",
    discount: "FREE DELIVERY",
    offer_type: "free_delivery",
    discount_type: undefined,
    discount_value: 0,
    applicable_to: "all",
    applicable_id: null,
    item_count: 0,
    min_purchase: 100,
    start_date: d(-10),
    end_date: d(-3),
    is_active: false,
    banner_color: "#0891b2",
    display_order: 5,
    created_at: d(-15),
    updated_at: d(-10),
    products: [],
  },
  {
    id: "o6",
    title: "Clearance Bonanza",
    description: "End-of-season clearance on select items.",
    tag: "CLEARANCE",
    discount: "40% OFF",
    offer_type: "clearance",
    discount_type: "percentage",
    discount_value: 40,
    applicable_to: "category",
    applicable_id: "cat-bakery",
    item_count: 18,
    min_purchase: 0,
    start_date: d(-20),
    end_date: d(-1),
    is_active: false,
    banner_color: "#ea580c",
    display_order: 6,
    created_at: d(-25),
    updated_at: d(-20),
    products: [],
  },
];

// ─── DATE STATUS ─────────────────────────────────────────────────────────────

export type DateStatus = "running" | "upcoming" | "expired" | "inactive";

export function getDateStatus(offer: Offer): DateStatus {
  if (!offer.is_active) return "inactive";
  const now = new Date();
  const start = new Date(offer.start_date);
  const end = offer.end_date ? new Date(offer.end_date) : null;
  if (now < start) return "upcoming";
  if (!end || now <= end) return "running";
  return "expired";
}

export function formatDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildDiscountPreview(
  type?: DiscountType,
  value?: number
): string {
  if (!type || !value) return "";
  if (type === "percentage") return `${value}% OFF`;
  if (type === "flat") return `₹${value} OFF`;
  if (type === "bogo") return "Buy 1 Get 1";
  return "";
}