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
import { Heart, DollarSign, Users, Award, Target, TrendingUp, Calendar, CheckCircle, Plus, Settings, Edit, Trash2, BarChart3, Shield, RefreshCw, PieChart as PieChartIcon, Star, Filter } from "lucide-react";
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
  const [donations, setDonations] = useState<DonationHistory[]>([]); // User's personal donations
  const [allDonations, setAllDonations] = useState<DonationHistory[]>([]); // All donations for analytics
  const [topDonors, setTopDonors] = useState<{ id: string; name: string; amount: number; donations: number }[]>([]);
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
  const [activeTab, setActiveTab] = useState("active-campaigns");
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);

  // Set correct default tab when isAdmin is determined
  useEffect(() => {
    if (isHydrated) {
      setActiveTab(isAdmin ? "manage-campaigns" : "active-campaigns");
    }
  }, [isAdmin, isHydrated]);

  // Advanced Analytics Filters
  const [analyticsDateStart, setAnalyticsDateStart] = useState("");
  const [analyticsDateEnd, setAnalyticsDateEnd] = useState("");
  const [analyticsPurpose, setAnalyticsPurpose] = useState("");
  const [analyticsMinAmount, setAnalyticsMinAmount] = useState("");
  const [analyticsMaxAmount, setAnalyticsMaxAmount] = useState("");
  const [analyticsCampaignCategory, setAnalyticsCampaignCategory] = useState("");

  // Filtered donations for analytics based on advanced filters
  const analyticsFilteredDonations = useMemo(() => {
    return allDonations.filter(donation => {
      // Date range filter
      if (analyticsDateStart) {
        const donationDate = new Date(donation.date);
        const startDate = new Date(analyticsDateStart);
        if (donationDate < startDate) return false;
      }
      if (analyticsDateEnd) {
        const donationDate = new Date(donation.date);
        const endDate = new Date(analyticsDateEnd);
        if (donationDate > endDate) return false;
      }

      // Purpose filter
      if (analyticsPurpose && donation.purpose !== analyticsPurpose) return false;

      // Amount range filter
      if (analyticsMinAmount && donation.amount < parseFloat(analyticsMinAmount)) return false;
      if (analyticsMaxAmount && donation.amount > parseFloat(analyticsMaxAmount)) return false;

      return true;
    });
  }, [allDonations, analyticsDateStart, analyticsDateEnd, analyticsPurpose, analyticsMinAmount, analyticsMaxAmount]);

  // Filtered campaigns for analytics
  const analyticsFilteredCampaigns = useMemo(() => {
    if (!analyticsCampaignCategory) return campaigns;
    return campaigns.filter(c => c.category === analyticsCampaignCategory);
  }, [campaigns, analyticsCampaignCategory]);

  // Get unique values for filter dropdowns
  const uniquePurposes = useMemo(() => {
    return [...new Set(allDonations.map(d => d.purpose || 'General Fund').filter(Boolean))].sort();
  }, [allDonations]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(campaigns.map(c => c.category).filter(Boolean))].sort();
  }, [campaigns]);

  // Clear all analytics filters
  const clearDonationsAnalyticsFilters = () => {
    setAnalyticsDateStart("");
    setAnalyticsDateEnd("");
    setAnalyticsPurpose("");
    setAnalyticsMinAmount("");
    setAnalyticsMaxAmount("");
    setAnalyticsCampaignCategory("");
  };

  // Analytics Data Calculation - Now uses analyticsFilteredDonations
  const donationTrendsData = useMemo(() => {
    if (!analyticsFilteredDonations || analyticsFilteredDonations.length === 0) return [] as { month: string; totalAmount: number; donationCount: number }[];

    const byKey = new Map<string, { month: string; totalAmount: number; donationCount: number }>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (const d of analyticsFilteredDonations) {
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
  }, [analyticsFilteredDonations]);

  const donationsByPurposeData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    analyticsFilteredDonations.forEach(d => {
      const purpose = d.purpose || 'General Fund';
      counts[purpose] = (counts[purpose] || 0) + d.amount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredDonations]);

  const topCampaignsData = useMemo(() => {
    return analyticsFilteredCampaigns
      .map(c => ({
        name: c.title,
        value: Math.min((c.raised / c.goal) * 100, 100),
        raised: c.raised,
        goal: c.goal
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [analyticsFilteredCampaigns]);

  // Additional analytics data
  const totalFilteredAmount = useMemo(() => {
    return analyticsFilteredDonations.reduce((sum, d) => sum + d.amount, 0);
  }, [analyticsFilteredDonations]);

  const avgDonationAmount = useMemo(() => {
    if (analyticsFilteredDonations.length === 0) return 0;
    return Math.round(totalFilteredAmount / analyticsFilteredDonations.length);
  }, [analyticsFilteredDonations, totalFilteredAmount]);

  // Advanced Analytics - Donation Amount Distribution
  const donationDistributionData = useMemo(() => {
    const ranges = [
      { label: '$1-$25', min: 1, max: 25, count: 0, total: 0 },
      { label: '$26-$50', min: 26, max: 50, count: 0, total: 0 },
      { label: '$51-$100', min: 51, max: 100, count: 0, total: 0 },
      { label: '$101-$250', min: 101, max: 250, count: 0, total: 0 },
      { label: '$251-$500', min: 251, max: 500, count: 0, total: 0 },
      { label: '$500+', min: 501, max: Infinity, count: 0, total: 0 },
    ];

    analyticsFilteredDonations.forEach(d => {
      const range = ranges.find(r => d.amount >= r.min && d.amount <= r.max);
      if (range) {
        range.count += 1;
        range.total += d.amount;
      }
    });

    return ranges.map(r => ({
      name: r.label,
      donations: r.count,
      amount: r.total,
      percentage: analyticsFilteredDonations.length > 0
        ? Math.round((r.count / analyticsFilteredDonations.length) * 100)
        : 0
    }));
  }, [analyticsFilteredDonations]);

  // Advanced Analytics - Monthly Comparison (Current vs Previous Period)
  const monthlyComparisonData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const months: { month: string; year: number; monthNum: number; current: number; previous: number; growth: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        monthNum: date.getMonth(),
        current: 0,
        previous: 0,
        growth: 0
      });
    }

    analyticsFilteredDonations.forEach(d => {
      const date = new Date(d.date);
      const monthData = months.find(m =>
        m.monthNum === date.getMonth() && m.year === date.getFullYear()
      );
      if (monthData) {
        monthData.current += d.amount;
      }

      // Check for previous year same month
      const prevYearMonth = months.find(m =>
        m.monthNum === date.getMonth() && m.year === date.getFullYear() - 1
      );
      if (prevYearMonth) {
        prevYearMonth.previous += d.amount;
      }
    });

    return months.map(m => ({
      ...m,
      growth: m.previous > 0 ? Math.round(((m.current - m.previous) / m.previous) * 100) : 0
    }));
  }, [analyticsFilteredDonations]);

  // Advanced Analytics - Day of Week Analysis
  const dayOfWeekData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.map(day => ({ name: day, donations: 0, amount: 0 }));

    analyticsFilteredDonations.forEach(d => {
      const date = new Date(d.date);
      const dayIndex = date.getDay();
      dayStats[dayIndex].donations += 1;
      dayStats[dayIndex].amount += d.amount;
    });

    return dayStats;
  }, [analyticsFilteredDonations]);

  // Advanced Analytics - Cumulative Donations Over Time
  const cumulativeDonationsData = useMemo(() => {
    if (analyticsFilteredDonations.length === 0) return [];

    const sorted = [...analyticsFilteredDonations].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulative = 0;
    const monthlyData: { [key: string]: { month: string; cumulative: number; count: number } } = {};

    sorted.forEach(d => {
      cumulative += d.amount;
      const date = new Date(d.date);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      if (!monthlyData[key]) {
        monthlyData[key] = { month: label, cumulative: 0, count: 0 };
      }
      monthlyData[key].cumulative = cumulative;
      monthlyData[key].count += 1;
    });

    return Object.values(monthlyData).slice(-12);
  }, [analyticsFilteredDonations]);

  // Advanced Analytics - Top Donation Days
  const topDonationDays = useMemo(() => {
    const dayTotals: { [date: string]: { date: string; amount: number; count: number } } = {};

    analyticsFilteredDonations.forEach(d => {
      if (!dayTotals[d.date]) {
        dayTotals[d.date] = { date: d.date, amount: 0, count: 0 };
      }
      dayTotals[d.date].amount += d.amount;
      dayTotals[d.date].count += 1;
    });

    return Object.values(dayTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [analyticsFilteredDonations]);

  // Advanced Analytics - Donation Velocity (donations per day average)
  const donationVelocity = useMemo(() => {
    if (analyticsFilteredDonations.length < 2) return { perDay: 0, perWeek: 0, perMonth: 0 };

    const dates = analyticsFilteredDonations.map(d => new Date(d.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daysDiff = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));

    return {
      perDay: Math.round((analyticsFilteredDonations.length / daysDiff) * 100) / 100,
      perWeek: Math.round((analyticsFilteredDonations.length / daysDiff) * 7 * 10) / 10,
      perMonth: Math.round((analyticsFilteredDonations.length / daysDiff) * 30)
    };
  }, [analyticsFilteredDonations]);

  // User's personal donation stats (for user analytics)
  const userDonationStats = useMemo(() => {
    const userDonations = donations; // Already filtered to user in API for non-admins
    if (userDonations.length === 0) {
      return {
        totalDonated: 0,
        donationCount: 0,
        avgDonation: 0,
        largestDonation: 0,
        firstDonation: null,
        lastDonation: null,
        favoriteCause: 'N/A',
        donationStreak: 0
      };
    }

    const sorted = [...userDonations].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const total = userDonations.reduce((sum, d) => sum + d.amount, 0);
    const largest = Math.max(...userDonations.map(d => d.amount));

    // Find favorite cause
    const causeCounts: { [key: string]: number } = {};
    userDonations.forEach(d => {
      const cause = d.campaign || d.purpose || 'General';
      causeCounts[cause] = (causeCounts[cause] || 0) + d.amount;
    });
    const favoriteCause = Object.entries(causeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalDonated: total,
      donationCount: userDonations.length,
      avgDonation: Math.round(total / userDonations.length),
      largestDonation: largest,
      firstDonation: sorted[0]?.date || null,
      lastDonation: sorted[sorted.length - 1]?.date || null,
      favoriteCause,
      donationStreak: userDonations.length
    };
  }, [donations]);

  useEffect(() => {
    fetchCampaigns();
    fetchDonations();
    fetchAnalyticsDonations();
    fetchStats();
    if (isAdmin) {
      fetchTopDonors();
    }
  }, [isAdmin]);

  // Listen for real-time data updates
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('📡 Data update detected, refreshing donation data...');
      setTimeout(() => {
        fetchCampaigns();
        fetchDonations();
        fetchAnalyticsDonations();
        fetchStats();
        if (isAdmin) {
          fetchTopDonors();
        }
      }, 500);
    };

    window.addEventListener('donationsUpdated', handleDataUpdate);
    window.addEventListener('profileUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('donationsUpdated', handleDataUpdate);
      window.removeEventListener('profileUpdated', handleDataUpdate);
    };
  }, [isAdmin]);

  const fetchTopDonors = async () => {
    try {
      const response = await fetch('/api/donations?type=top-donors', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTopDonors(data.topDonors || []);
      }
    } catch (error) {
      console.error('Error fetching top donors:', error);
    }
  };

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
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  // Fetch real donation statistics from the database
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/donations?type=stats', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setStats({
            totalRaised: data.stats.totalRaised,
            activeDonors: data.stats.activeDonors,
            scholarshipsFunded: data.stats.scholarshipsFunded,
            activeCampaigns: data.stats.activeCampaigns
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        // Stats are now calculated from campaigns in fetchCampaigns
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all donations for analytics (separate from user's donations)
  const fetchAnalyticsDonations = async () => {
    try {
      const response = await fetch('/api/donations?type=analytics', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllDonations(data.donations || []);
      }
    } catch (error) {
      console.error('Error fetching analytics donations:', error);
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
    if (!amount || amount <= 0) {
      setDonationError("Please enter a valid donation amount.");
      return;
    }

    setIsProcessingDonation(true);
    setDonationError(null);

    try {
      // Find campaign title for display
      const campaign = campaigns.find(c => c.id === campaignId);
      const campaignTitle = campaign?.title || campaignId;

      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'user@slu.edu'
        },
        body: JSON.stringify({
          amount,
          campaignId: campaignTitle, // Use campaign title as purpose
          paymentMethod: 'Credit Card',
          donorName: user?.email || 'Anonymous'
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Add the new donation to local state immediately
        const newDonation: DonationHistory = {
          id: data.donation?.id || `DON${Date.now()}`,
          campaign: campaignTitle,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          status: 'Completed',
          purpose: campaignTitle
        };
        setDonations(prev => [newDonation, ...prev]);

        // Update campaign raised amount locally
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId
            ? { ...c, raised: c.raised + amount, donors: c.donors + 1 }
            : c
        ));

        // Update stats
        setStats(prev => ({
          ...prev,
          totalRaised: prev.totalRaised + amount,
          activeDonors: prev.activeDonors + 1
        }));

        setDonationSuccess(true);
        setSelectedAmount(null);
        setCustomAmount("");
        setSelectedCampaign(null);

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('donationsUpdated'));

        // Auto-hide success message after 5 seconds
        setTimeout(() => setDonationSuccess(false), 5000);
      } else {
        setDonationError("Failed to process donation. Please try again.");
      }
    } catch (error) {
      console.error('Donation error:', error);
      setDonationError("Error processing donation. Please try again.");
    } finally {
      setIsProcessingDonation(false);
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

    const campaignData = {
      title: editCampaignData.title.trim(),
      description: editCampaignData.description.trim() || `Support our ${editCampaignData.title.trim()} initiative.`,
      goal: editCampaignData.goal,
      endDate: editCampaignData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      category: editCampaignData.category || "General Fund",
    };

    try {
      // Call the correct API endpoint to persist the campaign
      const response = await fetch('/api/donations/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const result = await response.json();
      console.log('✅ Campaign created successfully:', result);

      // Add the new campaign to local state
      const newCampaign: DonationCampaign = {
        id: result.campaign?.id || `CMP${Date.now()}`,
        title: campaignData.title,
        description: campaignData.description,
        goal: campaignData.goal,
        raised: 0,
        donors: 0,
        endDate: campaignData.endDate,
        category: campaignData.category,
      };

      setCampaigns((prev) => [...prev, newCampaign]);
      setStats((prev) => ({
        ...prev,
        activeCampaigns: prev.activeCampaigns + 1,
      }));

      // Reset form and close dialog
      setEditCampaignData({
        title: "",
        description: "",
        goal: 0,
        endDate: "",
        category: "",
      });
      setIsCreateCampaignOpen(false);

    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(error instanceof Error ? error.message : 'Failed to create campaign. Please try again.');
    }
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
          {/* Donation Success Banner */}
          {donationSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Thank you for your donation!</p>
                  <p className="text-sm text-green-700">Your contribution has been processed successfully.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDonationSuccess(false)}>
                &times;
              </Button>
            </div>
          )}

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
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {isAdmin ? (
                <>
                  <TabsTrigger value="manage-campaigns">Manage Campaigns</TabsTrigger>
                  <TabsTrigger value="donations-overview">Donations Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
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

                  {/* Error Message */}
                  {donationError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">{donationError}</p>
                    </div>
                  )}

                  <Button
                    className="w-full gap-2"
                    size="lg"
                    disabled={!selectedCampaign || (!selectedAmount && !customAmount) || isProcessingDonation}
                    onClick={() => handleDonate(
                      selectedCampaign!,
                      selectedAmount || parseInt(customAmount) || 0
                    )}
                  >
                    {isProcessingDonation ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Heart className="h-4 w-4" />
                        Complete Donation
                      </>
                    )}
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
                        <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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

            {/* Analytics & Insights Tab - Visible to ALL */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Smart Filters Panel */}
              <Card className="border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" />
                        Smart Filters
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Apply filters to analyze specific donation segments in real-time
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(analyticsDateStart || analyticsDateEnd || analyticsPurpose || analyticsMinAmount || analyticsMaxAmount || analyticsCampaignCategory) && (
                        <Button variant="outline" size="sm" onClick={clearDonationsAnalyticsFilters} className="gap-1">
                          <RefreshCw className="h-4 w-4" />
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">From Date</label>
                      <Input
                        type="date"
                        value={analyticsDateStart}
                        onChange={e => setAnalyticsDateStart(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">To Date</label>
                      <Input
                        type="date"
                        value={analyticsDateEnd}
                        onChange={e => setAnalyticsDateEnd(e.target.value)}
                        className="h-9"
                      />
                    </div>

                    {/* Purpose Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Purpose</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={analyticsPurpose}
                        onChange={e => setAnalyticsPurpose(e.target.value)}
                      >
                        <option value="">All Purposes</option>
                        {uniquePurposes.map(purpose => (
                          <option key={purpose} value={purpose}>{purpose}</option>
                        ))}
                      </select>
                    </div>

                    {/* Min Amount */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Min Amount</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={analyticsMinAmount}
                        onChange={e => setAnalyticsMinAmount(e.target.value)}
                      >
                        <option value="">Any</option>
                        <option value="25">$25+</option>
                        <option value="50">$50+</option>
                        <option value="100">$100+</option>
                        <option value="250">$250+</option>
                        <option value="500">$500+</option>
                        <option value="1000">$1,000+</option>
                      </select>
                    </div>

                    {/* Max Amount */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Max Amount</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={analyticsMaxAmount}
                        onChange={e => setAnalyticsMaxAmount(e.target.value)}
                      >
                        <option value="">Any</option>
                        <option value="50">Up to $50</option>
                        <option value="100">Up to $100</option>
                        <option value="250">Up to $250</option>
                        <option value="500">Up to $500</option>
                        <option value="1000">Up to $1,000</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Category</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={analyticsCampaignCategory}
                        onChange={e => setAnalyticsCampaignCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active Filters Pills */}
                  {(analyticsDateStart || analyticsDateEnd || analyticsPurpose || analyticsMinAmount || analyticsMaxAmount || analyticsCampaignCategory) && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-muted-foreground font-medium">ACTIVE:</span>
                      {analyticsDateStart && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          From: {analyticsDateStart}
                          <button onClick={() => setAnalyticsDateStart("")} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {analyticsDateEnd && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          To: {analyticsDateEnd}
                          <button onClick={() => setAnalyticsDateEnd("")} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {analyticsPurpose && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          {analyticsPurpose}
                          <button onClick={() => setAnalyticsPurpose("")} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {analyticsMinAmount && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          ${analyticsMinAmount}+
                          <button onClick={() => setAnalyticsMinAmount("")} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {analyticsMaxAmount && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          ≤${analyticsMaxAmount}
                          <button onClick={() => setAnalyticsMaxAmount("")} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                      {analyticsCampaignCategory && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          {analyticsCampaignCategory}
                          <button onClick={() => setAnalyticsCampaignCategory("")} className="ml-1 hover:text-destructive">×</button>
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Key Metrics Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <DollarSign className="h-8 w-8 text-blue-500" />
                      <Badge variant="outline" className="text-xs">Total</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalFilteredAmount)}</div>
                      <div className="text-xs text-blue-600">Filtered Amount</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Heart className="h-8 w-8 text-green-500" />
                      <Badge variant="outline" className="text-xs">Count</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-green-700">{analyticsFilteredDonations.length}</div>
                      <div className="text-xs text-green-600">Donations</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <TrendingUp className="h-8 w-8 text-purple-500" />
                      <Badge variant="outline" className="text-xs">Avg</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-purple-700">{formatCurrency(avgDonationAmount)}</div>
                      <div className="text-xs text-purple-600">Per Donation</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Target className="h-8 w-8 text-amber-500" />
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-amber-700">{analyticsFilteredCampaigns.length}</div>
                      <div className="text-xs text-amber-600">Campaigns</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Calendar className="h-8 w-8 text-rose-500" />
                      <Badge variant="outline" className="text-xs">Rate</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-rose-700">{donationVelocity.perWeek}</div>
                      <div className="text-xs text-rose-600">Per Week</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-50 to-white border-cyan-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Award className="h-8 w-8 text-cyan-500" />
                      <Badge variant="outline" className="text-xs">Health</Badge>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-cyan-700">
                        {avgDonationAmount >= 500 ? 'Strong' :
                          avgDonationAmount >= 250 ? 'Healthy' :
                            avgDonationAmount >= 100 ? 'Good' : 'Growing'}
                      </div>
                      <div className="text-xs text-cyan-600">Status</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Summary for Users */}
              {!isAdmin && donations.length > 0 && (
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="h-5 w-5 text-primary" />
                      Your Impact Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-white/80 rounded-lg border">
                        <div className="text-xl font-bold text-primary">{formatCurrency(userDonationStats.totalDonated)}</div>
                        <div className="text-xs text-muted-foreground">Total Given</div>
                      </div>
                      <div className="text-center p-3 bg-white/80 rounded-lg border">
                        <div className="text-xl font-bold text-primary">{userDonationStats.donationCount}</div>
                        <div className="text-xs text-muted-foreground">Gifts Made</div>
                      </div>
                      <div className="text-center p-3 bg-white/80 rounded-lg border">
                        <div className="text-xl font-bold text-primary">{formatCurrency(userDonationStats.avgDonation)}</div>
                        <div className="text-xs text-muted-foreground">Avg Gift</div>
                      </div>
                      <div className="text-center p-3 bg-white/80 rounded-lg border">
                        <div className="text-xl font-bold text-primary">{formatCurrency(userDonationStats.largestDonation)}</div>
                        <div className="text-xs text-muted-foreground">Largest</div>
                      </div>
                      <div className="text-center p-3 bg-white/80 rounded-lg border">
                        <div className="text-xl font-bold text-primary truncate">{userDonationStats.favoriteCause}</div>
                        <div className="text-xs text-muted-foreground">Top Cause</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donation Trends - Full Width */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      Giving Trends Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {donationTrendsData.length === 0 ? (
                      <div className="h-56 flex items-center justify-center border-2 border-dashed rounded-lg">
                        <div className="text-center text-muted-foreground">
                          <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No trend data available for selected filters</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={donationTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#003DA5" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#003DA5" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value) => [formatCurrency(value as number), "Amount"]} />
                            <Area type="monotone" dataKey="totalAmount" stroke="#003DA5" fill="url(#trendGradient)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Insights */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium">TOP PURPOSE</div>
                      <div className="text-sm font-semibold text-blue-800 mt-1">
                        {donationsByPurposeData.length > 0
                          ? donationsByPurposeData.reduce((a, b) => a.value > b.value ? a : b).name
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-blue-600 mt-0.5">
                        {donationsByPurposeData.length > 0
                          ? formatCurrency(donationsByPurposeData.reduce((a, b) => a.value > b.value ? a : b).value)
                          : ''}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-xs text-green-600 font-medium">BEST CAMPAIGN</div>
                      <div className="text-sm font-semibold text-green-800 mt-1">
                        {topCampaignsData.length > 0 ? topCampaignsData[0].name : 'N/A'}
                      </div>
                      <div className="text-xs text-green-600 mt-0.5">
                        {topCampaignsData.length > 0 ? `${topCampaignsData[0].value.toFixed(1)}% funded` : ''}
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="text-xs text-amber-600 font-medium">GIVING VELOCITY</div>
                      <div className="text-sm font-semibold text-amber-800 mt-1">
                        {donationVelocity.perMonth} per month
                      </div>
                      <div className="text-xs text-amber-600 mt-0.5">
                        {donationVelocity.perDay} daily average
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Second Row Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Distribution by Size */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4" />
                      Gift Size Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={donationDistributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value, name) => [name === 'donations' ? value : formatCurrency(value as number), name === 'donations' ? 'Count' : 'Amount']} />
                        <Bar dataKey="donations" fill="#003DA5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cumulative Growth */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      Cumulative Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    {cumulativeDonationsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cumulativeDonationsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#53C3EE" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#53C3EE" stopOpacity={0.1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={0} angle={-45} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value) => [formatCurrency(value as number), "Cumulative"]} />
                          <Area type="monotone" dataKey="cumulative" stroke="#53C3EE" fill="url(#cumGradient)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No cumulative data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Giving by Day */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4" />
                      Giving by Weekday
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value) => [value, "Donations"]} />
                        <Bar dataKey="donations" fill="#FFC72C" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Bottom Section - Campaign Progress & Top Days */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Campaign Progress */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      Campaign Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topCampaignsData.slice(0, 5).map((campaign, index) => (
                        <div key={campaign.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate flex-1 mr-2">{campaign.name}</span>
                            <span className="text-muted-foreground">{campaign.value.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(campaign.value, 100)}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(campaign.raised)}</span>
                            <span>{formatCurrency(campaign.goal)}</span>
                          </div>
                        </div>
                      ))}
                      {topCampaignsData.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">No campaign data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Giving Days */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Top Giving Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topDonationDays.length > 0 ? (
                        topDonationDays.map((day, index) => (
                          <div key={day.date} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0 ? 'bg-yellow-500' :
                                  index === 1 ? 'bg-gray-400' :
                                    index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                                }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {new Date(day.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">{day.count} donation{day.count !== 1 ? 's' : ''}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{formatCurrency(day.amount)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground text-sm py-8">No donation data available</p>
                      )}
                    </div>
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
                  {/* Summary Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Total Raised</p>
                            <p className="text-xl font-bold text-blue-700">{formatCurrency(donations.reduce((sum, d) => sum + d.amount, 0))}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Heart className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Donations</p>
                            <p className="text-xl font-bold text-green-700">{donations.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Avg. Gift</p>
                            <p className="text-xl font-bold text-purple-700">{formatCurrency(donations.length > 0 ? donations.reduce((sum, d) => sum + d.amount, 0) / donations.length : 0)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <Users className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Donors</p>
                            <p className="text-xl font-bold text-amber-700">{topDonors.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-primary/20">
                      <CardHeader className="pb-3 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Recent Donations
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {donations.length} total
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          <div className="divide-y">
                            {donations.length > 0 ? donations.map((donation, index) => (
                              <div 
                                key={donation.id} 
                                className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/10 rounded-full">
                                    <Heart className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{donation.campaign}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {donation.date}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-primary">${donation.amount.toLocaleString()}</p>
                                  <Badge 
                                    className={`text-xs ${
                                      donation.status === 'Completed' 
                                        ? 'bg-green-100 text-green-700 border-green-200' 
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    }`}
                                  >
                                    {donation.status}
                                  </Badge>
                                </div>
                              </div>
                            )) : (
                              <div className="text-center py-12 text-muted-foreground">
                                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No donations yet</p>
                                <p className="text-sm">Donations will appear here</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-200/50">
                      <CardHeader className="pb-3 border-b bg-gradient-to-r from-yellow-50/50 to-amber-50/50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Award className="h-5 w-5 text-yellow-500" />
                            Top Donors
                          </CardTitle>
                          <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                            Leaderboard
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          <div className="divide-y">
                            {topDonors.length > 0 ? (
                              topDonors.map((donor, index) => (
                                <div 
                                  key={donor.id} 
                                  className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-all ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-transparent' :
                                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-transparent' :
                                    index === 2 ? 'bg-gradient-to-r from-amber-50 to-transparent' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md ${
                                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                      index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 
                                      'bg-gradient-to-br from-primary/60 to-primary'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-foreground">{donor.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {donor.donations} donation{donor.donations !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold text-lg ${
                                      index === 0 ? 'text-yellow-600' :
                                      index === 1 ? 'text-gray-600' :
                                      index === 2 ? 'text-amber-600' : 'text-primary'
                                    }`}>
                                      ${donor.amount.toLocaleString()}
                                    </p>
                                    {index < 3 && (
                                      <Badge variant="outline" className={`text-xs ${
                                        index === 0 ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                                        index === 1 ? 'border-gray-300 text-gray-600 bg-gray-50' :
                                        'border-amber-300 text-amber-700 bg-amber-50'
                                      }`}>
                                        {index === 0 ? '🥇 Gold' : index === 1 ? '🥈 Silver' : '🥉 Bronze'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12 text-muted-foreground">
                                <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No donor data available</p>
                                <p className="text-sm">Top donors will appear here</p>
                              </div>
                            )}
                          </div>
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
          <Dialog open={!!quickDonateCampaign} onOpenChange={(open) => {
            if (!open) {
              setQuickDonateCampaign(null);
              setQuickDonateAmount("");
              setDonationError(null);
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Donate to {quickDonateCampaign?.title}
                </DialogTitle>
                <DialogDescription>
                  Your contribution helps support {quickDonateCampaign?.category?.toLowerCase()} initiatives.
                </DialogDescription>
              </DialogHeader>

              {/* Campaign Progress */}
              {quickDonateCampaign && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {formatCurrency(quickDonateCampaign.raised)} of {formatCurrency(quickDonateCampaign.goal)}</span>
                    <span className="font-medium">{getProgressPercentage(quickDonateCampaign.raised, quickDonateCampaign.goal).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${getProgressPercentage(quickDonateCampaign.raised, quickDonateCampaign.goal)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Amount</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 100, 250].map(amt => (
                      <Button
                        key={amt}
                        variant={quickDonateAmount === amt.toString() ? "default" : "outline"}
                        onClick={() => setQuickDonateAmount(amt.toString())}
                        className="h-12"
                      >
                        ${amt}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Or Enter Custom Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={quickDonateAmount}
                      onChange={(e) => setQuickDonateAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>

                {donationError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{donationError}</p>
                  </div>
                )}

                {quickDonateAmount && parseFloat(quickDonateAmount) > 0 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Donation:</span>
                      <span className="text-lg font-bold text-primary">{formatCurrency(parseFloat(quickDonateAmount))}</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  size="lg"
                  disabled={!quickDonateAmount || parseFloat(quickDonateAmount) <= 0 || isProcessingDonation}
                  onClick={() => {
                    if (quickDonateCampaign && quickDonateAmount) {
                      handleDonate(quickDonateCampaign.id, parseFloat(quickDonateAmount));
                      setQuickDonateCampaign(null);
                      setQuickDonateAmount("");
                    }
                  }}
                >
                  {isProcessingDonation ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Complete Donation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
