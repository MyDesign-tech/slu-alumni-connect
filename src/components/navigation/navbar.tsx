"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, Shield } from "lucide-react";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SluLogo } from "@/components/slu-logo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isHydrated } = useHydratedAuthStore();

  // Navigation items - same for both admin and regular users
  const publicNavItems: { href: string; label: string }[] = [];

  const authenticatedNavItems = [
    { href: "/events", label: "Events" },
    { href: "/profile", label: "Profile" },
    { href: "/directory", label: "Directory" },
    { href: "/mentorship", label: "Mentorship" },
    { href: "/messages", label: "Messages" },
    { href: "/donate", label: "Donate" },
  ];

  // Admin uses the same nav items - admin features are embedded in each page
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  if (!isHydrated) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <SluLogo />
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <SluLogo />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors font-medium ${pathname === item.href
                    ? "text-primary border-b-2 border-primary"
                    : "text-primary/70 hover:text-primary"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  <span className="text-primary text-sm">
                    Welcome, {user?.profile?.firstName || user?.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="text-primary hover:bg-primary/5"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" className="text-primary hover:bg-primary/5" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
                  <Link href="/signup">Join Now</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]" title="Navigation Menu">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        {isAdmin && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          Welcome, {user?.profile?.firstName || user?.email}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/login" onClick={() => setIsOpen(false)}>
                          Login
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          Join Now
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

