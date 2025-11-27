"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/layout/main-layout";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { GraduationCap, Users, Calendar, Heart, ArrowRight, Star, MapPin } from "lucide-react";

import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area } from "recharts";

const growthData = [
  { year: '2020', alumni: 150000, donations: 2.5 },
  { year: '2021', alumni: 162000, donations: 3.1 },
  { year: '2022', alumni: 171000, donations: 3.5 },
  { year: '2023', alumni: 178000, donations: 3.8 },
  { year: '2024', alumni: 185000, donations: 4.2 },
];

export default function Home() {
  const { user, isAuthenticated, isHydrated } = useHydratedAuthStore();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Badge variant="secondary" className="mb-6 text-lg px-6 py-2 bg-accent text-accent-foreground border-none shadow-lg">
              <GraduationCap className="w-5 h-5 mr-2" />
              Official Alumni Platform
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              {isAuthenticated ? `Welcome Home, ${user?.profile?.firstName}!` : "Higher Purpose. Greater Good."}
            </h1>

            <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto mb-10 leading-relaxed">
              {isAuthenticated
                ? "Continue your journey with the SLU community. Explore events, connect with mentors, and make an impact."
                : "Join the global community of Saint Louis University alumni. Reconnect, mentor, and shape the future together."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isHydrated ? (
                <div className="w-48 h-12 bg-white/20 rounded animate-pulse"></div>
              ) : isAuthenticated ? (
                <>
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 h-14" asChild>
                    <Link href="/directory">Find Alumni</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary text-lg px-8 h-14" asChild>
                    <Link href="/mentorship">Mentorship Hub</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 h-14" asChild>
                    <Link href="/signup">Join the Network</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary text-lg px-8 h-14" asChild>
                    <Link href="/login">
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Stats Section */}
      <section className="py-16 bg-white -mt-16 relative z-20 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 shadow-xl rounded-2xl bg-white p-8 border border-gray-100">
          {/* Key Metrics */}
          <div className="lg:col-span-1 flex flex-col justify-center space-y-8 border-b lg:border-b-0 lg:border-r border-gray-100 pr-0 lg:pr-8">
            <div className="text-center lg:text-left">
              <div className="text-5xl font-bold text-primary mb-2">185k+</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center lg:justify-start gap-2">
                <Users className="h-4 w-4" /> Global Alumni
              </div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-5xl font-bold text-secondary mb-2">120+</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center lg:justify-start gap-2">
                <MapPin className="h-4 w-4" /> Countries
              </div>
            </div>
            <div className="text-center lg:text-left">
              <div className="text-5xl font-bold text-accent mb-2">$4.2M</div>
              <div className="text-muted-foreground font-medium uppercase tracking-wide flex items-center justify-center lg:justify-start gap-2">
                <Heart className="h-4 w-4" /> Raised for Scholarships
              </div>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="lg:col-span-2 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-center lg:text-left">Community Impact Growth</h3>
            <div className="flex-1 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growthData} margin={{ top: 10, right: 40, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorAlumni" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#003DA5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#003DA5" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" orientation="left" stroke="#003DA5" axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#FDB913" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="alumni" fill="url(#colorAlumni)" stroke="#003DA5" name="Alumni Community" />
                  <Line yAxisId="right" type="monotone" dataKey="donations" stroke="#FDB913" strokeWidth={3} dot={{ r: 4, fill: "#FDB913" }} name="Scholarships ($M)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Why Join SLU Alumni Connect?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your relationship with SLU doesn't end at graduation. Discover the benefits of staying connected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "Directory Access",
                desc: "Search and connect with alumni across industries and locations.",
                color: "text-blue-600"
              },
              {
                icon: Calendar,
                title: "Exclusive Events",
                desc: "Priority registration for reunions, networking mixers, and webinars.",
                color: "text-green-600"
              },
              {
                icon: Star,
                title: "Mentorship",
                desc: "Give back as a mentor or find guidance for your career path.",
                color: "text-yellow-600"
              },
              {
                icon: Heart,
                title: "Giving Back",
                desc: "Support the next generation of Billikens through scholarships.",
                color: "text-red-600"
              }
            ].map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-all hover:-translate-y-1 border-none shadow-md">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section - Only for Authenticated Users */}
      {isAuthenticated && (
        <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">Upcoming Alumni Events</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect with fellow Billikens at exclusive alumni events and reunions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Alumni Networking Mixer",
                  date: "March 15, 2025",
                  location: "St. Louis, MO",
                  image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop",
                  description: "Join us for an evening of networking with alumni professionals across industries."
                },
                {
                  title: "Spring Reunion Weekend",
                  date: "April 20-22, 2025",
                  location: "SLU Campus",
                  image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop",
                  description: "Celebrate your class reunion with campus tours, banquets, and special events."
                },
                {
                  title: "Career Development Workshop",
                  date: "May 10, 2025",
                  location: "Virtual Event",
                  image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
                  description: "Enhance your professional skills with expert-led workshops and panel discussions."
                },
                {
                  title: "Billiken Basketball Alumni Game",
                  date: "June 5, 2025",
                  location: "Chaifetz Arena",
                  image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
                  description: "Watch current players compete and meet fellow alumni sports enthusiasts."
                },
                {
                  title: "Global Alumni Summit",
                  date: "July 12-14, 2025",
                  location: "Worldwide",
                  image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop",
                  description: "Connect with SLU alumni from around the globe in this virtual summit."
                },
                {
                  title: "Young Alumni Social",
                  date: "August 8, 2025",
                  location: "Downtown St. Louis",
                  image: "https://images.unsplash.com/photo-1529610768580-f808cd8e3a95?w=800&h=600&fit=crop",
                  description: "Recent graduates gather for food, drinks, and networking opportunities."
                }
              ].map((event, i) => (
                <Card key={i} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20"><div class="text-center p-4"><svg class="w-16 h-16 mx-auto mb-2 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-sm font-medium text-primary/60">${event.title}</p></div></div>`;
                        }
                      }}
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-primary mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{event.date}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-2">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{event.description}</p>
                    <Button size="sm" className="w-full" variant="outline" asChild>
                      <Link href="/events">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white" asChild>
                <Link href="/events">
                  View All Events
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-12 text-center">Alumni Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Dr. Sarah Chen",
                role: "Chief of Surgery, Mercy Hospital",
                class: "Class of 2008",
                quote: "The mentorship I received at SLU shaped my entire career. Now, I'm proud to mentor medical students through this platform.",
                image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
              },
              {
                name: "James Wilson",
                role: "Founder, EcoTech Solutions",
                class: "Class of 2015",
                quote: "Connecting with fellow alumni investors helped me launch my startup. The SLU network is truly powerful.",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2070&auto=format&fit=crop"
              },
              {
                name: "Maria Rodriguez",
                role: "Senior Policy Advisor",
                class: "Class of 2012",
                quote: "SLU taught me to lead with compassion. This platform helps me stay connected to that mission every day.",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2070&auto=format&fit=crop"
              }
            ].map((story, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-lg">
                <div className="h-48 overflow-hidden bg-muted">
                  <img src={story.image} alt={story.name} className="w-full h-full object-cover object-top transition-transform hover:scale-105 duration-500" />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{story.name}</h3>
                      <p className="text-sm text-primary font-medium">{story.role}</p>
                    </div>
                    <Badge variant="outline">{story.class}</Badge>
                  </div>
                  <p className="text-muted-foreground italic">"{story.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Reconnect?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Join thousands of alumni who are already making a difference.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 h-14 shadow-xl" asChild>
            <Link href="/signup">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
