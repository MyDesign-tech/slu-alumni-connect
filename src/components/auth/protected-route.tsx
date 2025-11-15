"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  const { isAuthenticated, isHydrated } = useHydratedAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isHydrated, router, redirectTo]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {!isHydrated ? "Loading..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
