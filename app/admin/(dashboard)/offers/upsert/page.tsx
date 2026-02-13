"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Types matching public.offers schema ─────────────────────────────────────

type OfferType =
  | "discount"
  | "bogo"
  | "bundle"
  | "free_delivery"
  | "clearance"
  | "combo"
  | "flash_sale";

type DiscountType = "percentage" | "flat" | "bogo";

type OfferApplicableTo = "all" | "category" | "vendor" | "product";

/**
 * Matches exactly the columns in public.offers:
 *   title, description, discount, offer_type, discount_type,
 *   discount_value, applicable_to, applicable_id, start_date, end_date
 *
 * `discount` is a derived display string (e.g. "20% OFF", "₹100 OFF").
 * It is computed from discount_type + discount_value before saving.
 */
interface OfferFormState {
  // Basic
  title: string;
  description: string;

  // Offer config — maps to offer_type, discount_type, discount_value
  offer_type: OfferType;
  discount_type: DiscountType | "";
  discount_value: number | "";

  // Scope — maps to applicable_to, applicable_id (single UUID or null)
  applicable_to: OfferApplicableTo;
  applicable_id: string; // "" means null in DB

  // If applicable_to = "product" we also manage a join table.
  // selected_product_ids holds those IDs locally.
  selected_product_ids: string[];

  // Conditions
  min_purchase: number | "";
  start_date: string; // datetime-local string
  end_date: string;   // datetime-local string, "" = no expiry (NULL in DB)
}

type FormErrors = Partial<Record<keyof OfferFormState, string>>;

// ─── Mock reference data ─────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "345cd671-1dd8-4ef1-8a95-063bd30ae829", name: "Vegetables" },
  { id: "cat-fruits", name: "Fruits" },
  { id: "cat-dairy", name: "Dairy & Eggs" },
  { id: "cat-bakery", name: "Bakery" },
  { id: "cat-snacks", name: "Snacks & Beverages" },
];

const VENDORS = [
  { id: "13351d0c-f382-41bd-8490-3c3803b4eca6", name: "FreshMart Supplies" },
  { id: "ven-green", name: "GreenLeaf Organics" },
  { id: "ven-daily", name: "Daily Harvest Co." },
  { id: "ven-farm", name: "Farm Direct Ltd." },
];

const PRODUCTS = [
  { id: "p1", name: "Fresh Spinach 500g", price: 45, image: "🥬", sku: "VEG-001" },
  { id: "p2", name: "Organic Tomatoes 1kg", price: 80, image: "🍅", sku: "VEG-002" },
  { id: "p3", name: "Baby Carrots 250g", price: 35, image: "🥕", sku: "VEG-003" },
  { id: "p4", name: "Bell Peppers Mix", price: 120, image: "🫑", sku: "VEG-004" },
  { id: "p5", name: "Cucumber Pack", price: 30, image: "🥒", sku: "VEG-005" },
  { id: "p6", name: "Broccoli Head", price: 65, image: "🥦", sku: "VEG-006" },
  { id: "p7", name: "Sweet Corn x4", price: 55, image: "🌽", sku: "VEG-007" },
  { id: "p8", name: "Avocado Pair", price: 140, image: "🥑", sku: "FRT-001" },
];

// ─── Seed data matching the 3 SQL inserts ────────────────────────────────────

const MOCK_OFFERS: Array<OfferFormState & { id: string }> = [
  {
    id: "o1",
    title: "Vegetable Fest",
    description: "Fresh vegetables at discounted prices",
    offer_type: "discount",
    discount_type: "percentage",
    discount_value: 20,
    applicable_to: "category",
    applicable_id: "345cd671-1dd8-4ef1-8a95-063bd30ae829",
    selected_product_ids: [],
    min_purchase: "",
    start_date: toLocalDT(new Date().toISOString()),
    end_date: toLocalDT(new Date(Date.now() + 7 * 86400000).toISOString()),
  },
  {
    id: "o2",
    title: "Top Vendor Deal",
    description: "Special discount from selected vendor",
    offer_type: "discount",
    discount_type: "flat",
    discount_value: 100,
    applicable_to: "vendor",
    applicable_id: "13351d0c-f382-41bd-8490-3c3803b4eca6",
    selected_product_ids: [],
    min_purchase: "",
    start_date: toLocalDT(new Date().toISOString()),
    end_date: toLocalDT(new Date(Date.now() + 5 * 86400000).toISOString()),
  },
  {
    id: "o3",
    title: "Combo Deal",
    description: "Special combo offer on selected products",
    offer_type: "combo",
    discount_type: "percentage",
    discount_value: 15,
    applicable_to: "product",
    applicable_id: "",           // NULL in DB — products are in the join table
    selected_product_ids: ["p4", "p5", "p6"],
    min_purchase: "",
    start_date: toLocalDT(new Date().toISOString()),
    end_date: toLocalDT(new Date(Date.now() + 3 * 86400000).toISOString()),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDT(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

/**
 * Builds the `discount` display string stored in public.offers.discount.
 * Mirrors the DB values from the SQL inserts ("20% OFF", "₹100 OFF", "15% OFF").
 */
function buildDiscount(type: DiscountType | "", value: number | ""): string {
  if (!type || value === "") return "";
  if (type === "percentage") return `${value}% OFF`;
  if (type === "flat") return `₹${value} OFF`;
  if (type === "bogo") return "Buy 1 Get 1";
  return "";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const offerToEdit = editId ? MOCK_OFFERS.find((o) => o.id === editId) : undefined;
  const isEdit = !!offerToEdit;

  const defaultStart = toLocalDT(new Date().toISOString());

  const [form, setForm] = useState<OfferFormState>({
    title:                offerToEdit?.title ?? "",
    description:          offerToEdit?.description ?? "",
    offer_type:           offerToEdit?.offer_type ?? "discount",
    discount_type:        offerToEdit?.discount_type ?? "percentage",
    discount_value:       offerToEdit?.discount_value ?? "",
    applicable_to:        offerToEdit?.applicable_to ?? "all",
    applicable_id:        offerToEdit?.applicable_id ?? "",
    selected_product_ids: offerToEdit?.selected_product_ids ?? [],
    min_purchase:         offerToEdit?.min_purchase ?? "",
    start_date:           offerToEdit?.start_date ?? defaultStart,
    end_date:             offerToEdit?.end_date ?? "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof OfferFormState>(key: K, value: OfferFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Discount fields are only shown for offer types that support them
  const showDiscountFields = ["discount", "flash_sale", "combo", "bundle", "clearance", "bogo"].includes(form.offer_type);
  const showDiscountValue  = showDiscountFields && form.discount_type && form.discount_type !== "bogo";

  const discountPreview = useMemo(
    () => buildDiscount(form.discount_type, form.discount_value),
    [form.discount_type, form.discount_value]
  );

  // What to show in the applicable_id picker
  const scopeOptions = useMemo(() => {
    if (form.applicable_to === "category") return CATEGORIES;
    if (form.applicable_to === "vendor")   return VENDORS;
    return [];
  }, [form.applicable_to]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim())
      e.title = "Title is required";
    if (!form.start_date)
      e.start_date = "Start date is required";
    if (form.end_date && form.end_date <= form.start_date)
      e.end_date = "End date must be after start date";
    if (showDiscountValue && form.discount_value === "")
      e.discount_value = "Discount value is required";
    if ((form.applicable_to === "category" || form.applicable_to === "vendor") && !form.applicable_id)
      e.applicable_id = "Please select one";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /**
   * Builds the payload that maps 1-to-1 with the public.offers INSERT columns:
   *   title, description, discount, offer_type, discount_type,
   *   discount_value, applicable_to, applicable_id, start_date, end_date
   */
  const buildPayload = () => ({
    title:          form.title.trim(),
    description:    form.description.trim() || null,
    discount:       discountPreview || null,           // e.g. "20% OFF"
    offer_type:     form.offer_type,                   // e.g. "discount"
    discount_type:  form.discount_type || null,        // e.g. "percentage"
    discount_value: form.discount_value !== "" ? Number(form.discount_value) : null,  // e.g. 20
    applicable_to:  form.applicable_to,                // e.g. "category"
    applicable_id:  form.applicable_id || null,        // UUID or null
    start_date:     form.start_date ? new Date(form.start_date).toISOString() : null,
    end_date:       form.end_date   ? new Date(form.end_date).toISOString()   : null,
    // If applicable_to = "product", selected_product_ids go to a join table (offer_products)
    ...(form.applicable_to === "product" && {
      _product_ids: form.selected_product_ids,
    }),
  });

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = buildPayload();
    console.log("→ INSERT/UPDATE public.offers", payload);
    // TODO: await supabase.from("offers").upsert(payload)
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/admin/offers"), 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/offers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit Offer" : "Create Offer"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEdit
                ? `Editing: ${offerToEdit?.title}`
                : "Set up a new promotional campaign"}
            </p>
          </div>
        </div>

        {/* ── Section 1: Basic Info ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Basic Information</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className=" space-y-4">
            <div className="grid gap-4 md:grid-cols-2">

              {/* title */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Vegetable Fest"
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              {/* description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the offer..."
                  className="resize-none h-20"
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Offer Configuration ───────────────────────── */}
        {/* Maps to: offer_type, discount_type, discount_value, discount */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Offer Configuration</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className=" space-y-4">
            <div className="grid gap-4 md:grid-cols-2">

              {/* offer_type */}
              <div className="space-y-2">
                <Label>
                  Offer Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.offer_type}
                  onValueChange={(v) => {
                    set("offer_type", v as OfferType);
                    // Reset discount fields when switching to free_delivery
                    if (v === "free_delivery") {
                      set("discount_type", "");
                      set("discount_value", "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="bogo">BOGO</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="free_delivery">Free Delivery</SelectItem>
                    <SelectItem value="clearance">Clearance</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="flash_sale">Flash Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* discount_type — only shown when offer type supports it */}
              {showDiscountFields && (
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={form.discount_type || ""}
                    onValueChange={(v) => set("discount_type", v as DiscountType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                      <SelectItem value="bogo">BOGO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* discount_value — only shown when type is percentage or flat */}
              {showDiscountValue && (
                <div className="space-y-2">
                  <Label>
                    Discount Value{" "}
                    <span className="text-muted-foreground font-normal">
                      ({form.discount_type === "percentage" ? "%" : "₹"})
                    </span>{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                        {form.discount_type === "percentage" ? "%" : "₹"}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={form.discount_type === "percentage" ? 100 : undefined}
                        value={form.discount_value}
                        onChange={(e) =>
                          set(
                            "discount_value",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className={`pl-8 font-mono ${errors.discount_value ? "border-destructive" : ""}`}
                      />
                    </div>
                    {/* Live preview of the `discount` column value */}
                    {discountPreview && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-mono whitespace-nowrap">
                        {discountPreview}
                      </Badge>
                    )}
                  </div>
                  {errors.discount_value && (
                    <p className="text-xs text-destructive">{errors.discount_value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Stored as <code className="font-mono bg-muted px-1 rounded text-xs">{discountPreview || "…"}</code> in the{" "}
                    <code className="font-mono bg-muted px-1 rounded text-xs">discount</code> column
                  </p>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Applicable To ──────────────────────────────── */}
        {/* Maps to: applicable_to, applicable_id */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Applicable To</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className=" space-y-4">

            {/* applicable_to */}
            <div className="space-y-2">
              <Label>
                Scope <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.applicable_to}
                onValueChange={(v) => {
                  set("applicable_to", v as OfferApplicableTo);
                  set("applicable_id", "");
                  set("selected_product_ids", []);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* applicable_id — single select for category / vendor */}
            {(form.applicable_to === "category" || form.applicable_to === "vendor") && (
              <div className="space-y-2">
                <Label>
                  Select {form.applicable_to === "category" ? "Category" : "Vendor"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.applicable_id}
                  onValueChange={(v) => set("applicable_id", v)}
                >
                  <SelectTrigger className={errors.applicable_id ? "border-destructive" : ""}>
                    <SelectValue
                      placeholder={`Choose a ${form.applicable_to === "category" ? "category" : "vendor"}…`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.applicable_id && (
                  <p className="text-xs text-destructive">{errors.applicable_id}</p>
                )}
                {form.applicable_id && (
                  <p className="text-xs text-muted-foreground">
                    Stored as{" "}
                    <code className="font-mono bg-muted px-1 rounded text-xs">
                      {form.applicable_id}
                    </code>{" "}
                    in{" "}
                    <code className="font-mono bg-muted px-1 rounded text-xs">
                      applicable_id
                    </code>
                  </p>
                )}
              </div>
            )}

            {/* applicable_to = "product" → applicable_id is NULL, products go to join table */}
            {form.applicable_to === "product" && (
              <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded-md px-3 py-2">
                <code className="font-mono">applicable_id</code> will be{" "}
                <code className="font-mono">NULL</code>. Selected products are stored
                in the <code className="font-mono">offer_products</code> join table.
              </p>
            )}

            {/* applicable_to = "all" → no applicable_id */}
            {form.applicable_to === "all" && (
              <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded-md px-3 py-2">
                <code className="font-mono">applicable_id</code> will be{" "}
                <code className="font-mono">NULL</code>. This offer applies to all
                items site-wide.
              </p>
            )}

          </CardContent>
        </Card>

        {/* ── Section 4: Conditions ─────────────────────────────────── */}
        {/* Maps to: min_purchase (if you add it), start_date, end_date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Conditions</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className=" space-y-4">
            <div className="grid gap-4 md:grid-cols-2">

              {/* min_purchase */}
              <div className="space-y-2">
                <Label htmlFor="min_purchase">Minimum Purchase Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                    ₹
                  </span>
                  <Input
                    id="min_purchase"
                    type="number"
                    min={0}
                    value={form.min_purchase}
                    onChange={(e) =>
                      set(
                        "min_purchase",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="pl-7 font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Leave empty for no minimum</p>
              </div>

              <div /> {/* spacer */}

              {/* start_date → stored as timestamptz via now() */}
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  className={errors.start_date ? "border-destructive" : ""}
                />
                {errors.start_date && (
                  <p className="text-xs text-destructive">{errors.start_date}</p>
                )}
              </div>

              {/* end_date → NULL = no expiry, otherwise now() + interval */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => set("end_date", e.target.value)}
                  className={errors.end_date ? "border-destructive" : ""}
                />
                {errors.end_date && (
                  <p className="text-xs text-destructive">{errors.end_date}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty to store as <code className="font-mono bg-muted px-1 rounded text-xs">NULL</code> (no expiry)
                </p>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ── Section 5: Product Selection ──────────────────────────── */}
        {/* Only shown when applicable_to = "product"                   */}
        {/* IDs go to the offer_products join table, NOT applicable_id  */}
        {form.applicable_to === "product" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Select Products</CardTitle>
                {form.selected_product_ids.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {form.selected_product_ids.length} selected
                  </span>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-6" />
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right pr-6">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRODUCTS.map((p) => {
                    const sel = form.selected_product_ids.includes(p.id);
                    return (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() =>
                          set(
                            "selected_product_ids",
                            sel
                              ? form.selected_product_ids.filter((x) => x !== p.id)
                              : [...form.selected_product_ids, p.id]
                          )
                        }
                      >
                        <TableCell className="pl-6">
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 accent-primary"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{p.image}</span>
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {p.sku}
                        </TableCell>
                        <TableCell className="text-right font-mono pr-6">
                          ₹{p.price}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ── Action buttons ────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-10">
          <Button variant="outline" asChild>
            <Link href="/admin/offers">Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || saved}
            className="min-w-[130px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Save Offer"
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}