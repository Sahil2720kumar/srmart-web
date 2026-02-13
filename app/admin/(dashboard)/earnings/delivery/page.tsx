"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ArrowLeft, Eye, Truck, DollarSign, Award } from "lucide-react";
import Link from "next/link";

// Mock Data
const mockDeliveryEarnings = [
  {
    partnerId: "D001",
    partnerName: "Rajesh Kumar",
    totalDeliveries: 234,
    deliveryFeesEarned: 17550.00,
    incentives: 2340.00,
    bonuses: 1000.00,
    netPayout: 20890.00,
    walletStatus: "Active",
    rating: 4.8,
  },
  {
    partnerId: "D002",
    partnerName: "Priya Sharma",
    totalDeliveries: 298,
    deliveryFeesEarned: 22350.00,
    incentives: 2980.00,
    bonuses: 1500.00,
    netPayout: 26830.00,
    walletStatus: "Active",
    rating: 4.9,
  },
  {
    partnerId: "D003",
    partnerName: "Amit Patel",
    totalDeliveries: 189,
    deliveryFeesEarned: 14175.00,
    incentives: 1890.00,
    bonuses: 500.00,
    netPayout: 16565.00,
    walletStatus: "Active",
    rating: 4.6,
  },
  {
    partnerId: "D004",
    partnerName: "Sneha Reddy",
    totalDeliveries: 345,
    deliveryFeesEarned: 25875.00,
    incentives: 3450.00,
    bonuses: 2000.00,
    netPayout: 31325.00,
    walletStatus: "Active",
    rating: 4.9,
  },
  {
    partnerId: "D005",
    partnerName: "Vikram Singh",
    totalDeliveries: 156,
    deliveryFeesEarned: 11700.00,
    incentives: 1560.00,
    bonuses: 0,
    netPayout: 13260.00,
    walletStatus: "Pending",
    rating: 4.5,
  },
];

export default function DeliveryEarningsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filterPartners = (partners) => {
    if (!searchTerm) return partners;
    return partners.filter((p) =>
      p.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partnerId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPartners = filterPartners(mockDeliveryEarnings);

  // Calculate totals
  const totals = mockDeliveryEarnings.reduce(
    (acc, partner) => ({
      totalDeliveries: acc.totalDeliveries + partner.totalDeliveries,
      deliveryFeesEarned: acc.deliveryFeesEarned + partner.deliveryFeesEarned,
      incentives: acc.incentives + partner.incentives,
      bonuses: acc.bonuses + partner.bonuses,
      netPayout: acc.netPayout + partner.netPayout,
    }),
    {
      totalDeliveries: 0,
      deliveryFeesEarned: 0,
      incentives: 0,
      bonuses: 0,
      netPayout: 0,
    }
  );

  const platformCoveredCost = 15670.00; // Mock data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/earnings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
              Delivery Fee & Partner Earnings
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor delivery economics and partner payouts
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-100 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Total Delivery Fees Collected
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(totals.deliveryFeesEarned)}
                  </div>
                  <div className="text-xs text-blue-100 mt-2">
                    From {totals.totalDeliveries.toLocaleString()} deliveries
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-emerald-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Delivery Payouts to Partners
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(totals.netPayout)}
                  </div>
                  <div className="text-xs text-emerald-100 mt-2">
                    Including incentives & bonuses
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-amber-100 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Platform-Covered Cost
                  </div>
                  <div className="text-3xl font-bold mt-2">
                    {formatCurrency(platformCoveredCost)}
                  </div>
                  <div className="text-xs text-amber-100 mt-2">
                    Free delivery subsidies
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Economics Breakdown */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4">Delivery Economics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Total Fees Collected from Customers</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(totals.deliveryFeesEarned)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Base Delivery Fees to Partners</span>
                <span className="font-semibold text-emerald-600">
                  −{formatCurrency(totals.deliveryFeesEarned)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Incentives & Bonuses Paid</span>
                <span className="font-semibold text-purple-600">
                  −{formatCurrency(totals.incentives + totals.bonuses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Platform-Covered Delivery Cost</span>
                <span className="font-semibold text-red-600">
                  −{formatCurrency(platformCoveredCost)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900">Net Delivery Impact</span>
                <span className="font-bold text-lg text-red-600">
                  −{formatCurrency(totals.incentives + totals.bonuses + platformCoveredCost)}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                * Negative impact = Platform subsidizing delivery to boost adoption
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search delivery partner by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Partner Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead className="text-right">Total Deliveries</TableHead>
                    <TableHead className="text-right">Delivery Fees</TableHead>
                    <TableHead className="text-right">Incentives</TableHead>
                    <TableHead className="text-right">Bonuses</TableHead>
                    <TableHead className="text-right">Net Payout</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead>Wallet Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                        No delivery partners found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((partner) => (
                      <TableRow key={partner.partnerId}>
                        <TableCell>
                          <div className="font-medium">{partner.partnerName}</div>
                          <div className="text-xs text-slate-500">{partner.partnerId}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {partner.totalDeliveries.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {formatCurrency(partner.deliveryFeesEarned)}
                        </TableCell>
                        <TableCell className="text-right text-purple-600">
                          {formatCurrency(partner.incentives)}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatCurrency(partner.bonuses)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                          {formatCurrency(partner.netPayout)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium">{partner.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              partner.walletStatus === "Active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }
                          >
                            {partner.walletStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Link href={`/admin/delivery/${partner.partnerId}`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/admin/wallets/delivery/${partner.partnerId}`}>
                              <Button variant="outline" size="sm">
                                Payouts
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}