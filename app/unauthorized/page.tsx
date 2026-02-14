"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, Mail } from "lucide-react";

export default function UnauthorizedPageMinimal() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Animated rings */}
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
            <div className="relative w-32 h-32 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <ShieldX className="w-16 h-16 text-red-600 dark:text-red-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">
            403
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
            <br />
            This area is restricted to administrators only.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => router.push("/")}>
            <Home className="w-4 h-4 mr-2" />
            Go to HomePage
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact-support">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-muted-foreground">
          Need admin access?{" "}
          <Link href="/contact-support" className="text-primary hover:underline">
            Request permissions
          </Link>
        </p>
      </div>
    </div>
  );
}