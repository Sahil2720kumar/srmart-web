'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Power,
  PowerOff,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

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

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [searchQuery, setSearchQuery] = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>('all');
  const [applicableToFilter, setApplicableToFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  const filteredAndSortedCoupons = useMemo(() => {
    let filtered = coupons.filter((coupon) => {
      const matchesSearch = coupon.code
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDiscountType =
        discountTypeFilter === 'all' || coupon.discountType === discountTypeFilter;
      const matchesApplicableTo =
        applicableToFilter === 'all' || coupon.applicableTo === applicableToFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = coupon.isActive && new Date() < coupon.endDate;
      } else if (statusFilter === 'expired') {
        matchesStatus = new Date() > coupon.endDate;
      } else if (statusFilter === 'disabled') {
        matchesStatus = !coupon.isActive;
      }

      return matchesSearch && matchesDiscountType && matchesApplicableTo && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === 'mostUsed') {
        return b.usageCount - a.usageCount;
      } else if (sortBy === 'expiry') {
        return a.endDate.getTime() - b.endDate.getTime();
      }
      return 0;
    });

    return filtered;
  }, [coupons, searchQuery, discountTypeFilter, applicableToFilter, statusFilter, sortBy]);

  const handleToggleActive = (id: string) => {
    setCoupons((prev) =>
      prev.map((coupon) =>
        coupon.id === id ? { ...coupon, isActive: !coupon.isActive, updatedAt: new Date() } : coupon
      )
    );
  };

  const handleDeleteCoupon = () => {
    if (couponToDelete) {
      setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete));
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const handleDuplicate = (coupon: Coupon) => {
    const newCoupon: Coupon = {
      ...coupon,
      id: Date.now().toString(),
      code: `${coupon.code}-COPY`,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.isActive) {
      return (
        <Badge variant="secondary" className="font-medium">
          Disabled
        </Badge>
      );
    }
    if (new Date() > coupon.endDate) {
      return (
        <Badge variant="destructive" className="font-medium">
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium">
        Active
      </Badge>
    );
  };

  const getApplicableToBadge = (coupon: Coupon) => {
    const variants: Record<string, string> = {
      all: 'bg-[hsl(var(--chart-1))] text-[hsl(var(--primary-foreground))]',
      category: 'bg-[hsl(var(--chart-2))] text-[hsl(var(--accent-foreground))]',
      vendor: 'bg-[hsl(var(--chart-3))] text-[hsl(var(--primary-foreground))]',
      product: 'bg-[hsl(var(--chart-4))] text-[hsl(var(--primary-foreground))]',
    };

    return (
      <Badge className={`${variants[coupon.applicableTo]} font-medium capitalize`}>
        {coupon.applicableTo}
      </Badge>
    );
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return (
        <span className="font-semibold text-[hsl(var(--primary))]">
          {coupon.discountValue}%
        </span>
      );
    } else if (coupon.discountType === 'flat') {
      return (
        <span className="font-semibold text-[hsl(var(--primary))]">
          ₹{coupon.discountValue}
        </span>
      );
    } else {
      return (
        <span className="font-semibold text-[hsl(var(--accent))]">
          BOGO
        </span>
      );
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Coupons</h1>
            <p className="text-muted-foreground mt-2 text-base">
              Manage discount codes, usage limits, and validity
            </p>
          </div>
          <Button
            onClick={() => router.push('/admin/coupons/add')}
            size="lg"
            className="gap-2 shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create Coupon
          </Button>
        </div>

        {/* Filters Section */}
        <Card className="border-[hsl(var(--border))]">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by coupon code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Discount Type Filter */}
              <Select value={discountTypeFilter} onValueChange={setDiscountTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Discount Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                  <SelectItem value="bogo">BOGO</SelectItem>
                </SelectContent>
              </Select>

              {/* Applicable To Filter */}
              <Select value={applicableToFilter} onValueChange={setApplicableToFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Applicable To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="mostUsed">Most Used</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {filteredAndSortedCoupons.length === 0 ? (
          <Card className="border-[hsl(var(--border))]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No coupons found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {searchQuery || discountTypeFilter !== 'all' || applicableToFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters to find what you\'re looking for.'
                    : 'Get started by creating your first coupon.'}
                </p>
                {!searchQuery && discountTypeFilter === 'all' && applicableToFilter === 'all' && statusFilter === 'all' && (
                  <Button
                    onClick={() => router.push('/admin/coupons/add')}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Coupon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[hsl(var(--border))]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Discount</TableHead>
                    <TableHead className="font-semibold">Min Order</TableHead>
                    <TableHead className="font-semibold">Usage</TableHead>
                    <TableHead className="font-semibold">Applicable To</TableHead>
                    <TableHead className="font-semibold">Validity</TableHead>
                    <TableHead className="font-semibold text-center">Free Delivery</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCoupons.map((coupon) => (
                    <TableRow key={coupon.id} className="group">
                      <TableCell className="font-mono font-bold text-base">
                        {coupon.code}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{coupon.description}</div>
                      </TableCell>
                      <TableCell>{getDiscountDisplay(coupon)}</TableCell>
                      <TableCell className="font-medium">
                        ₹{coupon.minOrderAmount}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{coupon.usageCount}</span>
                          <span className="text-xs text-muted-foreground">
                            {coupon.usageLimit ? `of ${coupon.usageLimit}` : 'unlimited'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getApplicableToBadge(coupon)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{formatDate(coupon.startDate)}</span>
                          <span className="text-muted-foreground">to</span>
                          <span className="font-medium">{formatDate(coupon.endDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {coupon.freeDelivery ? (
                          <Check className="h-5 w-5 mx-auto text-[hsl(var(--primary))]" />
                        ) : (
                          <X className="h-5 w-5 mx-auto text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(coupon)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/coupons/${coupon.id}`)}
                              className="cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/coupons/${coupon.id}/edit`)}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Coupon
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(coupon.id)}
                              className="cursor-pointer"
                            >
                              {coupon.isActive ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(coupon)}
                              className="cursor-pointer"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setCouponToDelete(coupon.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="cursor-pointer text-[hsl(var(--destructive))] focus:text-[hsl(var(--destructive))]"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCoupon}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}