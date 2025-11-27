"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { Heart, DollarSign, Users, Award, Target, TrendingUp, Calendar, CheckCircle, Plus, Settings, Edit, Trash2, BarChart3, Shield, RefreshCw, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
  endDate: string;
  category: string;
  image?: string;
}

interface DonationHistory {
  id: string;
  campaign: string;
  amount: number;
  date: string;
  status: string;
  purpose?: string;
}

const COLORS = ['#003DA5', '#53C3EE', '#FFC72C', '#8FD6BD', '#795D3E', '#ED8B00'];

export default function DonatePage() {
  const { user, isHydrated } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([]);
  const [donations, setDonations] = useState<DonationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRaised: 0,
    activeDonors: 0,
    scholarshipsFunded: 0,
    activeCampaigns: 0
  });
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isDonationSettingsOpen, setIsDonationSettingsOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null);
  const [editCampaignData, setEditCampaignData] = useState({
    title: "",
    description: "",
    goal: 0,
    endDate: "",
    category: "",
  });
  const [analyticsCampaign, setAnalyticsCampaign] = useState<DonationCampaign | null>(null);
  const [quickDonateCampaign, setQuickDonateCampaign] = useState<DonationCampaign | null>(null);
  const [quickDonateAmount, setQuickDonateAmount] = useState("");
  const [activeTab, setActiveTab] = useState(isAdmin ? "manage-campaigns" : "active-campaigns");

  // Analytics Data Calculation
  const donationTrendsData = useMemo(() => {
    if (!donations || donations.length === 0) return [] as { month: string; totalAmount: number; donationCount: number }[];

    const byKey = new Map<string, { month: string; totalAmount: number; donationCount: number }>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (const d of donations) {
      const date = new Date(d.date);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const existing = byKey.get(key) || { month: label, totalAmount: 0, donationCount: 0 };
      existing.totalAmount += d.amount;
      existing.donationCount += 1;
      byKey.set(key, existing);
    }

    const sorted = Array.from(byKey.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, value]) => value);

    return sorted.slice(-6);
  }, [donations]);

  const donationsByPurposeData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    donations.forEach(d => {
      const purpose = d.purpose || 'General Fund';
      counts[purpose] = (counts[purpose] || 0) + d.amount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [donations]);

  const topCampaignsData = useMemo(() => {
    return campaigns
      .map(c => ({
        name: c.title,
        value: Math.min((c.raised / c.goal) * 100, 100),
        raised: c.raised,
        goal: c.goal
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [campaigns]);

  useEffect(() => {
    fetchCampaigns();
    fetchDonations();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/donations?type=campaigns', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);

        if (data.campaigns) {
          const totalRaised = data.campaigns.reduce((sum: number, campaign: any) => sum + campaign.raised, 0);
          setStats(prev => ({
            ...prev,
            totalRaised,
            activeCampaigns: data.campaigns.length
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/donations', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDonations(data.donations || []);

        if (data.donations) {
          const uniqueDonors = new Set(data.donations.map((d: any) => d.alumniId || d.id)).size;
          const scholarshipDonations = data.donations.filter((d: any) =>
            d.campaign?.toLowerCase().includes('scholarship') || d.purpose?.toLowerCase().includes('scholarship')
          ).length;

          setStats(prev => ({
            ...prev,
            activeDonors: uniqueDonors,
            scholarshipsFunded: scholarshipDonations
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const predefinedAmounts = [25, 50, 100, 250, 500, 1000];

  const getProgressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDonate = async (campaignId: string, amount: number) => {
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'user@slu.edu'
        },
        body: JSON.stringify({
          amount,
          campaignId,
          paymentMethod: 'Credit Card',
          donorName: user?.email || 'Anonymous'
        })
      });

      if (response.ok) {
        alert(`Thank you for your ${formatCurrency(amount)} ${donationType} donation!`);
        setSelectedAmount(null);
        setCustomAmount("");
        setSelectedCampaign(null);
        fetchCampaigns();
        fetchDonations();
      } else {
        alert("Failed to process donation. Please try again.");
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert("Error processing donation. Please try again.");
    }
  };

  const handleCreateCampaign = () => {
    setEditCampaignData({
      title: "",
      description: "",
      goal: 0,
      endDate: "",
      category: "",
    });
    setIsCreateCampaignOpen(true);
  };

  const handleDonationSettings = () => {
    setIsDonationSettingsOpen(true);
  };

  const handleSaveNewCampaign = async () => {
    if (!editCampaignData.title.trim()) {
      alert("Please enter a campaign title.");
      return;
    }

    if (!editCampaignData.goal || editCampaignData.goal <= 0) {
      alert("Please enter a goal amount greater than 0.");
      return;
    }

    const newCampaign: DonationCampaign = {
      id: `CMP${Date.now()}`,
      title: editCampaignData.title.trim(),
      description: editCampaignData.description.trim(),
      goal: editCampaignData.goal,
      raised: 0,
      donors: 0,
      endDate:
        editCampaignData.endDate ||
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      category: editCampaignData.category || "Education",
    };

    setCampaigns((prev) => [...prev, newCampaign]);
    setStats((prev) => ({
      ...prev,
      activeCampaigns: prev.activeCampaigns + 1,
    }));

    try {
      fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu',
        },
        body: JSON.stringify({
          id: newCampaign.id,
          title: newCampaign.title,
          description: newCampaign.description,
          goal: newCampaign.goal,
          endDate: newCampaign.endDate,
          category: newCampaign.category,
        }),
      }).catch((error) => {
        console.error('Campaign announcement email error:', error);
      });
    } catch (error) {
      console.error('Campaign announcement email setup error:', error);
    }

    setEditCampaignData({
      title: "",
      description: "",
      goal: 0,
      endDate: "",
      category: "",
    });

    setIsCreateCampaignOpen(false);
  };

  const handleEditCampaign = (campaign: DonationCampaign) => {
    setEditingCampaign(campaign);
    setEditCampaignData({
      title: campaign.title || "",
      description: campaign.description || "",
      goal: campaign.goal || 0,
      endDate: campaign.endDate || "",
      category: campaign.category || "",
    });
  };

  const handleArchiveCampaign = (campaign: DonationCampaign) => {
    if (!confirm(`Are you sure you want to archive "${campaign.title}"?`)) return;
    setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
  };

  const handleCampaignAnalytics = (campaign: DonationCampaign) => {
    setAnalyticsCampaign(campaign);
  };

  const handleDonateNow = (campaign: DonationCampaign) => {
    setQuickDonateCampaign(campaign);
    setQuickDonateAmount("50");
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Education: "bg-blue-100 text-blue-800",
      Infrastructure: "bg-green-100 text-green-800",
      Research: "bg-purple-100 text-purple-800",
      "Student Support": "bg-orange-100 text-orange-800"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-4">
                {isAdmin ? "Donation Management" : "Support SLU"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {isAdmin
                  ? "Manage donation campaigns, track fundraising progress, and oversee financial contributions."
                  : "Your generosity helps create opportunities for current and future students while strengthening our alumni community."
                }
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button onClick={handleCreateCampaign}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
                <Button variant="outline" onClick={handleDonationSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            )}
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRaised)}</div>
                <p className="text-sm text-muted-foreground">Total Raised This Year</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{stats.activeDonors.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Active Donors</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{stats.scholarshipsFunded}</div>
                <p className="text-sm text-muted-foreground">Scholarships Funded</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary">{stats.activeCampaigns}</div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-4'}`}>
              {isAdmin ? (
                <>
                  <TabsTrigger value="manage-campaigns">Manage Campaigns</TabsTrigger>
                  <TabsTrigger value="donations-overview">Donations Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </>
              ) : (
                <>
                  <TabsTrigger value="active-campaigns">Active Campaigns</TabsTrigger>
                  <TabsTrigger value="make-donation">Make a Donation</TabsTrigger>
                  <TabsTrigger value="my-donations">My Donations</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Active Campaigns Tab */}
            <TabsContent value="active-campaigns" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{campaign.title}</CardTitle>
                          <Badge className={`mt-2 ${getCategoryColor(campaign.category)}`}>
                            {campaign.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {getProgressPercentage(campaign.raised, campaign.goal).toFixed(0)}% funded
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{campaign.description}</p>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Raised: {formatCurrency(campaign.raised)}</span>
                          <span>Goal: {formatCurrency(campaign.goal)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(campaign.raised, campaign.goal)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {campaign.donors} donors
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Ends {new Date(campaign.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleDonateNow(campaign)}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Donate Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Make a Donation Tab */}
            <TabsContent value="make-donation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Make a Donation
                  </CardTitle>
                  <CardDescription>
                    Choose an amount and campaign to support SLU's mission.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Campaign Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Campaign</label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={selectedCampaign || ""}
                      onChange={(e) => setSelectedCampaign(e.target.value)}
                    >
                      <option value="">Choose a campaign</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Donation Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Donation Type</label>
                    <div className="flex gap-4">
                      <Button
                        variant={donationType === "one-time" ? "default" : "outline"}
                        onClick={() => setDonationType("one-time")}
                      >
                        One-time
                      </Button>
                      <Button
                        variant={donationType === "monthly" ? "default" : "outline"}
                        onClick={() => setDonationType("monthly")}
                      >
                        Monthly
                      </Button>
                    </div>
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Donation Amount</label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
                      {predefinedAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant={selectedAmount === amount ? "default" : "outline"}
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount("");
                          }}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <span className="flex items-center text-sm">$</span>
                      <Input
                        type="number"
                        placeholder="Custom amount"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                      />
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium">Payment Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Cardholder Name" />
                      <Input placeholder="Card Number" />
                      <Input placeholder="MM/YY" />
                      <Input placeholder="CVV" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Billing Address" />
                      <Input placeholder="City, State, ZIP" />
                    </div>
                  </div>

                  {/* Donation Summary */}
                  {(selectedAmount || customAmount) && selectedCampaign && (
                    <div className="p-4 border rounded-lg bg-primary/5">
                      <h4 className="font-medium mb-2">Donation Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Campaign:</span>
                          <span>{campaigns.find(c => c.id === selectedCampaign)?.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span>{formatCurrency(selectedAmount || parseInt(customAmount) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="capitalize">{donationType}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedAmount || parseInt(customAmount) || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedCampaign || (!selectedAmount && !customAmount)}
                    onClick={() => handleDonate(
                      selectedCampaign!,
                      selectedAmount || parseInt(customAmount) || 0
                    )}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Complete Donation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Donations Tab */}
            <TabsContent value="my-donations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    My Donation History
                  </CardTitle>
                  <CardDescription>
                    Track your contributions and impact over time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {donations.length > 0 ? (
                    <div className="space-y-4">
                      {donations.map((donation: DonationHistory) => (
                        <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <h4 className="font-medium">{donation.campaign}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(donation.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(donation.amount)}</div>
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              {donation.status}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Donated:</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(donations.reduce((sum: number, d: DonationHistory) => sum + d.amount, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No donations yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start making a difference by supporting our campaigns.
                      </p>
                      <Button onClick={() => setActiveTab("make-donation")}>
                        Make Your First Donation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab - Visible to ALL */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donation Trends Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Donation Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {donationTrendsData.length === 0 ? (
                      <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Donation trends will appear here once you have donations.</p>
                          <p className="text-sm text-muted-foreground">Track total amount and number of gifts over time.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={donationTrendsData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "totalAmount") {
                                  return [formatCurrency(value as number), "Total Amount"];
                                }
                                return [value, "Donations"];
                              }}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="totalAmount"
                              name="Total Amount"
                              stroke="#003DA5"
                              fill="#003DA5"
                              fillOpacity={0.1}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Donations by Purpose */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Donations by Purpose
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donationsByPurposeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                        >
                          {donationsByPurposeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Performing Campaigns */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Top Performing Campaigns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topCampaignsData} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip
                          formatter={(value, name, props) => {
                            if (name === "value") return [`${(value as number).toFixed(1)}%`, "Funded"];
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="value" fill="#53C3EE" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Admin-only tabs */}
            {isAdmin && (
              <>
                {/* Manage Campaigns Tab */}
                <TabsContent value="manage-campaigns" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Campaign Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {campaigns.map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <h4 className="font-medium">{campaign.title}</h4>
                              <p className="text-sm text-muted-foreground">{campaign.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Raised: ${campaign.raised.toLocaleString()}</span>
                                <span>Goal: ${campaign.goal.toLocaleString()}</span>
                                <span>{campaign.donors} donors</span>
                                <Badge className={getCategoryColor(campaign.category)}>
                                  {campaign.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditCampaign(campaign)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleArchiveCampaign(campaign)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Donations Overview Tab */}
                <TabsContent value="donations-overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Donations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {donations.map((donation) => (
                            <div key={donation.id} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{donation.campaign}</p>
                                <p className="text-sm text-muted-foreground">{donation.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${donation.amount}</p>
                                <Badge className={donation.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {donation.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Top Donors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { name: "Sarah Johnson", amount: 5000, donations: 12 },
                            { name: "Michael Chen", amount: 3500, donations: 8 },
                            { name: "Emily Rodriguez", amount: 2800, donations: 15 },
                            { name: "David Thompson", amount: 2200, donations: 6 }
                          ].map((donor, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{donor.name}</p>
                                <p className="text-sm text-muted-foreground">{donor.donations} donations</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${donor.amount.toLocaleString()}</p>
                                <Badge className="bg-gold-100 text-gold-800">
                                  #{index + 1}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>

          {/* Create Campaign Dialog */}
          <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>
                  Launch a new fundraising campaign.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input
                  placeholder="Campaign Title"
                  value={editCampaignData.title}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, title: e.target.value })}
                />
                <Input
                  placeholder="Goal Amount ($)"
                  type="number"
                  value={editCampaignData.goal || ""}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, goal: parseFloat(e.target.value) })}
                />
                <Input
                  placeholder="End Date"
                  type="date"
                  value={editCampaignData.endDate}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, endDate: e.target.value })}
                />
                <select
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={editCampaignData.category}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  <option value="Education">Education</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Research">Research</option>
                  <option value="Student Support">Student Support</option>
                </select>
                <textarea
                  className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                  rows={3}
                  placeholder="Description"
                  value={editCampaignData.description}
                  onChange={(e) => setEditCampaignData({ ...editCampaignData, description: e.target.value })}
                />
                <Button onClick={handleSaveNewCampaign} className="w-full">
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Campaign Dialog */}
          <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Campaign</DialogTitle>
              </DialogHeader>
              {editingCampaign && (
                <div className="space-y-4">
                  <Input
                    value={editCampaignData.title}
                    onChange={(e) => setEditCampaignData({ ...editCampaignData, title: e.target.value })}
                  />
                  <Input
                    type="number"
                    value={editCampaignData.goal}
                    onChange={(e) => setEditCampaignData({ ...editCampaignData, goal: parseFloat(e.target.value) })}
                  />
                  <Button onClick={() => {
                    setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? { ...c, ...editCampaignData } : c));
                    setEditingCampaign(null);
                  }}>Save Changes</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Quick Donate Dialog */}
          <Dialog open={!!quickDonateCampaign} onOpenChange={(open) => !open && setQuickDonateCampaign(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Donate to {quickDonateCampaign?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 100].map(amt => (
                    <Button
                      key={amt}
                      variant={quickDonateAmount === amt.toString() ? "default" : "outline"}
                      onClick={() => setQuickDonateAmount(amt.toString())}
                    >
                      ${amt}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Custom Amount"
                  value={quickDonateAmount}
                  onChange={(e) => setQuickDonateAmount(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={() => {
                    if (quickDonateCampaign && quickDonateAmount) {
                      handleDonate(quickDonateCampaign.id, parseFloat(quickDonateAmount));
                      setQuickDonateCampaign(null);
                    }
                  }}
                >
                  Confirm Donation
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
