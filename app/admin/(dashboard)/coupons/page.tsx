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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useCoupons,
  useToggleCouponStatus,
  useDeleteCoupon,
  useCreateCoupon,
  type Coupon,
  type CouponFilters,
} from '@/hooks';

export default function CouponsPage() {
  const router = useRouter();

  // ── Filters (client-side after fetch) ──────────────────────────────────────
  const [searchQuery, setSearchQuery]           = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>('all');
  const [applicableToFilter, setApplicableToFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter]         = useState<string>('all');
  const [sortBy, setSortBy]                     = useState<string>('newest');

  // ── Delete dialog ───────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen]   = useState(false);
  const [couponToDelete, setCouponToDelete]       = useState<string | null>(null);

  // ── Supabase queries / mutations ────────────────────────────────────────────
  // Pass server-friendly filters; status / search stay client-side for UX speed
  const serverFilters: CouponFilters = {};
  if (discountTypeFilter !== 'all') serverFilters.discount_type  = discountTypeFilter as CouponFilters['discount_type'];
  if (applicableToFilter !== 'all') serverFilters.applicable_to = applicableToFilter as CouponFilters['applicable_to'];

  const { data: coupons = [], isLoading, isError } = useCoupons(serverFilters);
  const toggleStatus = useToggleCouponStatus();
  const deleteCoupon = useDeleteCoupon();
  const createCoupon = useCreateCoupon(); // used for duplicate

  // ── Client-side filtering & sorting ────────────────────────────────────────
  const filteredAndSortedCoupons = useMemo(() => {
    const now = new Date();
    let filtered = coupons.filter((coupon) => {
      const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      const endDate = new Date(coupon.end_date);
      if (statusFilter === 'active')   matchesStatus = !!coupon.is_active && now < endDate;
      if (statusFilter === 'expired')  matchesStatus = now > endDate;
      if (statusFilter === 'disabled') matchesStatus = !coupon.is_active;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
      if (sortBy === 'mostUsed') return (b.usage_count ?? 0) - (a.usage_count ?? 0);
      if (sortBy === 'expiry')   return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      return 0;
    });

    return filtered;
  }, [coupons, searchQuery, statusFilter, sortBy]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleToggleActive = (coupon: Coupon) => {
    toggleStatus.mutate(
      { id: coupon.id, is_active: !coupon.is_active },
      {
        onSuccess: () => toast.success(`Coupon ${coupon.is_active ? 'disabled' : 'enabled'}`),
        onError:   () => toast.error('Failed to update coupon status'),
      },
    );
  };

  const handleDeleteCoupon = () => {
    if (!couponToDelete) return;
    deleteCoupon.mutate(couponToDelete, {
      onSuccess: () => {
        toast.success('Coupon deleted');
        setDeleteDialogOpen(false);
        setCouponToDelete(null);
      },
      onError: () => toast.error('Failed to delete coupon'),
    });
  };

  const handleDuplicate = (coupon: Coupon) => {
    const { id, created_at, updated_at, usage_count, ...rest } = coupon;
    createCoupon.mutate(
      { ...rest, code: `${coupon.code}-COPY`, usage_count: 0 },
      {
        onSuccess: () => toast.success('Coupon duplicated'),
        onError:   () => toast.error('Failed to duplicate coupon'),
      },
    );
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const getStatusBadge = (coupon: Coupon) => {
    const expired = new Date() > new Date(coupon.end_date);
    if (!coupon.is_active) return <Badge variant="secondary">Disabled</Badge>;
    if (expired)           return <Badge variant="destructive">Expired</Badge>;
    return <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Active</Badge>;
  };

  const getApplicableToBadge = (coupon: Coupon) => {
    const variants: Record<string, string> = {
      all:      'bg-[hsl(var(--chart-1))] text-[hsl(var(--primary-foreground))]',
      category: 'bg-[hsl(var(--chart-2))] text-[hsl(var(--accent-foreground))]',
      vendor:   'bg-[hsl(var(--chart-3))] text-[hsl(var(--primary-foreground))]',
      product:  'bg-[hsl(var(--chart-4))] text-[hsl(var(--primary-foreground))]',
    };
    return (
      <Badge className={`${variants[coupon.applicable_to ?? 'all'] ?? ''} font-medium capitalize`}>
        {coupon.applicable_to ?? 'all'}
      </Badge>
    );
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage')
      return <span className="font-semibold text-[hsl(var(--primary))]">{coupon.discount_value}%</span>;
    return <span className="font-semibold text-[hsl(var(--primary))]">₹{coupon.discount_value}</span>;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Failed to load coupons. Please try again.</p>
      </div>
    );
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────
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
          <Button onClick={() => router.push('/admin/coupons/upsert')} size="lg" className="gap-2 shadow-sm">
            <Plus className="h-5 w-5" />
            Create Coupon
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by coupon code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={discountTypeFilter} onValueChange={setDiscountTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Discount Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat">Flat</SelectItem>
                </SelectContent>
              </Select>

              <Select value={applicableToFilter} onValueChange={setApplicableToFilter}>
                <SelectTrigger><SelectValue placeholder="Applicable To" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="mostUsed">Most Used</SelectItem>
                  <SelectItem value="expiry">Expiry Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table / Empty state */}
        {filteredAndSortedCoupons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No coupons found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {searchQuery || discountTypeFilter !== 'all' || applicableToFilter !== 'all' || statusFilter !== 'all'
                    ? "Try adjusting your filters."
                    : 'Get started by creating your first coupon.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
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
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold text-base">{coupon.code}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{coupon.description}</div>
                      </TableCell>
                      <TableCell>{getDiscountDisplay(coupon)}</TableCell>
                      <TableCell className="font-medium">₹{coupon.min_order_amount}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{coupon.usage_count ?? 0}</span>
                          <span className="text-xs text-muted-foreground">
                            {coupon.usage_limit ? `of ${coupon.usage_limit}` : 'unlimited'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getApplicableToBadge(coupon)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{formatDate(coupon.start_date)}</span>
                          <span className="text-muted-foreground">to</span>
                          <span className="font-medium">{formatDate(coupon.end_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {coupon.includes_free_delivery
                          ? <Check className="h-5 w-5 mx-auto text-[hsl(var(--primary))]" />
                          : <X className="h-5 w-5 mx-auto text-muted-foreground" />
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(coupon)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/admin/coupons/${coupon.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/coupons/upsert?edit=${coupon.id}`)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit Coupon
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(coupon)}>
                              {coupon.is_active
                                ? <><PowerOff className="h-4 w-4 mr-2" /> Disable</>
                                : <><Power    className="h-4 w-4 mr-2" /> Enable</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(coupon)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setCouponToDelete(coupon.id); setDeleteDialogOpen(true); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
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

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCoupon}
              disabled={deleteCoupon.isPending}
            >
              {deleteCoupon.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}