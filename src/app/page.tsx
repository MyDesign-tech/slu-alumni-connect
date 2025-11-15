"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/main-layout";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";

export default function Home() {
  const { user, isAuthenticated, isHydrated } = useHydratedAuthStore();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-secondary to-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4 text-lg px-4 py-2">
              🎓 Saint Louis University
            </Badge>
            {!isHydrated ? (
              <>
                <h1 className="text-5xl font-bold text-white mb-6">
                  SLU Alumni Connect
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                  Reconnect with your alma mater, engage with fellow alumni, and build lasting professional relationships.
                </p>
                <div className="flex gap-4 justify-center">
                  <div className="w-32 h-12 bg-white/20 rounded animate-pulse"></div>
                  <div className="w-32 h-12 bg-white/20 rounded animate-pulse"></div>
                </div>
              </>
            ) : isAuthenticated ? (
              <>
                <h1 className="text-5xl font-bold text-white mb-6">
                  Welcome back, {user?.profile?.firstName}!
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                  Ready to connect with fellow alumni and explore new opportunities?
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/events">Explore Events</Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold"
                    asChild
                  >
                    <Link href="/profile">View Profile</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-5xl font-bold text-white mb-6">
                  SLU Alumni Connect
                </h1>
                <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                  Reconnect with your alma mater, engage with fellow alumni, and build lasting professional relationships.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/signup">Join the Network</Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="ghost" 
                    className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold"
                    asChild
                  >
                    <Link href="/login">Learn More</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary">3,500+</CardTitle>
                <CardDescription>Active Alumni</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-secondary">150+</CardTitle>
                <CardDescription>Annual Events</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-accent">950+</CardTitle>
                <CardDescription>Mentorship Connections</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Connect, Engage, Give Back</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤝 Networking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with fellow alumni across industries and graduation years.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📅 Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Attend exclusive alumni events, reunions, and professional workshops.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Mentorship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Find mentors or become one to guide the next generation of Billikens.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="py-8 bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-medium">IT Help Desk</p>
          <p className="mt-1">
            For technical issues, call <a href="tel:+18007583678" className="underline">+1-800-758-3678</a> or email{" "}
            <a
              href="mailto:ask@slu.edu"
              className="underline"
            >
              ask@slu.edu
            </a>
            .
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
