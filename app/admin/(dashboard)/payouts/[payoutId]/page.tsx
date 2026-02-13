"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, Clock, CreditCard, ExternalLink, 
  History, Info, MoreHorizontal, Receipt, ShieldCheck, 
  ShieldX, User, Wallet, XCircle 
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// --- Types & Mock Data ---
type WalletUserType = 'vendor' | 'delivery_boy';
type CashoutRequestStatus = 'pending' | 'approved' | 'processing' | 'transferred' | 'completed' | 'rejected';

interface PayoutRequest {
  id: string;
  amount: number;
  status: CashoutRequestStatus;
  userType: WalletUserType;
  userName: string;
  bankVerified: boolean;
  transactionRef?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  transferredAt?: string;
  completedAt?: string;
  rejectedAt?: string;
}

const MOCK_PAYOUT: PayoutRequest = {
  id: "PAY-992834",
  amount: 12450.00,
  status: 'pending',
  userType: 'vendor',
  userName: "Global Kitchen Supplies",
  bankVerified: true,
  createdAt: "2023-10-24 10:30 AM",
};

// --- Helper Components ---

const StatusBadge = ({ status }: { status: CashoutRequestStatus }) => {
  const styles: Record<CashoutRequestStatus, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    approved: "bg-info/10 text-info border-info/20",
    processing: "bg-info/10 text-info border-info/20 animate-pulse",
    transferred: "bg-success/10 text-success border-success/20",
    completed: "bg-success text-white border-transparent",
    rejected: "bg-danger/10 text-danger border-danger/20",
  };
  return <Badge className={cn("capitalize px-3 py-1", styles[status])}>{status}</Badge>;
};

const TimelineItem = ({ title, date, active, completed, isLast }: { title: string, date?: string, active?: boolean, completed?: boolean, isLast?: boolean }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={cn(
        "w-4 h-4 rounded-full border-2 mt-1",
        completed ? "bg-success border-success" : active ? "bg-white border-info" : "bg-white border-muted"
      )} />
      {!isLast && <div className={cn("w-0.5 h-12 my-1", completed ? "bg-success" : "bg-slate-200")} />}
    </div>
    <div className="pb-6">
      <p className={cn("font-medium text-sm", active ? "text-primary" : "text-muted-foreground")}>{title}</p>
      {date && <p className="text-xs text-muted-foreground mt-1">{date}</p>}
    </div>
  </div>
);

export default function PayoutDetailPage() {
  const [payout, setPayout] = useState<PayoutRequest>(MOCK_PAYOUT);
  const [rejectionReason, setRejectionReason] = useState("");
  const [txnRef, setTxnRef] = useState("");

  const updateStatus = (status: CashoutRequestStatus, updates: Partial<PayoutRequest> = {}) => {
    setPayout(prev => ({ ...prev, status, ...updates }));
  };

  // Logic for button states
  const canApprove = payout.status === 'pending' && payout.bankVerified;
  const canTransfer = payout.status === 'approved' || payout.status === 'processing';
  const canComplete = payout.status === 'transferred';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className='mx-auto max-w-7xl space-y-6'>
      {/* Sticky Header */}
      <header className="  w-full border-b backdrop-blur-md  py-4">
        <div className=" flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{payout.id}</h1>
                <Badge variant="outline" className="bg-slate-100">{payout.userType.replace('_', ' ')}</Badge>
                <StatusBadge status={payout.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">Request by {payout.userName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {payout.status === 'pending' && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Reject</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Reject Payout Request</DialogTitle></DialogHeader>
                    <div className="py-4">
                      <Label>Reason for Rejection</Label>
                      <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. Account details mismatch" />
                    </div>
                    <DialogFooter>
                      <Button variant="destructive" onClick={() => updateStatus('rejected', { rejectedAt: "Oct 24, 2023", rejectionReason })}>Confirm Rejection</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button 
                  className="bg-[#3b82f6] hover:bg-blue-600" 
                  disabled={!canApprove} 
                  onClick={() => updateStatus('approved', { approvedAt: "Oct 24, 2023" })}
                >
                  Approve Request
                </Button>
              </>
            )}

            {payout.status === 'approved' && (
              <Button variant="secondary" onClick={() => updateStatus('processing')}>Mark Processing</Button>
            )}

            {(payout.status === 'approved' || payout.status === 'processing') && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-[#10b981] hover:bg-emerald-600 text-white">Initiate Transfer</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Bank Transfer Confirmation</DialogTitle></DialogHeader>
                  <div className="py-4">
                    <Label>Transaction Reference ID</Label>
                    <Input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="UTR Number / Ref Number" />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => updateStatus('transferred', { transferredAt: "Oct 24, 2023", transactionRef: txnRef })}>Mark as Transferred</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {payout.status === 'transferred' && (
              <Button className="bg-black text-white hover:bg-slate-800" onClick={() => updateStatus('completed', { completedAt: "Oct 24, 2023" })}>
                Complete Payout
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-muted-foreground" /> Payout Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Requested Amount</p>
                  <p className="text-3xl font-bold mt-1 text-slate-900">₹{payout.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Transaction Ref</p>
                  <p className="text-sm font-medium mt-1">{payout.transactionRef || '---'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Request Date</p>
                  <p className="text-sm font-medium mt-1">{payout.createdAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 & 4: Wallet & Bank */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Wallet Info */}
             <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Wallet Snapshot</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <span className="font-bold">₹45,200.00</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Pending Settlements</span>
                  <span className="font-semibold text-warning">₹12,450.00</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-sm text-muted-foreground">Lifetime Payouts</span>
                  <span className="font-semibold">₹2,45,000.00</span>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className={cn(!payout.bankVerified && "border-danger/50")}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Bank Information</CardTitle>
                {payout.bankVerified ? (
                  <Badge className="bg-success/10 text-success border-success/20 gap-1"><ShieldCheck className="w-3 h-3"/> Verified</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1"><ShieldX className="w-3 h-3"/> Unverified</Badge>
                )}
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holder:</span>
                  <span className="font-medium">Global Kitchen LLC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-medium">HDFC Bank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acc Number:</span>
                  <span className="font-mono">**** 5592</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IFSC:</span>
                  <span className="font-medium">HDFC0001234</span>
                </div>
                {!payout.bankVerified && (
                  <Alert variant="destructive" className="mt-4 py-2 px-3">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">Verify bank to enable approval.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section 5: Transactions */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Ledger</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell><Badge variant="outline" className="text-success border-success/20">Credit</Badge></TableCell>
                      <TableCell className="text-xs font-mono">#ORD-552{i}</TableCell>
                      <TableCell className="text-right text-success font-medium">+₹450.00</TableCell>
                      <TableCell className="text-right">₹45,200.00</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <Card className="h-fit sticky top-28">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" /> Lifecycle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-2">
                <TimelineItem title="Payout Requested" date={payout.createdAt} completed />
                
                {payout.status === 'rejected' ? (
                  <TimelineItem title="Rejected" date={payout.rejectedAt} active isLast />
                ) : (
                  <>
                    <TimelineItem 
                      title="Approved" 
                      date={payout.approvedAt} 
                      completed={!!payout.approvedAt} 
                      active={payout.status === 'approved'} 
                    />
                    <TimelineItem 
                      title="Processing" 
                      active={payout.status === 'processing'} 
                      completed={['transferred', 'completed'].includes(payout.status)} 
                    />
                    <TimelineItem 
                      title="Transferred" 
                      date={payout.transferredAt} 
                      completed={['transferred', 'completed'].includes(payout.status)} 
                      active={payout.status === 'transferred'} 
                    />
                    <TimelineItem 
                      title="Completed" 
                      date={payout.completedAt} 
                      completed={payout.status === 'completed'} 
                      active={payout.status === 'completed'} 
                      isLast 
                    />
                  </>
                )}
              </div>

              {payout.status === 'rejected' && (
                <div className="mt-4 p-4 bg-danger/5 rounded-lg border border-danger/20">
                  <p className="text-xs font-semibold text-danger uppercase tracking-tight">Rejection Reason</p>
                  <p className="text-sm text-slate-700 mt-1">{payout.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
      </div>
    </div>
  );
}