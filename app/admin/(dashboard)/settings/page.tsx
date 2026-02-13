"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Building2,
  DollarSign,
  CreditCard,
  Truck,
  Bell,
  Shield,
  Palette,
  AlertTriangle,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  // General Settings
  const [platformName, setPlatformName] = useState("FreshMart");
  const [supportEmail, setSupportEmail] = useState("support@freshmart.com");
  const [supportPhone, setSupportPhone] = useState("+91 1800 123 4567");
  const [currency, setCurrency] = useState("INR");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [multiVendorEnabled, setMultiVendorEnabled] = useState(true);
  const [deliveryPartnersEnabled, setDeliveryPartnersEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Commission Settings
  const [defaultCommission, setDefaultCommission] = useState("12");
  const [categoryCommission, setCategoryCommission] = useState(true);
  const [subcategoryCommission, setSubcategoryCommission] = useState(false);
  const [customCommission, setCustomCommission] = useState(true);
  const [platformFee, setPlatformFee] = useState("10");
  const [minOrderAmount, setMinOrderAmount] = useState("99");
  const [taxPercentage, setTaxPercentage] = useState("5");

  // Payment Settings
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("whsec_••••••••");
  const [testMode, setTestMode] = useState(false);
  const [vendorPayoutCycle, setVendorPayoutCycle] = useState("t3");
  const [deliveryPayoutCycle, setDeliveryPayoutCycle] = useState("daily");
  const [minWithdrawal, setMinWithdrawal] = useState("500");
  const [autoApprovePayout, setAutoApprovePayout] = useState(false);

  // Delivery Settings
  const [baseDeliveryFee, setBaseDeliveryFee] = useState("40");
  const [perKmCharge, setPerKmCharge] = useState("8");
  const [surgePricing, setSurgePricing] = useState(false);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("499");
  const [maxDistance, setMaxDistance] = useState("15");
  const [autoAssign, setAutoAssign] = useState(true);

  // Notification Settings
  const [orderConfirmation, setOrderConfirmation] = useState(true);
  const [payoutProcessed, setPayoutProcessed] = useState(true);
  const [refundIssued, setRefundIssued] = useState(true);
  const [vendorOrderAlerts, setVendorOrderAlerts] = useState(true);
  const [deliveryAssignment, setDeliveryAssignment] = useState(true);

  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [minPasswordLength, setMinPasswordLength] = useState("8");

  // Appearance Settings
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [borderRadius, setBorderRadius] = useState("0.5");

  const handleSave = (section) => {
    console.log(`Saving ${section} settings...`);
    // Show toast notification
    alert(`${section} settings saved successfully!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-600 mt-2">
            Manage platform configuration and preferences
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 flex-col">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto">
            <TabsTrigger  className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"  value="general">General</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="commission">Commission</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="payments">Payments</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="delivery">Delivery</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="notifications">Notifications</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="security">Security</TabsTrigger>
            <TabsTrigger className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Platform Information
                </CardTitle>
                <CardDescription>
                  Basic information about your platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={() => handleSave("Platform Information")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Configuration</CardTitle>
                <CardDescription>
                  Configure core business features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Multi-Vendor</Label>
                    <p className="text-sm text-slate-500">
                      Allow multiple vendors to sell on the platform
                    </p>
                  </div>
                  <Switch
                    checked={multiVendorEnabled}
                    onCheckedChange={setMultiVendorEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Delivery Partners</Label>
                    <p className="text-sm text-slate-500">
                      Use delivery partners for order fulfillment
                    </p>
                  </div>
                  <Switch
                    checked={deliveryPartnersEnabled}
                    onCheckedChange={setDeliveryPartnersEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Cash on Delivery (COD)</Label>
                    <p className="text-sm text-slate-500">
                      Accept cash payments on delivery
                    </p>
                  </div>
                  <Switch
                    checked={codEnabled}
                    onCheckedChange={setCodEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      Maintenance Mode
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </Label>
                    <p className="text-sm text-slate-500">
                      Disable platform for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>

                {maintenanceMode && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Warning:</strong> Platform is in maintenance mode. Users cannot place orders.
                    </p>
                  </div>
                )}

                <Button onClick={() => handleSave("Business Configuration")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMMISSION TAB */}
          <TabsContent value="commission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Commission Settings
                </CardTitle>
                <CardDescription>
                  Configure how commission is calculated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultCommission">Default Commission Rate (%)</Label>
                  <Input
                    id="defaultCommission"
                    type="number"
                    value={defaultCommission}
                    onChange={(e) => setDefaultCommission(e.target.value)}
                    placeholder="12"
                  />
                  <p className="text-xs text-slate-500">
                    Applied when no category/subcategory commission is set
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Category-based Commission</Label>
                    <p className="text-sm text-slate-500">
                      Override default commission per category
                    </p>
                  </div>
                  <Switch
                    checked={categoryCommission}
                    onCheckedChange={setCategoryCommission}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Subcategory-based Commission</Label>
                    <p className="text-sm text-slate-500">
                      Override commission per subcategory
                    </p>
                  </div>
                  <Switch
                    checked={subcategoryCommission}
                    onCheckedChange={setSubcategoryCommission}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Custom Commission per Product</Label>
                    <p className="text-sm text-slate-500">
                      Vendors can set custom commission rates
                    </p>
                  </div>
                  <Switch
                    checked={customCommission}
                    onCheckedChange={setCustomCommission}
                  />
                </div>

                <Button onClick={() => handleSave("Commission Settings")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Fees</CardTitle>
                <CardDescription>
                  Additional fees and charges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformFee">Platform Convenience Fee (₹)</Label>
                    <Input
                      id="platformFee"
                      type="number"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxPercentage">Tax Percentage (GST/VAT %)</Label>
                    <Input
                      id="taxPercentage"
                      type="number"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave("Platform Fees")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Gateway
                </CardTitle>
                <CardDescription>
                  Configure payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Razorpay Enabled</Label>
                    <p className="text-sm text-slate-500">
                      Accept payments via Razorpay
                    </p>
                  </div>
                  <Switch
                    checked={razorpayEnabled}
                    onCheckedChange={setRazorpayEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stripe Enabled</Label>
                    <p className="text-sm text-slate-500">
                      Accept payments via Stripe
                    </p>
                  </div>
                  <Switch
                    checked={stripeEnabled}
                    onCheckedChange={setStripeEnabled}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Mode</Label>
                    <p className="text-sm text-slate-500">
                      Use test API keys for development
                    </p>
                  </div>
                  <Switch
                    checked={testMode}
                    onCheckedChange={setTestMode}
                  />
                </div>

                <Button onClick={() => handleSave("Payment Gateway")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
                <CardDescription>
                  Configure vendor and delivery partner payouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorPayoutCycle">Vendor Payout Cycle</Label>
                    <Select value={vendorPayoutCycle} onValueChange={setVendorPayoutCycle}>
                      <SelectTrigger id="vendorPayoutCycle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="t3">T+3 (3 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryPayoutCycle">Delivery Payout Cycle</Label>
                    <Select value={deliveryPayoutCycle} onValueChange={setDeliveryPayoutCycle}>
                      <SelectTrigger id="deliveryPayoutCycle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount (₹)</Label>
                    <Input
                      id="minWithdrawal"
                      type="number"
                      value={minWithdrawal}
                      onChange={(e) => setMinWithdrawal(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-approve Payouts</Label>
                    <p className="text-sm text-slate-500">
                      Automatically process payout requests
                    </p>
                  </div>
                  <Switch
                    checked={autoApprovePayout}
                    onCheckedChange={setAutoApprovePayout}
                  />
                </div>

                <Button onClick={() => handleSave("Payout Settings")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DELIVERY TAB */}
          <TabsContent value="delivery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Configuration
                </CardTitle>
                <CardDescription>
                  Set delivery fees and pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseDeliveryFee">Base Delivery Fee (₹)</Label>
                    <Input
                      id="baseDeliveryFee"
                      type="number"
                      value={baseDeliveryFee}
                      onChange={(e) => setBaseDeliveryFee(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="perKmCharge">Per KM Charge (₹)</Label>
                    <Input
                      id="perKmCharge"
                      type="number"
                      value={perKmCharge}
                      onChange={(e) => setPerKmCharge(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freeDeliveryThreshold">Free Delivery Threshold (₹)</Label>
                    <Input
                      id="freeDeliveryThreshold"
                      type="number"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Surge Pricing</Label>
                    <p className="text-sm text-slate-500">
                      Increase prices during peak hours
                    </p>
                  </div>
                  <Switch
                    checked={surgePricing}
                    onCheckedChange={setSurgePricing}
                  />
                </div>

                <Button onClick={() => handleSave("Delivery Configuration")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Radius</CardTitle>
                <CardDescription>
                  Configure service area settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDistance">Maximum Service Distance (KM)</Label>
                  <Input
                    id="maxDistance"
                    type="number"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-assign Delivery Partner</Label>
                    <p className="text-sm text-slate-500">
                      Automatically assign orders to nearest partner
                    </p>
                  </div>
                  <Switch
                    checked={autoAssign}
                    onCheckedChange={setAutoAssign}
                  />
                </div>

                <Button onClick={() => handleSave("Delivery Radius")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure email alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Confirmation</Label>
                    <p className="text-sm text-slate-500">
                      Send email when order is confirmed
                    </p>
                  </div>
                  <Switch
                    checked={orderConfirmation}
                    onCheckedChange={setOrderConfirmation}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payout Processed</Label>
                    <p className="text-sm text-slate-500">
                      Notify vendors when payout is completed
                    </p>
                  </div>
                  <Switch
                    checked={payoutProcessed}
                    onCheckedChange={setPayoutProcessed}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Refund Issued</Label>
                    <p className="text-sm text-slate-500">
                      Notify customers when refund is processed
                    </p>
                  </div>
                  <Switch
                    checked={refundIssued}
                    onCheckedChange={setRefundIssued}
                  />
                </div>

                <Button onClick={() => handleSave("Email Notifications")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>
                  Configure mobile app alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Vendor Order Alerts</Label>
                    <p className="text-sm text-slate-500">
                      Push notifications for new orders
                    </p>
                  </div>
                  <Switch
                    checked={vendorOrderAlerts}
                    onCheckedChange={setVendorOrderAlerts}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Delivery Assignment Alerts</Label>
                    <p className="text-sm text-slate-500">
                      Notify partners when order is assigned
                    </p>
                  </div>
                  <Switch
                    checked={deliveryAssignment}
                    onCheckedChange={setDeliveryAssignment}
                  />
                </div>

                <Button onClick={() => handleSave("Push Notifications")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Authentication
                </CardTitle>
                <CardDescription>
                  Security and access control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable 2FA for Admin</Label>
                    <p className="text-sm text-slate-500">
                      Require two-factor authentication
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorAuth}
                    onCheckedChange={setTwoFactorAuth}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minPasswordLength">Minimum Password Length</Label>
                    <Input
                      id="minPasswordLength"
                      type="number"
                      value={minPasswordLength}
                      onChange={(e) => setMinPasswordLength(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave("Authentication")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>
                  Manage admin access levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline">Manage Roles</Button>
                  <Button variant="outline">View Permissions Matrix</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* APPEARANCE TAB */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Branding
                </CardTitle>
                <CardDescription>
                  Customize platform appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Logo</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Favicon</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">ICO, PNG 32x32px</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius (rem)</Label>
                  <Input
                    id="borderRadius"
                    type="number"
                    step="0.1"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                  />
                </div>

                <Button onClick={() => handleSave("Branding")} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}