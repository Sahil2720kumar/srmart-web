"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Eye,
  MessageSquare,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

// Mock Data
const mockTickets = [
  {
    id: "TKT001",
    userType: "Customer",
    userName: "John Doe",
    userEmail: "john@example.com",
    userPhone: "+91 98765 43210",
    subject: "Order not delivered",
    priority: "High",
    status: "Open",
    createdAt: "2024-02-13T10:30:00",
    lastUpdated: "2024-02-13T10:30:00",
    messages: [
      {
        sender: "John Doe",
        role: "Customer",
        message: "My order #ORD12345 was supposed to be delivered 2 hours ago but hasn't arrived yet.",
        timestamp: "2024-02-13T10:30:00",
      },
    ],
  },
  {
    id: "TKT002",
    userType: "Vendor",
    userName: "Organic Farms Ltd",
    userEmail: "contact@organicfarms.com",
    userPhone: "+91 98765 43211",
    subject: "Commission calculation issue",
    priority: "Medium",
    status: "In Progress",
    createdAt: "2024-02-13T09:15:00",
    lastUpdated: "2024-02-13T11:00:00",
    messages: [
      {
        sender: "Organic Farms Ltd",
        role: "Vendor",
        message: "The commission charged on order #ORD12340 seems incorrect. It should be 12% but shows 15%.",
        timestamp: "2024-02-13T09:15:00",
      },
      {
        sender: "Admin Support",
        role: "Admin",
        message: "Thank you for reporting this. We're investigating the issue and will get back to you within 24 hours.",
        timestamp: "2024-02-13T11:00:00",
      },
    ],
  },
  {
    id: "TKT003",
    userType: "Delivery",
    userName: "Rajesh Kumar",
    userEmail: "rajesh@delivery.com",
    userPhone: "+91 98765 43212",
    subject: "App not working properly",
    priority: "Critical",
    status: "Open",
    createdAt: "2024-02-13T08:45:00",
    lastUpdated: "2024-02-13T08:45:00",
    messages: [
      {
        sender: "Rajesh Kumar",
        role: "Delivery Partner",
        message: "The delivery app keeps crashing when I try to mark orders as delivered. I've lost 3 deliveries because of this.",
        timestamp: "2024-02-13T08:45:00",
      },
    ],
  },
  {
    id: "TKT004",
    userType: "Customer",
    userName: "Sarah Wilson",
    userEmail: "sarah@example.com",
    userPhone: "+91 98765 43213",
    subject: "Refund not received",
    priority: "High",
    status: "Resolved",
    createdAt: "2024-02-12T16:20:00",
    lastUpdated: "2024-02-13T10:00:00",
    messages: [
      {
        sender: "Sarah Wilson",
        role: "Customer",
        message: "I cancelled my order 5 days ago but haven't received the refund yet.",
        timestamp: "2024-02-12T16:20:00",
      },
      {
        sender: "Admin Support",
        role: "Admin",
        message: "We've processed your refund. It should reflect in your account within 3-5 business days.",
        timestamp: "2024-02-13T10:00:00",
      },
    ],
  },
  {
    id: "TKT005",
    userType: "Vendor",
    userName: "Fresh Harvest Co",
    userEmail: "info@freshharvest.com",
    userPhone: "+91 98765 43214",
    subject: "Product listing not visible",
    priority: "Low",
    status: "Closed",
    createdAt: "2024-02-11T14:30:00",
    lastUpdated: "2024-02-12T09:00:00",
    messages: [
      {
        sender: "Fresh Harvest Co",
        role: "Vendor",
        message: "Some of my products are not showing up in the app.",
        timestamp: "2024-02-11T14:30:00",
      },
      {
        sender: "Admin Support",
        role: "Admin",
        message: "We found that these products were marked as out of stock. Please update inventory.",
        timestamp: "2024-02-12T09:00:00",
      },
    ],
  },
];

export default function AdminSupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      Critical: "bg-red-500 text-white hover:bg-red-500",
      High: "bg-orange-500 text-white hover:bg-orange-500",
      Medium: "bg-yellow-500 text-white hover:bg-yellow-500",
      Low: "bg-blue-500 text-white hover:bg-blue-500",
    };
    return <Badge className={variants[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      Open: { color: "bg-red-100 text-red-700", icon: AlertCircle },
      "In Progress": { color: "bg-blue-100 text-blue-700", icon: Clock },
      Resolved: { color: "bg-green-100 text-green-700", icon: CheckCircle },
      Closed: { color: "bg-slate-100 text-slate-700", icon: XCircle },
    };
    const StatusIcon = variants[status]?.icon || AlertCircle;
    return (
      <Badge className={variants[status]?.color}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getUserTypeBadge = (type) => {
    const variants = {
      Customer: "bg-purple-100 text-purple-700",
      Vendor: "bg-emerald-100 text-emerald-700",
      Delivery: "bg-blue-100 text-blue-700",
    };
    return <Badge className={variants[type]}>{type}</Badge>;
  };

  const filterTickets = (tickets) => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.userPhone.includes(searchTerm)
      );
    }

    if (userTypeFilter !== "all") {
      filtered = filtered.filter((t) => t.userType === userTypeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    return filtered;
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    
    console.log("Sending reply:", replyMessage);
    // Add reply to ticket messages
    setReplyMessage("");
  };

  const handleUpdateStatus = (newStatus) => {
    console.log("Updating ticket status to:", newStatus);
    setIsDrawerOpen(false);
  };

  const filteredTickets = filterTickets(mockTickets);

  const statusCounts = {
    all: mockTickets.length,
    open: mockTickets.filter((t) => t.status === "Open").length,
    inProgress: mockTickets.filter((t) => t.status === "In Progress").length,
    resolved: mockTickets.filter((t) => t.status === "Resolved").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Support & Help Center
            </h1>
            <p className="text-slate-600 mt-2">
              Manage customer, vendor, and delivery partner issues
            </p>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Plus className="w-4 h-4" />
            Create Manual Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-slate-100">Total Tickets</div>
              <div className="text-3xl font-bold mt-1">{statusCounts.all}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-red-100">Open</div>
              <div className="text-3xl font-bold mt-1">{statusCounts.open}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-100">In Progress</div>
              <div className="text-3xl font-bold mt-1">{statusCounts.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="text-sm text-emerald-100">Resolved</div>
              <div className="text-3xl font-bold mt-1">{statusCounts.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by ID, name, phone, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="Customer">Customers</SelectItem>
                  <SelectItem value="Vendor">Vendors</SelectItem>
                  <SelectItem value="Delivery">Delivery Partners</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardContent className="pt-6">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No support tickets found
                </h3>
                <p className="text-slate-600 mb-6">
                  Try adjusting your filters or create a new ticket
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>User Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono font-medium">
                          {ticket.id}
                        </TableCell>
                        <TableCell>{getUserTypeBadge(ticket.userType)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{ticket.userName}</div>
                          <div className="text-xs text-slate-500">{ticket.userEmail}</div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {ticket.subject}
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDateTime(ticket.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDateTime(ticket.lastUpdated)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <MessageSquare className="w-4 h-4" />
                              Reply
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto p-6">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>{selectedTicket.id}</span>
                  {getPriorityBadge(selectedTicket.priority)}
                </SheetTitle>
                <SheetDescription>{selectedTicket.subject}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* User Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedTicket.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{selectedTicket.userName}</div>
                        <div className="text-sm text-slate-600">{getUserTypeBadge(selectedTicket.userType)}</div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{selectedTicket.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{selectedTicket.userPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Created {formatDateTime(selectedTicket.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversation Thread */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Conversation</h3>
                  {selectedTicket.messages.map((msg, index) => (
                    <Card key={index} className={msg.role === "Admin" ? "bg-blue-50" : ""}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            msg.role === "Admin" ? "bg-blue-500" : "bg-slate-500"
                          }`}>
                            {msg.sender.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{msg.sender}</span>
                              <span className="text-xs text-slate-500">
                                {formatDateTime(msg.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{msg.message}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Reply Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Reply to Ticket</h3>
                  <Textarea
                    placeholder="Type your response..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                  />
                  <Button className="w-full" onClick={handleSendReply}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                </div>

                {/* Status Actions */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Update Status</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("In Progress")}
                      disabled={selectedTicket.status === "In Progress"}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("Resolved")}
                      disabled={selectedTicket.status === "Resolved"}
                    >
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      className="col-span-2"
                      onClick={() => handleUpdateStatus("Closed")}
                      disabled={selectedTicket.status === "Closed"}
                    >
                      Close Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}