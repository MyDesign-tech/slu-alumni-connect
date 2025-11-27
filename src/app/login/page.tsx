"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useHydratedAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        router.push("/"); // Redirect to landing page/dashboard
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Full Background Image */}
      <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center"></div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Top Left Branding */}
      <div className="absolute top-8 left-8 z-10 text-white">
        <div className="flex items-center gap-2 text-2xl font-bold mb-2">
          <GraduationCap className="h-8 w-8" />
          <span>SLU Alumni Connect</span>
        </div>
        <p className="text-blue-100 max-w-md text-sm">
          Saint Louis University&apos;s official platform for alumni engagement, mentorship, and lifelong connection.
        </p>
      </div>

      {/* Floating Login Card */}
      <Card className="relative z-10 w-full max-w-sm shadow-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/20 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>

        <CardHeader className="space-y-1 text-center pb-4 pt-5 relative z-10">
          <div className="mb-2 inline-flex mx-auto p-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-lg">Welcome back</h1>
          <p className="text-white/70 text-xs">
            Enter your credentials to access your alumni account
          </p>
        </CardHeader>

        <CardContent className="space-y-3.5 px-5 pb-5 relative z-10">
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm text-white text-xs p-2.5 rounded-lg border border-red-500/30 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-400"></div>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="billiken@slu.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 rounded-lg focus:bg-white/15 focus:border-white/40 transition-all duration-300 text-sm px-3"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/90" htmlFor="password">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 rounded-lg focus:bg-white/15 focus:border-white/40 transition-all duration-300 text-sm px-3"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-lg shadow-primary/30 mt-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative pt-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-transparent px-2 text-white/50 uppercase tracking-wide font-medium text-[9px]">
                New to SLU Alumni?
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-white/70">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent hover:text-accent/80 font-semibold transition-colors hover:underline">
                Join the network
              </Link>
            </p>
          </div>

          <div className="text-center text-xs text-white/50 pt-2 border-t border-white/10">
            <p className="font-semibold text-white/60 mb-0.5 text-[10px]">IT Help Desk</p>
            <p className="text-[10px]">
              <a href="tel:+18007583678" className="text-white/70 hover:text-white transition-colors underline">+1-800-758-3678</a> or{" "}
              <a href="mailto:ask@slu.edu" className="text-white/70 hover:text-white transition-colors underline">
                ask@slu.edu
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Quote */}
      <div className="absolute bottom-8 left-8 right-8 z-10 text-white text-center lg:text-left">
        <blockquote className="text-lg lg:text-xl font-medium italic max-w-2xl">
          &quot;Higher purpose. Greater good. Connect with the SLU community to make a difference together.&quot;
        </blockquote>
        <div className="flex flex-wrap gap-4 text-sm text-blue-100 mt-4 justify-center lg:justify-start">
          <span>© {new Date().getFullYear()} Saint Louis University</span>
          <Link href="#" className="hover:text-white underline">Privacy Policy</Link>
          <Link href="#" className="hover:text-white underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
