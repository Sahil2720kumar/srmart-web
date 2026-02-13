'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Power, PowerOff, Trash2, Calendar, TrendingUp, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const mockCoupons = [
  {
    id: '1',
    code: 'WELCOME20',
    description: 'Get 20% off on your first order',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 100,
    minOrderAmount: 299,
    applicableTo: 'all',
    usageLimitPerUser: 1,
    usageCount: 156,
    freeDelivery: false,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-02-28'),
    isActive: true,
    createdAt: new Date('2025-01-28'),
    updatedAt: new Date('2025-02-10'),
  },
  {
    id: '2',
    code: 'SAVE50',
    description: 'Save ₹50 on orders above ₹250',
    discountType: 'flat',
    discountValue: 50,
    minOrderAmount: 250,
    applicableTo: 'all',
    usageLimitPerUser: 1,
    usageCount: 423,
    freeDelivery: false,
    startDate: new Date('2025-02-11'),
    endDate: new Date('2025-02-15'),
    isActive: true,
    createdAt: new Date('2025-02-09'),
    updatedAt: new Date('2025-02-13'),
  },
  {
    id: '3',
    code: 'MEGA30',
    description: 'Get 30% off up to ₹150',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscountAmount: 150,
    minOrderAmount: 500,
    applicableTo: 'all',
    usageLimitPerUser: 1,
    usageCount: 789,
    freeDelivery: true,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-03-15'),
    isActive: true,
    createdAt: new Date('2025-01-25'),
    updatedAt: new Date('2025-02-12'),
  },
  {
    id: '4',
    code: 'VEG20',
    description: '20% off on Vegetables',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountAmount: 120,
    minOrderAmount: 199,
    applicableTo: 'category',
    applicableId: '11111111-1111-1111-1111-111111111111',
    applicableItems: ['Vegetables', 'Fresh Produce'],
    usageLimitPerUser: 1,
    usageCount: 234,
    freeDelivery: false,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-03-31'),
    isActive: true,
    createdAt: new Date('2025-01-30'),
    updatedAt: new Date('2025-02-08'),
  },
  {
    id: '5',
    code: 'DAIRY50',
    description: 'Flat ₹50 off on Dairy products',
    discountType: 'flat',
    discountValue: 50,
    minOrderAmount: 299,
    applicableTo: 'category',
    applicableId: '22222222-2222-2222-2222-222222222222',
    applicableItems: ['Dairy', 'Milk Products'],
    usageLimitPerUser: 1,
    usageCount: 567,
    freeDelivery: false,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-02-28'),
    isActive: true,
    createdAt: new Date('2025-01-28'),
    updatedAt: new Date('2025-02-11'),
  },
  {
    id: '6',
    code: 'VENDOR10',
    description: '10% off from selected vendor',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountAmount: 100,
    minOrderAmount: 300,
    applicableTo: 'vendor',
    applicableId: '33333333-3333-3333-3333-333333333333',
    applicableItems: ['Fresh Market'],
    usageLimit: 500,
    usageLimitPerUser: 3,
    usageCount: 189,
    freeDelivery: false,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-03-15'),
    isActive: true,
    createdAt: new Date('2025-01-29'),
    updatedAt: new Date('2025-02-10'),
  },
  {
    id: '7',
    code: 'SHOP100',
    description: 'Flat ₹100 off from SuperMart',
    discountType: 'flat',
    discountValue: 100,
    minOrderAmount: 500,
    applicableTo: 'vendor',
    applicableId: '44444444-4444-4444-4444-444444444444',
    applicableItems: ['SuperMart'],
    usageLimitPerUser: 1,
    usageCount: 345,
    freeDelivery: true,
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-02-20'),
    isActive: true,
    createdAt: new Date('2025-01-27'),
    updatedAt: new Date('2025-02-09'),
  },
  {
    id: '8',
    code: 'EXPIRED10',
    description: 'Old campaign discount',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 500,
    applicableTo: 'all',
    usageLimit: 1000,
    usageLimitPerUser: 1,
    usageCount: 998,
    freeDelivery: false,
    startDate: new Date('2024-11-01'),
    endDate: new Date('2025-01-31'),
    isActive: false,
    createdAt: new Date('2024-10-25'),
    updatedAt: new Date('2025-01-31'),
  },
];

export const mockCouponUsage = [
  {
    id: '1',
    couponId: '1',
    customerId: 'c1',
    customerName: 'Rajesh Kumar',
    orderId: 'ORD-2025-001234',
    discountAmount: 59.8,
    usedAt: new Date('2025-02-13T10:30:00'),
  },
  {
    id: '2',
    couponId: '1',
    customerId: 'c2',
    customerName: 'Priya Sharma',
    orderId: 'ORD-2025-001235',
    discountAmount: 100,
    usedAt: new Date('2025-02-13T11:15:00'),
  },
  {
    id: '3',
    couponId: '1',
    customerId: 'c3',
    customerName: 'Amit Patel',
    orderId: 'ORD-2025-001236',
    discountAmount: 85,
    usedAt: new Date('2025-02-13T14:20:00'),
  },
  {
    id: '4',
    couponId: '2',
    customerId: 'c4',
    customerName: 'Sneha Reddy',
    orderId: 'ORD-2025-001237',
    discountAmount: 50,
    usedAt: new Date('2025-02-12T09:45:00'),
  },
  {
    id: '5',
    couponId: '2',
    customerId: 'c5',
    customerName: 'Vikram Singh',
    orderId: 'ORD-2025-001238',
    discountAmount: 50,
    usedAt: new Date('2025-02-12T16:30:00'),
  },
  {
    id: '6',
    couponId: '3',
    customerId: 'c6',
    customerName: 'Deepa Nair',
    orderId: 'ORD-2025-001239',
    discountAmount: 150,
    usedAt: new Date('2025-02-11T13:20:00'),
  },
  {
    id: '7',
    couponId: '4',
    customerId: 'c7',
    customerName: 'Arun Menon',
    orderId: 'ORD-2025-001240',
    discountAmount: 39.8,
    usedAt: new Date('2025-02-10T15:45:00'),
  },
  {
    id: '8',
    couponId: '6',
    customerId: 'c8',
    customerName: 'Kavita Desai',
    orderId: 'ORD-2025-001241',
    discountAmount: 100,
    usedAt: new Date('2025-02-09T11:30:00'),
  },
];

interface CouponUsage {
  id: string;
  couponId: string;
  customerId: string;
  customerName: string;
  orderId: string;
  discountAmount: number;
  usedAt: Date;
}

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat' | 'bogo';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  applicableTo: 'all' | 'category' | 'vendor' | 'product';
  applicableId?: string;
  applicableItems?: string[];
  usageLimit?: number;
  usageLimitPerUser: number;
  usageCount: number;
  freeDelivery: boolean;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function CouponDetailPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.couponId as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [usageHistory, setUsageHistory] = useState<CouponUsage[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const found = mockCoupons.find((c) => c.id === couponId);
    if (found) {
      setCoupon(found);
      const history = mockCouponUsage.filter((u) => u.couponId === couponId);
      setUsageHistory(history);
    }
  }, [couponId]);

  if (!coupon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold">Coupon Not Found</h2>
          <p className="text-muted-foreground">The coupon you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/admin/coupons')}>
            Back to Coupons
          </Button>
        </div>
      </div>
    );
  }

  const handleToggleActive = () => {
    setCoupon((prev) => prev ? { ...prev, isActive: !prev.isActive, updatedAt: new Date() } : null);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    router.push('/admin/coupons');
  };

  const getStatusBadge = () => {
    if (!coupon.isActive) {
      return (
        <Badge variant="secondary" className="text-base px-4 py-1">
          Disabled
        </Badge>
      );
    }
    if (new Date() > coupon.endDate) {
      return (
        <Badge variant="destructive" className="text-base px-4 py-1">
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-base px-4 py-1">
        Active
      </Badge>
    );
  };

  const getDiscountDisplay = () => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else if (coupon.discountType === 'flat') {
      return `₹${coupon.discountValue}`;
    } else {
      return 'BOGO';
    }
  };

  const getUsagePercentage = () => {
    if (!coupon.usageLimit) return 0;
    return (coupon.usageCount / coupon.usageLimit) * 100;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/admin/coupons')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">
                  {coupon.code}
                </h1>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground mt-2">
                {coupon.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={coupon.isActive}
                onCheckedChange={handleToggleActive}
                disabled={new Date() > coupon.endDate}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push(`/admin/coupons/${coupon.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 - Discount Info */}
          <Card className="border-[hsl(var(--primary))]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Discount Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Type</span>
                <Badge variant="outline" className="capitalize font-semibold">
                  {coupon.discountType}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Value</span>
                <span className="text-2xl font-bold text-[hsl(var(--primary))]">
                  {getDiscountDisplay()}
                </span>
              </div>
              {coupon.maxDiscountAmount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Discount</span>
                  <span className="font-semibold">₹{coupon.maxDiscountAmount}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm">Free Delivery</span>
                <Badge 
                  className={coupon.freeDelivery 
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" 
                    : ""}
                  variant={coupon.freeDelivery ? "default" : "secondary"}
                >
                  {coupon.freeDelivery ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Rules */}
          <Card className="border-[hsl(var(--chart-2))]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Usage Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Min Order</span>
                <span className="font-semibold">₹{coupon.minOrderAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Limit</span>
                <span className="font-semibold">
                  {coupon.usageLimit ? coupon.usageLimit.toLocaleString() : 'Unlimited'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Per User</span>
                <span className="font-semibold">{coupon.usageLimitPerUser}x</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Current Usage</span>
                  <span className="text-xl font-bold text-[hsl(var(--primary))]">
                    {coupon.usageCount.toLocaleString()}
                  </span>
                </div>
                {coupon.usageLimit && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[hsl(var(--primary))] h-full transition-all duration-500"
                        style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {coupon.usageLimit - coupon.usageCount} remaining
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Validity */}
          <Card className="border-[hsl(var(--chart-3))]/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Validity Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Start Date</span>
                <p className="font-semibold">{formatDate(coupon.startDate)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">End Date</span>
                <p className="font-semibold">{formatDate(coupon.endDate)}</p>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div>
                  <span className="text-xs text-muted-foreground">Created</span>
                  <p className="text-sm">{formatDate(coupon.createdAt)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Last Updated</span>
                  <p className="text-sm">{formatDate(coupon.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applicability Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Applicability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-muted-foreground">Applies to:</span>
              <Badge 
                className="capitalize text-base px-3 py-1"
                variant={coupon.applicableTo === 'all' ? 'default' : 'secondary'}
              >
                {coupon.applicableTo}
              </Badge>
              {coupon.applicableItems && coupon.applicableItems.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {coupon.applicableItems.map((item) => (
                    <Badge key={item} variant="outline" className="text-sm">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
              {coupon.applicableTo === 'all' && (
                <span className="text-sm text-muted-foreground">
                  This coupon applies to all products in the store
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card>
          <CardHeader>
            <CardTitle>Usage History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recent transactions using this coupon
            </p>
          </CardHeader>
          <CardContent>
            {usageHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Usage Yet</h3>
                <p className="text-muted-foreground text-sm">
                  This coupon hasn't been used by any customers yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Order ID</TableHead>
                      <TableHead className="font-semibold">Discount</TableHead>
                      <TableHead className="font-semibold">Used At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageHistory.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell className="font-medium">{usage.customerName}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {usage.orderId}
                          </code>
                        </TableCell>
                        <TableCell className="font-semibold text-[hsl(var(--primary))]">
                          ₹{usage.discountAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(usage.usedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-[hsl(var(--destructive))]/30">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--destructive))] flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you delete a coupon, there is no going back. This will permanently remove
              the coupon and all its usage history.
            </p>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Coupon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon <strong>{coupon.code}</strong>? 
              This action cannot be undone and will permanently remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}