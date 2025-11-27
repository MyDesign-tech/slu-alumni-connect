"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, User, LogOut } from "lucide-react";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SluLogo } from "@/components/slu-logo";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isHydrated } = useHydratedAuthStore();

  // Navigation items based on authentication status
  const publicNavItems: { href: string; label: string }[] = [
    // No items for public users on homepage, they should focus on signup/login
  ];

  const authenticatedNavItems = [
    { href: "/events", label: "Events" },
    { href: "/profile", label: "Profile" },
    { href: "/directory", label: "Directory" },
    { href: "/mentorship", label: "Mentorship" },
    { href: "/messages", label: "Messages" },
    { href: "/donate", label: "Donate" },
  ];

  const adminNavItems = [
    { href: "/events", label: "Events" },
    { href: "/profile", label: "Profile" },
    { href: "/directory", label: "Directory" },
    { href: "/mentorship", label: "Mentorship" },
    { href: "/messages", label: "Messages" },
    { href: "/donate", label: "Donate" },
    { href: "/admin", label: "Admin" },
  ];

  // Filter out current page from navigation
  const isAdmin = user?.role === "ADMIN";
  const navItems = isAuthenticated ? (isAdmin ? adminNavItems : authenticatedNavItems) : publicNavItems;

  // Show loading state during hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <SluLogo />
            </Link>
            {/* Loading placeholder */}
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
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <SluLogo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors font-medium ${pathname === item.href
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-primary/70 hover:text-primary'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <span className="text-primary text-sm">
                  Welcome, {user?.profile?.firstName || user?.email}
                </span>
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

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
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
                      <div className="text-sm text-muted-foreground mb-2">
                        Welcome, {user?.profile?.firstName || user?.email}
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
