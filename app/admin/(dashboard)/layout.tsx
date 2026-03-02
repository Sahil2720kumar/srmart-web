"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, ShoppingCart, Store, Truck, DollarSign,
  Headphones, Settings, Menu, X, Search, Bell, LogOut, User,
  ChevronRight, LayoutGrid, BadgePercent, Ticket, Wallet, Package,
  CircleDollarSign, Banknote, CheckCheck, ShoppingBag, CreditCard,
  Megaphone, Wrench, Star, Loader2,
} from "lucide-react";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
} from "@/hooks/usenotifications";
import { useAuth } from "@/providers/AuthProvider";

// ─── Navigation ───────────────────────────────────────────────────────────────

const navigation = [
  { name: "Dashboard",                 href: "/admin/dashboard",    icon: LayoutDashboard },
  { name: "Products",                  href: "/admin/products",     icon: Package },
  { name: "Categories",                href: "/admin/categories",   icon: LayoutGrid },
  { name: "Offers",                    href: "/admin/offers",       icon: BadgePercent },
  { name: "Discount Codes",            href: "/admin/coupons",      icon: Ticket },
  { name: "Orders",                    href: "/admin/order-groups", icon: ShoppingCart },
  { name: "Vendors",                   href: "/admin/vendors",      icon: Store },
  { name: "Delivery Partners",         href: "/admin/delivery",     icon: Truck },
  { name: "Bank Details",              href: "/admin/banks",        icon: Banknote },
  { name: "Wallets",                   href: "/admin/wallets",      icon: Wallet },
  { name: "Payouts",                   href: "/admin/payouts",      icon: DollarSign },
  { name: "Earnings",                  href: "/admin/earnings",     icon: CircleDollarSign },
  { name: "Support (Not Implemented)", href: "/admin/support",      icon: Headphones },
  { name: "Settings (Not Implemented)", href: "/admin/settings",    icon: Settings },
];

// ─── Notification helpers ─────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  order:     ShoppingBag,
  payment:   CreditCard,
  delivery:  Truck,
  promotion: Megaphone,
  system:    Wrench,
  review:    Star,
};

const TYPE_COLOR: Record<string, string> = {
  order:     "bg-blue-100 text-blue-600",
  payment:   "bg-emerald-100 text-emerald-600",
  delivery:  "bg-amber-100 text-amber-600",
  promotion: "bg-purple-100 text-purple-600",
  system:    "bg-slate-100 text-slate-600",
  review:    "bg-pink-100 text-pink-600",
};

function formatRelativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const Icon       = TYPE_ICON[notif.type ?? "system"] ?? Wrench;
  const colorClass = TYPE_COLOR[notif.type ?? "system"] ?? TYPE_COLOR.system;

  const inner = (
    <div
      className={cn(
        "flex gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer",
        notif.is_read ? "hover:bg-accent" : "bg-primary/5 hover:bg-primary/10"
      )}
      onClick={() => { if (!notif.is_read) onRead(notif.id); }}
    >
      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", colorClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn("text-sm leading-snug", !notif.is_read && "font-semibold text-foreground")}>
          {notif.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
        <p className="text-[11px] text-muted-foreground/70">{formatRelativeTime(notif.created_at)}</p>
      </div>
      {!notif.is_read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </div>
  );

  return notif.action_url ? <Link href={notif.action_url}>{inner}</Link> : inner;
}

// ─── Main Layout ──────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  // ── Auth ───────────────────────────────────────────────────────────────────
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      router.replace("/"); // redirect to login after sign-out
    } catch (err) {
      console.error("Sign-out failed:", err);
    } finally {
      setSigningOut(false);
    }
  };

  // ── Notifications ──────────────────────────────────────────────────────────
  const { data: notifications = [], isLoading: notifsLoading } = useNotifications();
  const { data: unreadCount   = 0 }                            = useUnreadNotificationCount();
  const markRead    = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = (notifId: string) => markRead.mutate(notifId);
  const handleMarkAll  = () => { if (unreadCount > 0) markAllRead.mutate(); };

  // ── Sidebar initials from real email ──────────────────────────────────────
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "AD";

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Store className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">GroceryHub</span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.includes(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.name}</span>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/admin-avatar.jpg" alt="Admin" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="Search orders, vendors, partners..." className="pl-9 h-9" />
            </div>
          </div>

          <div className="flex items-center gap-2">

            {/* ── Notifications ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-96 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleMarkAll}
                      disabled={markAllRead.isPending}
                    >
                      {markAllRead.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <CheckCheck className="h-3 w-3" />}
                      Mark all read
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[400px]">
                  {notifsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                      <Bell className="h-8 w-8 opacity-30" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-0.5">
                      {notifications.map((notif) => (
                        <NotifRow key={notif.id} notif={notif} onRead={handleMarkRead} />
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {notifications.length > 0 && (
                  <div className="border-t px-4 py-2.5">
                    <Link href="/admin/notifications" className="text-xs text-primary hover:underline font-medium">
                      View all notifications →
                    </Link>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ── Profile / Sign Out ── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/admin-avatar.jpg" alt="Admin" />
                    <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email ?? "—"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /><span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" /><span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  disabled={signingOut}
                  onClick={handleSignOut}
                >
                  {signingOut
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <LogOut  className="mr-2 h-4 w-4" />}
                  <span>{signingOut ? "Signing out…" : "Log out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}