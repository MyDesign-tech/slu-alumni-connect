"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { Users, Star, Clock, MessageCircle, Calendar, Award, Target, TrendingUp, Settings, Edit, Trash2, Plus, Shield, RefreshCw, Filter, BarChart3, CheckCircle, XCircle, Send, Search, Check, X, Mail, GraduationCap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  jobTitle: string;
  company: string;
  graduationYear: number;
  expertise: string[];
  rating: number;
  totalMentees: number;
  availability: string;
  bio: string;
  mentorshipAreas: string[];
}

interface MentorshipRequest {
  id: string;
  mentorName: string;
  menteeName?: string;
  mentorId?: string;
  menteeId?: string;
  mentorEmail?: string;
  menteeEmail?: string;
  area: string;
  status: "REQUESTED" | "ACTIVE" | "COMPLETED" | "ON HOLD" | "DECLINED";
  startDate: string;
  lastInteraction: string;
  rating?: number;
  message?: string;
  requestedAt?: string;
  createdAt?: string;
}

interface MentorshipProgramSettings {
  maxMenteesPerMentor: number;
  sessionDurationMinutes: number;
  programDurationMonths: number;
  autoApprove: "manual" | "auto";
  notifications: {
    newMentorApplications: boolean;
    mentorshipRequests: boolean;
    sessionReminders: boolean;
    programCompletion: boolean;
    feedbackRequests: boolean;
  };
}

export default function MentorshipPage() {
  const { user, isHydrated } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedMinRating, setSelectedMinRating] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [activeTab, setActiveTab] = useState("find-mentors");
  const [mentorshipArea, setMentorshipArea] = useState("");
  const [mentorshipMessage, setMentorshipMessage] = useState("");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [messageDialogMentor, setMessageDialogMentor] = useState<string | null>(null);
  const [scheduleDialogMentor, setScheduleDialogMentor] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [ratingDialogRequest, setRatingDialogRequest] = useState<MentorshipRequest | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [mentorApplicationExperience, setMentorApplicationExperience] = useState("");
  const [mentorApplicationAvailability, setMentorApplicationAvailability] = useState("");
  const [mentorApplicationAreas, setMentorApplicationAreas] = useState<string[]>([]);
  const [mentorApplicationBio, setMentorApplicationBio] = useState("");
  const [mentorApplicationError, setMentorApplicationError] = useState<string | null>(null);
  const [mentorApplicationSubmitted, setMentorApplicationSubmitted] = useState(false);
  const [mentorApplicationStatus, setMentorApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [mentorApplicationDate, setMentorApplicationDate] = useState<string | null>(null);
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isProgramSettingsOpen, setIsProgramSettingsOpen] = useState(false);

  // Pagination state for Find Mentors
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Advanced Analytics Filters
  const [analyticsExpertise, setAnalyticsExpertise] = useState("");
  const [analyticsArea, setAnalyticsArea] = useState("");
  const [analyticsMinRating, setAnalyticsMinRating] = useState("");
  const [analyticsAvailability, setAnalyticsAvailability] = useState("");
  const [analyticsGradYearStart, setAnalyticsGradYearStart] = useState("");
  const [analyticsGradYearEnd, setAnalyticsGradYearEnd] = useState("");

  const [newMentorForm, setNewMentorForm] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    company: "",
    primaryArea: "",
    bio: "",
  });
  const [addMentorError, setAddMentorError] = useState<string | null>(null);
  const [addMentorLoading, setAddMentorLoading] = useState(false);
  const [programSettings, setProgramSettings] = useState<MentorshipProgramSettings>({
    maxMenteesPerMentor: 5,
    sessionDurationMinutes: 60,
    programDurationMonths: 6,
    autoApprove: "manual",
    notifications: {
      newMentorApplications: true,
      mentorshipRequests: true,
      sessionReminders: true,
      programCompletion: true,
      feedbackRequests: true,
    },
  });
  const [programSettingsHydrated, setProgramSettingsHydrated] = useState(false);
  const [saveSettingsStatus, setSaveSettingsStatus] = useState<"idle" | "saved" | "error">("idle");

  // Initialize mentors as empty - will be populated from API
  const [mentors, setMentors] = useState<Mentor[]>([]);

  // Initialize mentorship requests as empty - will be populated based on user activity
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  
  // Incoming mentorship requests (requests where current user is the mentor)
  const [incomingMentorshipRequests, setIncomingMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);

  // Analytics data state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [seasonalityData, setSeasonalityData] = useState<any[]>([]);
  const [mentorshipGrowthData, setMentorshipGrowthData] = useState<any[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // Pending mentor applications state for admin
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [pendingApplicationsLoading, setPendingApplicationsLoading] = useState(false);
  
  // All mentor applications (history) for admin
  const [applicationHistory, setApplicationHistory] = useState<any[]>([]);
  const [applicationHistoryLoading, setApplicationHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Fetch available mentorship areas from API
  const fetchAvailableAreas = async () => {
    try {
      const response = await fetch('/api/mentorship?type=areas', {
        headers: {
          'x-user-email': user?.email || 'user@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.areas && data.areas.length > 0) {
          setAvailableAreas(data.areas);
        }
      }
    } catch (error) {
      console.error('Error fetching mentorship areas:', error);
    }
  };

  // Fetch mentors from API
  const fetchMentors = async () => {
    try {
      setMentorsLoading(true);
      const response = await fetch('/api/mentorship', {
        headers: {
          'x-user-email': user?.email || 'user@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mentors && data.mentors.length > 0) {
          // Transform API data to match Mentor interface
          const transformedMentors: Mentor[] = data.mentors.map((m: any) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            jobTitle: m.jobTitle || 'Professional',
            company: m.company || 'Alumni Network',
            graduationYear: m.graduationYear || 2020,
            expertise: m.areas || m.expertise || ['Career Development'],
            rating: m.avgRating || m.rating || 4.5,
            totalMentees: m.totalMentees || 0,
            availability: m.availability || '2-3 hours/week',
            bio: m.bio || `Experienced professional helping fellow alumni succeed.`,
            mentorshipAreas: m.areas || m.mentorshipAreas || ['CAREER_DEVELOPMENT']
          }));
          
          setMentors(transformedMentors);
          console.log(`✅ Loaded ${transformedMentors.length} mentors from API`);
        }
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setMentorsLoading(false);
    }
  };

  // Fetch mentorship requests from API (Admin only)
  const fetchMentorshipRequests = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch('/api/mentorship/requests', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.requests) {
          const transformed = data.requests.map((r: any) => {
            // Normalize status to uppercase for consistent comparison
            const normalizedStatus = (r.status || 'REQUESTED').toUpperCase() as "REQUESTED" | "ACTIVE" | "COMPLETED";
            return {
              id: r.id,
              mentorName: r.mentorName || `Mentor ${r.mentorId}`,
              menteeName: r.menteeName || `Mentee ${r.menteeId}`,
              mentorId: r.mentorId,
              menteeId: r.menteeId,
              area: r.area,
              status: normalizedStatus,
              startDate: r.startDate,
              lastInteraction: r.lastInteraction || r.lastInteractionDate || r.startDate,
              rating: r.rating || undefined
            };
          });
          setMentorshipRequests(transformed);
          console.log(`📋 Fetched ${transformed.length} mentorship requests`);
        }
      }
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
    }
  };

  // Handle approve mentorship request
  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/mentorship/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        },
        body: JSON.stringify({
          action: 'approve',
          requestId
        })
      });

      if (response.ok) {
        console.log(`✅ Approved mentorship request: ${requestId}`);
        await fetchMentorshipRequests();
        await fetchMentors();
        alert('✅ Mentorship request approved successfully!');
      } else {
        alert('❌ Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('❌ Error approving request');
    }
  };

  // Handle reject mentorship request
  const handleRejectRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this mentorship request?')) return;

    try {
      const response = await fetch('/api/mentorship/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        },
        body: JSON.stringify({
          action: 'reject',
          requestId
        })
      });

      if (response.ok) {
        console.log(`❌ Rejected mentorship request: ${requestId}`);
        await fetchMentorshipRequests();
        alert('Mentorship request rejected and removed');
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  // Handle complete mentorship
  const handleCompleteMentorship = async (requestId: string, rating?: number) => {
    try {
      const response = await fetch('/api/mentorship/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        },
        body: JSON.stringify({
          action: 'complete',
          requestId,
          rating
        })
      });

      if (response.ok) {
        console.log(`🎓 Completed mentorship: ${requestId}`);
        await fetchMentorshipRequests();
        await fetchMentors();
        alert('✅ Mentorship marked as completed!');
      } else {
        alert('Failed to complete mentorship');
      }
    } catch (error) {
      console.error('Error completing mentorship:', error);
      alert('Error completing mentorship');
    }
  };

  // Fetch mentor application status for current user
  const fetchMentorApplicationStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/mentorship/apply', {
        headers: {
          'x-user-email': user.email
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.application) {
          const status = data.application.status?.toLowerCase();
          setMentorApplicationSubmitted(true);
          setMentorApplicationStatus(status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending');
          setMentorApplicationDate(data.application.submittedAt ? new Date(data.application.submittedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : null);
          // Also load the application details
          if (data.application.experience) {
            setMentorApplicationExperience(data.application.experience);
          }
          if (data.application.availability) {
            setMentorApplicationAvailability(data.application.availability);
          }
          if (data.application.areas && data.application.areas.length > 0) {
            setMentorApplicationAreas(data.application.areas);
          }
          if (data.application.bio) {
            setMentorApplicationBio(data.application.bio);
          }
        } else {
          setMentorApplicationSubmitted(false);
          setMentorApplicationStatus('none');
        }
      }
    } catch (error) {
      console.error('Error fetching mentor application status:', error);
    }
  };

  // Fetch approved mentors for "Find Mentors" tab
  const fetchApprovedMentors = async () => {
    try {
      setMentorsLoading(true);
      const response = await fetch('/api/mentorship/mentors', {
        headers: {
          'x-user-email': user?.email || 'user@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.mentors && data.mentors.length > 0) {
          const transformedMentors: Mentor[] = data.mentors.map((m: any) => ({
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email || '',
            jobTitle: m.jobTitle || 'Professional',
            company: m.company || 'Alumni Network',
            graduationYear: m.graduationYear || 2020,
            expertise: m.expertise || ['Career Development'],
            rating: m.rating || 4.5,
            totalMentees: m.totalMentees || 0,
            availability: m.availability || '2-3 hours/week',
            bio: m.bio || `Experienced professional helping fellow alumni succeed.`,
            mentorshipAreas: m.mentorshipAreas || ['CAREER_DEVELOPMENT']
          }));
          
          setMentors(transformedMentors);
          console.log(`✅ Loaded ${transformedMentors.length} mentors (approved + CSV)`);
        }
      }
    } catch (error) {
      console.error('Error fetching approved mentors:', error);
      // Fallback to the original fetchMentors
      await fetchMentors();
    } finally {
      setMentorsLoading(false);
    }
  };

  // Fetch pending mentor applications for admin
  const fetchPendingApplications = async () => {
    if (!isAdmin) return;
    
    try {
      setPendingApplicationsLoading(true);
      const response = await fetch('/api/mentorship/approve?status=pending', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.applications) {
          setPendingApplications(data.applications);
          console.log(`📋 Fetched ${data.applications.length} pending mentor applications`);
        }
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error);
    } finally {
      setPendingApplicationsLoading(false);
    }
  };

  // Fetch all mentor applications history for admin
  const fetchApplicationHistory = async () => {
    if (!isAdmin) return;
    
    try {
      setApplicationHistoryLoading(true);
      const response = await fetch('/api/mentorship/approve?status=all', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.applications) {
          setApplicationHistory(data.applications);
          console.log(`📋 Fetched ${data.applications.length} total mentor applications (history)`);
        }
      }
    } catch (error) {
      console.error('Error fetching application history:', error);
    } finally {
      setApplicationHistoryLoading(false);
    }
  };

  // Fetch user's mentorship requests (both as mentee and as mentor)
  const fetchMyMentorshipRequests = async () => {
    if (!user?.email) return;
    
    setMyRequestsLoading(true);
    try {
      const response = await fetch(`/api/mentorship?type=my-requests`, {
        headers: {
          'x-user-email': user.email
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 My mentorship requests:', data);
        // For non-admin users, use myRequests for the mentorshipRequests state
        // For admin users, this is already populated by fetchMentorshipRequests()
        if (!isAdmin) {
          setMentorshipRequests(data.myRequests || []);
        }
        // Requests where I am the mentor (used by "My Mentorships" tab)
        setIncomingMentorshipRequests(data.incomingRequests || []);
      }
    } catch (error) {
      console.error('Error fetching mentorship requests:', error);
    } finally {
      setMyRequestsLoading(false);
    }
  };

  // Handle mentor accepting or declining a mentorship request
  const handleMentorshipResponse = async (requestId: string, action: 'accept' | 'decline') => {
    if (!user?.email) return;
    
    try {
      const response = await fetch('/api/mentorship', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email
        },
        body: JSON.stringify({
          requestId,
          action
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${action === 'accept' ? 'Accepted' : 'Declined'} mentorship request:`, data);
        alert(`✅ Mentorship request ${action === 'accept' ? 'accepted' : 'declined'}!`);
        // Refresh the requests
        await fetchMyMentorshipRequests();
      } else {
        const data = await response.json();
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error responding to mentorship request:', error);
      alert('❌ Error responding to request');
    }
  };

  // Handle admin approve mentor application
  const handleApproveApplication = async (applicationId: string) => {
    try {
      const response = await fetch('/api/mentorship/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        },
        body: JSON.stringify({
          applicationId,
          action: 'approve'
        })
      });

      if (response.ok) {
        console.log(`✅ Approved mentor application: ${applicationId}`);
        await fetchPendingApplications();
        await fetchApplicationHistory(); // Refresh history after approval
        await fetchApprovedMentors();
        alert('✅ Mentor application approved! They will now appear in Find Mentors.');
      } else {
        const data = await response.json();
        alert(`❌ Failed to approve: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('❌ Error approving application');
    }
  };

  // Handle admin reject mentor application
  const handleRejectApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to reject this mentor application?')) return;

    try {
      const response = await fetch('/api/mentorship/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        },
        body: JSON.stringify({
          applicationId,
          action: 'reject'
        })
      });

      if (response.ok) {
        console.log(`❌ Rejected mentor application: ${applicationId}`);
        await fetchPendingApplications();
        await fetchApplicationHistory(); // Refresh history after rejection
        alert('Mentor application rejected');
      } else {
        const data = await response.json();
        alert(`Failed to reject: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error rejecting application');
    }
  };

  useEffect(() => {
    // Only fetch data after hydration is complete
    if (!isHydrated) return;
    
    console.log(`🔍 [MENTORSHIP] isAdmin: ${isAdmin}, isHydrated: ${isHydrated}, email: ${user?.email}`);
    
    fetchApprovedMentors();
    fetchMentorApplicationStatus();
    fetchAvailableAreas();
    fetchMyMentorshipRequests(); // Fetch user's mentorship requests (both as mentee and mentor)
    if (isAdmin) {
      console.log('🔐 [ADMIN] Fetching admin data...');
      fetchMentorshipRequests();
      fetchPendingApplications();
      fetchApplicationHistory(); // Fetch all mentor application history
    }
  }, [user?.email, isAdmin, isHydrated]);

          // Fetch analytics data
          useEffect(() => {
            const fetchAnalytics = async () => {
              setAnalyticsLoading(true);
              try {
                const response = await fetch('/api/mentorship/analytics');
                if (response.ok) {
                  const data = await response.json();
                  setAnalyticsData(data);
                  setSeasonalityData(data.seasonalityData || []);

                  // Calculate growth data from real mentorship records
                  if (data.growthData && data.growthData.length > 0) {
                    setMentorshipGrowthData(data.growthData);
                  } else {
                    // Fallback: generate from current data
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const currentMonth = new Date().getMonth();
                    const recentMonths = months.slice(Math.max(0, currentMonth - 6), currentMonth + 1);

                    setMentorshipGrowthData(recentMonths.map((month, idx) => ({
                      month,
                      activeMentorships: Math.floor(mentors.length * (0.7 + idx * 0.05)),
                      approvedMentors: Math.floor(mentors.length * (0.4 + idx * 0.04))
                    })));
                  }
                }
              } catch (error) {
                console.error('Error fetching mentorship analytics:', error);
              } finally {
                setAnalyticsLoading(false);
              }
            };

            if (activeTab === 'analytics') {
              fetchAnalytics();
            }
          }, [activeTab, mentors.length]);

          // Listen for real-time data updates
          useEffect(() => {
            const handleDataUpdate = () => {
              console.log('📡 Data update detected, refreshing mentorship data...');
              fetchMentors();
            };

            window.addEventListener('mentorshipUpdated', handleDataUpdate);
            window.addEventListener('profileUpdated', handleDataUpdate);

            return () => {
              window.removeEventListener('mentorshipUpdated', handleDataUpdate);
              window.removeEventListener('profileUpdated', handleDataUpdate);
            };
          }, []);

          // Analytics Data Preparation
          // Filtered mentors for analytics based on advanced filters
          const analyticsFilteredMentors = useMemo(() => {
            return mentors.filter(mentor => {
              // Expertise filter
              if (analyticsExpertise && !mentor.expertise.includes(analyticsExpertise)) return false;

              // Mentorship area filter
              if (analyticsArea && !mentor.mentorshipAreas.includes(analyticsArea)) return false;

              // Minimum rating filter
              if (analyticsMinRating && mentor.rating < parseFloat(analyticsMinRating)) return false;

              // Availability filter
              if (analyticsAvailability && !mentor.availability.toLowerCase().includes(analyticsAvailability.toLowerCase())) return false;

              // Graduation year range filter
              if (analyticsGradYearStart && mentor.graduationYear < parseInt(analyticsGradYearStart)) return false;
              if (analyticsGradYearEnd && mentor.graduationYear > parseInt(analyticsGradYearEnd)) return false;

              return true;
            });
          }, [mentors, analyticsExpertise, analyticsArea, analyticsMinRating, analyticsAvailability, analyticsGradYearStart, analyticsGradYearEnd]);

          // Get unique values for filter dropdowns
          const uniqueExpertise = useMemo(() => {
            const expertiseSet = new Set<string>();
            mentors.forEach(m => m.expertise.forEach(e => expertiseSet.add(e)));
            return [...expertiseSet].sort();
          }, [mentors]);

          const uniqueAreas = useMemo(() => {
            const areasSet = new Set<string>();
            mentors.forEach(m => m.mentorshipAreas.forEach(a => areasSet.add(a)));
            return [...areasSet].sort();
          }, [mentors]);

          const uniqueAvailabilities = useMemo(() => {
            return [...new Set(mentors.map(m => m.availability).filter(Boolean))].sort();
          }, [mentors]);

          const gradYearRange = useMemo(() => {
            const years = mentors.map(m => m.graduationYear).filter(Boolean);
            if (years.length === 0) return { min: 2000, max: new Date().getFullYear() };
            return { min: Math.min(...years), max: Math.max(...years) };
          }, [mentors]);

          // Clear all analytics filters
          const clearMentorshipAnalyticsFilters = () => {
            setAnalyticsExpertise("");
            setAnalyticsArea("");
            setAnalyticsMinRating("");
            setAnalyticsAvailability("");
            setAnalyticsGradYearStart("");
            setAnalyticsGradYearEnd("");
          };

          // Analytics uses analyticsFilteredMentors
          const expertiseDistribution = useMemo(() => {
            const areas: Record<string, number> = {};
            analyticsFilteredMentors.forEach(m => {
              m.expertise.forEach(exp => {
                areas[exp] = (areas[exp] || 0) + 1;
              });
            });
            return Object.entries(areas)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, value]) => ({ name, value }));
          }, [analyticsFilteredMentors]);

          const mentorshipAreasDistribution = useMemo(() => {
            const areas: Record<string, number> = {};
            analyticsFilteredMentors.forEach(m => {
              m.mentorshipAreas.forEach(area => {
                const formattedArea = area.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                areas[formattedArea] = (areas[formattedArea] || 0) + 1;
              });
            });
            return Object.entries(areas).map(([name, value]) => ({ name, value }));
          }, [analyticsFilteredMentors]);

          const mentorRatingsDistribution = useMemo(() => {
            const ratings = { '5 Stars': 0, '4 Stars': 0, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 };
            analyticsFilteredMentors.forEach(m => {
              const r = Math.round(m.rating);
              if (r >= 4.5) ratings['5 Stars']++;
              else if (r >= 3.5) ratings['4 Stars']++;
              else if (r >= 2.5) ratings['3 Stars']++;
              else if (r >= 1.5) ratings['2 Stars']++;
              else ratings['1 Star']++;
            });
            return Object.entries(ratings).map(([name, value]) => ({ name, value }));
          }, [analyticsFilteredMentors]);

          // Additional analytics data
          const avgMentorRating = useMemo(() => {
            if (analyticsFilteredMentors.length === 0) return 0;
            const sum = analyticsFilteredMentors.reduce((acc, m) => acc + m.rating, 0);
            return (sum / analyticsFilteredMentors.length).toFixed(1);
          }, [analyticsFilteredMentors]);

          const totalMentees = useMemo(() => {
            return analyticsFilteredMentors.reduce((acc, m) => acc + m.totalMentees, 0);
          }, [analyticsFilteredMentors]);

          // User Analytics - Mentor by Company Distribution
          const mentorsByCompany = useMemo(() => {
            const companies: { [key: string]: number } = {};
            analyticsFilteredMentors.forEach(m => {
              const company = m.company || 'Independent';
              companies[company] = (companies[company] || 0) + 1;
            });
            return Object.entries(companies)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 8);
          }, [analyticsFilteredMentors]);

          // User Analytics - Mentor by Graduation Year Distribution
          const mentorsByGradYear = useMemo(() => {
            const years: { [key: string]: number } = {};
            analyticsFilteredMentors.forEach(m => {
              const year = m.graduationYear?.toString() || 'Unknown';
              years[year] = (years[year] || 0) + 1;
            });
            return Object.entries(years)
              .map(([year, count]) => ({ year, count }))
              .sort((a, b) => parseInt(a.year) - parseInt(b.year))
              .slice(-10);
          }, [analyticsFilteredMentors]);

          // User Analytics - Top Rated Mentors
          const topRatedMentors = useMemo(() => {
            return [...analyticsFilteredMentors]
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 5);
          }, [analyticsFilteredMentors]);

          // User Analytics - Most Active Mentors (by mentees)
          const mostActiveMentors = useMemo(() => {
            return [...analyticsFilteredMentors]
              .sort((a, b) => b.totalMentees - a.totalMentees)
              .slice(0, 5);
          }, [analyticsFilteredMentors]);

          // User Analytics - Availability Distribution
          const availabilityDistribution = useMemo(() => {
            const avail: { [key: string]: number } = {};
            analyticsFilteredMentors.forEach(m => {
              const availability = m.availability || 'Not specified';
              avail[availability] = (avail[availability] || 0) + 1;
            });
            return Object.entries(avail).map(([name, value]) => ({ name, value }));
          }, [analyticsFilteredMentors]);

          // User Analytics - Experience Level Distribution (based on graduation year)
          const experienceLevelDistribution = useMemo(() => {
            const currentYear = new Date().getFullYear();
            const levels = { 'Early Career (0-5 yrs)': 0, 'Mid Career (6-10 yrs)': 0, 'Senior (11-20 yrs)': 0, 'Executive (20+ yrs)': 0 };
            analyticsFilteredMentors.forEach(m => {
              const yearsExp = currentYear - (m.graduationYear || currentYear);
              if (yearsExp <= 5) levels['Early Career (0-5 yrs)']++;
              else if (yearsExp <= 10) levels['Mid Career (6-10 yrs)']++;
              else if (yearsExp <= 20) levels['Senior (11-20 yrs)']++;
              else levels['Executive (20+ yrs)']++;
            });
            return Object.entries(levels).map(([name, value]) => ({ name, value }));
          }, [analyticsFilteredMentors]);

          // User Analytics Filters
          const [userAnalyticsCompany, setUserAnalyticsCompany] = useState("");
          const [userAnalyticsMinRating, setUserAnalyticsMinRating] = useState("");
          const [userAnalyticsArea, setUserAnalyticsArea] = useState("");

          // Get unique companies for filter
          const uniqueCompanies = useMemo(() => {
            return [...new Set(mentors.map(m => m.company).filter(Boolean))].sort();
          }, [mentors]);

          // User-filtered mentors for analytics
          const userFilteredMentors = useMemo(() => {
            return mentors.filter(mentor => {
              if (userAnalyticsCompany && mentor.company !== userAnalyticsCompany) return false;
              if (userAnalyticsMinRating && mentor.rating < parseFloat(userAnalyticsMinRating)) return false;
              if (userAnalyticsArea && !mentor.mentorshipAreas.includes(userAnalyticsArea)) return false;
              return true;
            });
          }, [mentors, userAnalyticsCompany, userAnalyticsMinRating, userAnalyticsArea]);

          // Clear user analytics filters
          const clearUserAnalyticsFilters = () => {
            setUserAnalyticsCompany("");
            setUserAnalyticsMinRating("");
            setUserAnalyticsArea("");
          };

          const COLORS = ['#003DA5', '#53C3EE', '#FFC72C', '#8FD6BD', '#795D3E', '#ED8B00'];

          const filteredMentors = mentors.filter(mentor => {
            const matchesSearch =
              mentor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mentor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mentor.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mentor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
              mentor.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesArea = !selectedArea || mentor.mentorshipAreas.includes(selectedArea);
            const matchesCompany = !selectedCompany || mentor.company.toLowerCase() === selectedCompany.toLowerCase();
            const matchesRating = !selectedMinRating || mentor.rating >= parseFloat(selectedMinRating);
            const matchesAvailability = !selectedAvailability || mentor.availability.toLowerCase().includes(selectedAvailability.toLowerCase());

            return matchesSearch && matchesArea && matchesCompany && matchesRating && matchesAvailability;
          });

          // Pagination calculation
          const totalPages = Math.ceil(filteredMentors.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedMentors = filteredMentors.slice(startIndex, endIndex);

          // Clear all Find Mentors filters
          const clearFindMentorFilters = () => {
            setSearchTerm("");
            setSelectedArea("");
            setSelectedCompany("");
            setSelectedMinRating("");
            setSelectedAvailability("");
            setCurrentPage(1);
          };

          // Check if any filters are active
          const hasActiveFilters = searchTerm || selectedArea || selectedCompany || selectedMinRating || selectedAvailability;

          const handleRequestMentorship = async (mentor: Mentor) => {
            if (!mentorshipArea) {
              alert("Please select a mentorship area.");
              return;
            }

            try {
              const response = await fetch('/api/mentorship', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-email': user?.email || 'user@slu.edu'
                },
                body: JSON.stringify({
                  mentorId: mentor.id,
                  mentorEmail: mentor.email || '',
                  mentorName: `${mentor.firstName} ${mentor.lastName}`,
                  area: mentorshipArea,
                  message: mentorshipMessage
                })
              });

              if (response.ok) {
                const data = await response.json().catch(() => null as any);
                const apiRequest = (data && data.request) || null;

                const newRequest: MentorshipRequest = {
                  id: apiRequest?.id || `REQ-${Date.now()}`,
                  mentorName: `${mentor.firstName} ${mentor.lastName}`,
                  area: mentorshipArea,
                  status: "REQUESTED",
                  startDate: "",
                  lastInteraction: "Pending response",
                };

                setMentorshipRequests((prev) => [...prev, newRequest]);

                // For alumni, take them straight to their requests
                if (!isAdmin) {
                  setActiveTab("my-mentorships");
                }

                alert(`Mentorship request sent to ${mentor.firstName} ${mentor.lastName} for ${mentorshipArea}!`);
                setIsRequestDialogOpen(false);
                setMentorshipArea("");
                setMentorshipMessage("");
                setSelectedMentor(null);
              } else {
                alert("Failed to send mentorship request. Please try again.");
              }
            } catch (error) {
              console.error('Mentorship request error:', error);
              alert("Error sending mentorship request. Please try again.");
            }
          };

          const [editingRequest, setEditingRequest] = useState<MentorshipRequest | null>(null);
          const [editingStatus, setEditingStatus] = useState<MentorshipRequest["status"]>("ACTIVE");
          const [reviewMentor, setReviewMentor] = useState<Mentor | null>(null);
          const [approvedMentorIds, setApprovedMentorIds] = useState<string[]>([]);
          const [rejectedMentorIds, setRejectedMentorIds] = useState<string[]>([]);
          const [pendingMentorIds, setPendingMentorIds] = useState<string[]>([]);
          const [approvalsHydrated, setApprovalsHydrated] = useState(false);

          // Initialize pending mentors when mentors are loaded
          useEffect(() => {
            if (mentors.length > 0 && pendingMentorIds.length === 0 && !approvalsHydrated) {
              setPendingMentorIds(mentors.slice(0, 3).map((m) => m.id));
            }
          }, [mentors, pendingMentorIds.length, approvalsHydrated]);

          // Ensure the correct default tab once auth state is hydrated
          useEffect(() => {
            if (!isHydrated) return;
            setActiveTab(prev => {
              if (isAdmin) {
                // If we were on a mentee-facing tab, switch to manage-mentorships
                if (prev === "find-mentors" || prev === "my-mentorships" || prev === "become-mentor") {
                  return "manage-mentorships";
                }
                return prev || "manage-mentorships";
              } else {
                // For non-admins, default to find-mentors if we were on an admin tab
                if (prev === "manage-mentorships" || prev === "mentor-approval" || prev === "analytics" || prev === "settings") {
                  return "find-mentors";
                }
                return prev || "find-mentors";
              }
            });
          }, [isHydrated, isAdmin]);

          // Persist mentor approval decisions for this browser session
          useEffect(() => {
            if (typeof window === 'undefined') return;

            try {
              const storedApproved = window.localStorage.getItem('mentorship_approvedMentorIds');
              const storedRejected = window.localStorage.getItem('mentorship_rejectedMentorIds');
              const storedPending = window.localStorage.getItem('mentorship_pendingMentorIds');

              if (storedApproved) {
                const parsed = JSON.parse(storedApproved);
                if (Array.isArray(parsed)) {
                  setApprovedMentorIds(parsed);
                }
              }

              if (storedRejected) {
                const parsed = JSON.parse(storedRejected);
                if (Array.isArray(parsed)) {
                  setRejectedMentorIds(parsed);
                }
              }

              if (storedPending) {
                const parsed = JSON.parse(storedPending);
                if (Array.isArray(parsed)) {
                  setPendingMentorIds(parsed);
                }
              }

              setApprovalsHydrated(true);
            } catch (error) {
              console.error('Failed to load mentorship approval state from storage:', error);
            }
          }, []);

          useEffect(() => {
            if (typeof window === 'undefined') return;
            try {
              const stored = window.localStorage.getItem('mentorship_program_settings');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                  setProgramSettings((prev) => ({
                    ...prev,
                    ...parsed,
                    notifications: {
                      ...prev.notifications,
                      ...(parsed.notifications || {}),
                    },
                  }));
                }
              }
            } catch (error) {
              console.error('Failed to load mentorship program settings from storage:', error);
            } finally {
              setProgramSettingsHydrated(true);
            }
          }, []);

          useEffect(() => {
            if (!approvalsHydrated) return;
            if (typeof window === 'undefined') return;
            try {
              window.localStorage.setItem('mentorship_approvedMentorIds', JSON.stringify(approvedMentorIds));
            } catch (error) {
              console.error('Failed to persist approved mentors:', error);
            }
          }, [approvedMentorIds]);

          useEffect(() => {
            if (!approvalsHydrated) return;
            if (typeof window === 'undefined') return;
            try {
              window.localStorage.setItem('mentorship_rejectedMentorIds', JSON.stringify(rejectedMentorIds));
            } catch (error) {
              console.error('Failed to persist rejected mentors:', error);
            }
          }, [rejectedMentorIds]);

          useEffect(() => {
            if (!approvalsHydrated) return;
            if (typeof window === 'undefined') return;
            try {
              window.localStorage.setItem('mentorship_pendingMentorIds', JSON.stringify(pendingMentorIds));
            } catch (error) {
              console.error('Failed to persist pending mentors:', error);
            }
          }, [pendingMentorIds]);

          const getStatusColor = (status: string) => {
            const normalizedStatus = (status || '').toUpperCase();
            const colors: Record<string, string> = {
              REQUESTED: "bg-yellow-100 text-yellow-800",
              ACTIVE: "bg-green-100 text-green-800",
              COMPLETED: "bg-blue-100 text-blue-800",
              "ON HOLD": "bg-orange-100 text-orange-800",
              ON_HOLD: "bg-orange-100 text-orange-800"
            };
            return colors[normalizedStatus] || "bg-gray-100 text-gray-800";
          };

          // Format area code to readable text (e.g., "CAREER_DEVELOPMENT" -> "Career Development")
          const formatArea = (area: string) => {
            if (!area) return 'General';
            return area
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase());
          };

          const renderStars = (rating: number) => {
            return Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ));
          };

          const handleSaveNewMentor = async () => {
            const { firstName, lastName, jobTitle, company, primaryArea, bio } = newMentorForm;

            if (!firstName.trim() || !lastName.trim() || !jobTitle.trim() || !company.trim() || !primaryArea) {
              setAddMentorError("Please fill in all required fields.");
              return;
            }

            setAddMentorLoading(true);
            setAddMentorError(null);

            const areaLabelMap: Record<string, string> = {
              CAREER_DEVELOPMENT: "Career Development",
              TECHNICAL_SKILLS: "Technical Skills",
              LEADERSHIP: "Leadership",
              ENTREPRENEURSHIP: "Entrepreneurship",
              NETWORKING: "Networking",
              ACADEMIC_GUIDANCE: "Academic Guidance",
            };

            const timestamp = Date.now();
            const newMentor = {
              id: `MENTOR-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: `${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}${timestamp}@slu.edu`,
              jobTitle: jobTitle.trim(),
              company: company.trim(),
              graduationYear: new Date().getFullYear(),
              expertise: [areaLabelMap[primaryArea] || "Mentorship"],
              areas: [primaryArea],
              mentorshipAreas: [primaryArea],
              availability: "2-3 hours/week",
              bio: bio.trim() || `${firstName} ${lastName} is available for mentorship.`,
              rating: 0,
              totalMentees: 0,
            };

            try {
              // Call API to persist the mentor
              const response = await fetch("/api/mentorship/mentors", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-email": user?.email || "admin@slu.edu",
                },
                body: JSON.stringify({ mentor: newMentor }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add mentor");
              }

              const result = await response.json();
              console.log("✅ Mentor added successfully:", result);

              // Refresh the mentors list from API
              const mentorsResponse = await fetch("/api/mentorship/mentors", {
                headers: { "x-user-email": user?.email || "admin@slu.edu" },
              });
              if (mentorsResponse.ok) {
                const mentorsData = await mentorsResponse.json();
                setMentors(mentorsData.mentors || []);
              }

              // Reset form and close dialog
              setNewMentorForm({
                firstName: "",
                lastName: "",
                jobTitle: "",
                company: "",
                primaryArea: "",
                bio: "",
              });
              setAddMentorError(null);
              setIsAddMentorOpen(false);
            } catch (error) {
              console.error("Error adding mentor:", error);
              setAddMentorError(error instanceof Error ? error.message : "Failed to add mentor. Please try again.");
            } finally {
              setAddMentorLoading(false);
            }
          };

          const handleApproveMentor = (mentorId: string) => {
            setApprovedMentorIds((prev) => (prev.includes(mentorId) ? prev : [...prev, mentorId]));
            setPendingMentorIds((prev) => prev.filter((id) => id !== mentorId));
            setRejectedMentorIds((prev) => prev.filter((id) => id !== mentorId));
          };

          const handleRejectMentor = (mentorId: string) => {
            setRejectedMentorIds((prev) => (prev.includes(mentorId) ? prev : [...prev, mentorId]));
            setPendingMentorIds((prev) => prev.filter((id) => id !== mentorId));
            setApprovedMentorIds((prev) => prev.filter((id) => id !== mentorId));
          };

          const handleSaveProgramSettings = () => {
            if (typeof window === "undefined") return;
            try {
              window.localStorage.setItem("mentorship_program_settings", JSON.stringify(programSettings));
              setSaveSettingsStatus("saved");
            } catch (error) {
              console.error("Failed to save mentorship program settings:", error);
              setSaveSettingsStatus("error");
            } finally {
              setTimeout(() => setSaveSettingsStatus("idle"), 2000);
            }
          };

          const handleSubmitMentorApplication = async () => {
            if (!user) {
              alert("You need to be logged in to submit a mentor application.");
              return;
            }

            if (
              !mentorApplicationExperience ||
              !mentorApplicationAvailability ||
              mentorApplicationAreas.length === 0 ||
              !mentorApplicationBio.trim()
            ) {
              setMentorApplicationError(
                "Please select experience, availability, at least one area of expertise, and add a short bio."
              );
              return;
            }

            const profile = user.profile;
            const firstName = profile?.firstName || user.email.split("@")[0] || "Alumni";
            const lastName = profile?.lastName || "";
            const jobTitle = profile?.jobTitle || "Mentor";
            const company = profile?.currentEmployer || "SLU Alumni";
            const graduationYear = profile?.graduationYear || new Date().getFullYear();

            const labelToCode: Record<string, string> = {
              "Career Development": "CAREER_DEVELOPMENT",
              "Technical Skills": "TECHNICAL_SKILLS",
              Leadership: "LEADERSHIP",
              Entrepreneurship: "ENTREPRENEURSHIP",
              Networking: "NETWORKING",
              "Academic Guidance": "ACADEMIC_GUIDANCE",
            };

            const mentorshipAreas = Array.from(
              new Set(mentorApplicationAreas.map((label) => labelToCode[label] || "CAREER_DEVELOPMENT"))
            );

            try {
              // Call the API to submit mentor application
              const response = await fetch('/api/mentorship/apply', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-email': user.email,
                },
                body: JSON.stringify({
                  firstName,
                  lastName: lastName || "Mentor",
                  jobTitle,
                  company,
                  graduationYear,
                  areas: mentorshipAreas,
                  availability: mentorApplicationAvailability,
                  bio: mentorApplicationBio.trim(),
                  experience: mentorApplicationExperience,
                }),
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || 'Failed to submit application');
              }

              // Update local state to reflect submission
              setMentorApplicationSubmitted(true);
              setMentorApplicationStatus('pending');
              setMentorApplicationDate(new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }));
              setMentorApplicationError(null);
              
              // Refresh the data
              fetchMentorApplicationStatus();
            } catch (error) {
              console.error('Error submitting mentor application:', error);
              setMentorApplicationError(
                error instanceof Error ? error.message : 'Failed to submit application. Please try again.'
              );
            }
          };

          const mentorshipAreasData = useMemo(() => {
            const counts: Record<string, number> = {};
            mentors.forEach(m => {
              m.mentorshipAreas.forEach(area => {
                const label = area.replace(/_/g, ' ');
                counts[label] = (counts[label] || 0) + 1;
              });
            });
            return Object.entries(counts)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value);
          }, [mentors]);

          const mentorRatingsData = useMemo(() => {
            const counts = { '5 Stars': 0, '4 Stars': 0, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 };
            mentors.forEach(m => {
              const rating = Math.round(m.rating);
              if (rating >= 5) counts['5 Stars']++;
              else if (rating === 4) counts['4 Stars']++;
              else if (rating === 3) counts['3 Stars']++;
              else if (rating === 2) counts['2 Stars']++;
              else counts['1 Star']++;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
          }, [mentors]);

          return (
            <ProtectedRoute>
              <MainLayout>
                <div className="container mx-auto px-4 py-8">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h1 className="text-4xl font-bold text-primary mb-4">
                        {isAdmin ? "Mentorship Program" : "Mentorship Hub"}
                      </h1>
                      <p className="text-lg text-muted-foreground max-w-2xl">
                        {isAdmin
                          ? "Approve mentors, review requests, and monitor mentorship outcomes."
                          : "Find mentors, manage your mentorship requests, or apply to become a mentor."}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button onClick={() => setIsAddMentorOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Mentor
                        </Button>
                        <Button variant="outline" onClick={() => setIsProgramSettingsOpen(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Program Settings
                        </Button>
                      </div>
                    )}
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="flex flex-wrap gap-2 mb-6">
                      <TabsTrigger value="find-mentors">
                        {isAdmin ? "Mentor Directory" : "Find Mentors"}
                      </TabsTrigger>
                      {!isAdmin && (
                        <>
                          <TabsTrigger value="my-mentorships">My Mentorships</TabsTrigger>
                          <TabsTrigger value="become-mentor">Become a Mentor</TabsTrigger>
                          <TabsTrigger value="user-analytics" className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                          </TabsTrigger>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <TabsTrigger value="mentor-approval">Mentor Approval</TabsTrigger>
                          <TabsTrigger value="analytics">Analytics</TabsTrigger>
                          <TabsTrigger value="settings">Settings</TabsTrigger>
                        </>
                      )}

                      {/* Advanced Filters Row - Only for non-admin users */}
                      {!isAdmin && showAdvancedFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                          {/* Company Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Company</label>
                            <select
                              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                              value={selectedCompany}
                              onChange={(e) => setSelectedCompany(e.target.value)}
                            >
                              <option value="">All Companies</option>
                              {uniqueCompanies.slice(0, 15).map(company => (
                                <option key={company} value={company}>{company}</option>
                              ))}
                            </select>
                          </div>

                          {/* Minimum Rating Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Minimum Rating</label>
                            <select
                              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                              value={selectedMinRating}
                              onChange={(e) => setSelectedMinRating(e.target.value)}
                            >
                              <option value="">Any Rating</option>
                              <option value="4.5">4.5+ Stars ⭐⭐⭐⭐⭐</option>
                              <option value="4.0">4.0+ Stars ⭐⭐⭐⭐</option>
                              <option value="3.5">3.5+ Stars ⭐⭐⭐</option>
                              <option value="3.0">3.0+ Stars ⭐⭐⭐</option>
                            </select>
                          </div>

                          {/* Availability Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Availability</label>
                            <select
                              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                              value={selectedAvailability}
                              onChange={(e) => setSelectedAvailability(e.target.value)}
                            >
                              <option value="">Any Availability</option>
                              <option value="1-2">1-2 hours/week</option>
                              <option value="2-3">2-3 hours/week</option>
                              <option value="3-5">3-5 hours/week</option>
                              <option value="weekends">Weekends</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Active Filters Summary - Only for non-admin users */}
                      {!isAdmin && hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t">
                          <span className="text-sm text-muted-foreground">Active filters:</span>
                          {searchTerm && (
                            <Badge variant="secondary" className="gap-1">
                              Search: {searchTerm}
                              <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-destructive">&times;</button>
                            </Badge>
                          )}
                          {selectedArea && (
                            <Badge variant="secondary" className="gap-1">
                              Area: {selectedArea.replace(/_/g, " ")}
                              <button onClick={() => setSelectedArea("")} className="ml-1 hover:text-destructive">&times;</button>
                            </Badge>
                          )}
                          {selectedCompany && (
                            <Badge variant="secondary" className="gap-1">
                              Company: {selectedCompany}
                              <button onClick={() => setSelectedCompany("")} className="ml-1 hover:text-destructive">&times;</button>
                            </Badge>
                          )}
                          {selectedMinRating && (
                            <Badge variant="secondary" className="gap-1">
                              Rating: {selectedMinRating}+
                              <button onClick={() => setSelectedMinRating("")} className="ml-1 hover:text-destructive">&times;</button>
                            </Badge>
                          )}
                          {selectedAvailability && (
                            <Badge variant="secondary" className="gap-1">
                              Availability: {selectedAvailability}
                              <button onClick={() => setSelectedAvailability("")} className="ml-1 hover:text-destructive">&times;</button>
                            </Badge>
                          )}
                        </div>
                      )}
                    </TabsList>

                    <TabsContent value="find-mentors" className="space-y-6">
                      {/* Search and Filter Section */}
                      <Card className="p-4">
                        <div className="space-y-4">
                          {/* Search Bar */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Search by name, job title, company, or expertise..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="pl-10"
                            />
                          </div>

                          {/* Filter Row */}
                          <div className="flex flex-wrap gap-3">
                            {/* Area Filter */}
                            <select
                              value={selectedArea}
                              onChange={(e) => {
                                setSelectedArea(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">All Areas</option>
                              {availableAreas.map((area) => (
                                <option key={area} value={area}>
                                  {area.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>

                            {/* Company Filter */}
                            <select
                              value={selectedCompany}
                              onChange={(e) => {
                                setSelectedCompany(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">All Companies</option>
                              {uniqueCompanies.slice(0, 50).map((company) => (
                                <option key={company} value={company}>
                                  {company}
                                </option>
                              ))}
                            </select>

                            {/* Rating Filter */}
                            <select
                              value={selectedMinRating}
                              onChange={(e) => {
                                setSelectedMinRating(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">Any Rating</option>
                              <option value="4.5">4.5+ Stars</option>
                              <option value="4">4+ Stars</option>
                              <option value="3.5">3.5+ Stars</option>
                              <option value="3">3+ Stars</option>
                            </select>

                            {/* Availability Filter */}
                            <select
                              value={selectedAvailability}
                              onChange={(e) => {
                                setSelectedAvailability(e.target.value);
                                setCurrentPage(1);
                              }}
                              className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">Any Availability</option>
                              <option value="weekday">Weekdays</option>
                              <option value="weekend">Weekends</option>
                              <option value="evening">Evenings</option>
                            </select>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFindMentorFilters}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Clear Filters
                              </Button>
                            )}
                          </div>

                          {/* Active Filters Display */}
                          {hasActiveFilters && (
                            <div className="flex flex-wrap gap-2">
                              {searchTerm && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  Search: &quot;{searchTerm}&quot;
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setSearchTerm("")}
                                  />
                                </Badge>
                              )}
                              {selectedArea && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  Area: {selectedArea.replace(/_/g, " ")}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setSelectedArea("")}
                                  />
                                </Badge>
                              )}
                              {selectedCompany && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  Company: {selectedCompany}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setSelectedCompany("")}
                                  />
                                </Badge>
                              )}
                              {selectedMinRating && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  Rating: {selectedMinRating}+ Stars
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setSelectedMinRating("")}
                                  />
                                </Badge>
                              )}
                              {selectedAvailability && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  Availability: {selectedAvailability}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setSelectedAvailability("")}
                                  />
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>

                      {/* Results Count */}
                      <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{startIndex + 1}-{Math.min(endIndex, filteredMentors.length)}</span> of{" "}
                      <span className="font-medium text-foreground">{filteredMentors.length}</span> mentors
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedMentors.map((mentor) => (
                      <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-10 w-10">
                              <span className="font-semibold">
                                {mentor.firstName[0]}
                                {mentor.lastName[0]}
                              </span>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {mentor.firstName} {mentor.lastName}
                              </CardTitle>
                              <CardDescription>
                                {mentor.jobTitle}
                                {mentor.company && ` • ${mentor.company}`}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {renderStars(mentor.rating)}
                            <span>{mentor.rating.toFixed(1)}</span>
                            <span className="mx-2">•</span>
                            <span>{mentor.totalMentees} {mentor.totalMentees === 1 ? 'mentee' : 'mentees'}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-3">{mentor.bio}</p>
                          <div className="flex flex-wrap gap-2">
                            {mentor.mentorshipAreas.map((area) => (
                              <Badge key={area} variant="outline">
                                {area.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-4">
                            {!isAdmin ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedMentor(mentor);
                                  setIsRequestDialogOpen(true);
                                  setMentorshipArea("");
                                  setMentorshipMessage("");
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Request Mentorship
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewMentor(mentor)}
                              >
                                <Users className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {mentor.availability}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredMentors.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No mentors match your filters yet. Try adjusting the search.
                      </p>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {filteredMentors.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {(() => {
                          const pages = [];
                          const showPages = 5;
                          let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                          let endPage = Math.min(totalPages, startPage + showPages - 1);

                          if (endPage - startPage < showPages - 1) {
                            startPage = Math.max(1, endPage - showPages + 1);
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <Button
                                key={i}
                                variant={currentPage === i ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(i)}
                                className="min-w-[40px]"
                              >
                                {i}
                              </Button>
                            );
                          }
                          return pages;
                        })()}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>

                      <span className="text-sm text-muted-foreground ml-2">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                  )}
                </TabsContent>

                {!isAdmin && (
                  <TabsContent value="my-mentorships" className="space-y-6">
                    {/* Summary Stats - Clean Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl font-bold text-green-700">
                                {mentorshipRequests.filter(r => r.status === 'ACTIVE').length + incomingMentorshipRequests.filter(r => r.status === 'ACTIVE').length}
                              </p>
                              <p className="text-sm text-green-600 font-medium">Active</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                              <Users className="h-6 w-6 text-green-700" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl font-bold text-yellow-700">
                                {mentorshipRequests.filter(r => r.status === 'REQUESTED').length + incomingMentorshipRequests.filter(r => r.status === 'REQUESTED').length}
                              </p>
                              <p className="text-sm text-yellow-600 font-medium">Pending</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-yellow-200 flex items-center justify-center">
                              <Clock className="h-6 w-6 text-yellow-700" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl font-bold text-blue-700">
                                {mentorshipRequests.filter(r => r.status === 'COMPLETED').length + incomingMentorshipRequests.filter(r => r.status === 'COMPLETED').length}
                              </p>
                              <p className="text-sm text-blue-600 font-medium">Completed</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                              <Award className="h-6 w-6 text-blue-700" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-3xl font-bold text-purple-700">
                                {mentorshipRequests.length + incomingMentorshipRequests.length}
                              </p>
                              <p className="text-sm text-purple-600 font-medium">Total</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-purple-700" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Two Column Layout - As Mentee & As Mentor */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* LEFT: My Mentors (I am the Mentee) */}
                      <Card>
                        <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-transparent">
                          <CardTitle className="flex items-center gap-2 text-green-800">
                            <Award className="h-5 w-5" />
                            My Mentors
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {mentorshipRequests.length}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Mentors you&apos;ve connected with for guidance
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                          {mentorshipRequests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              <p className="font-medium">No mentors yet</p>
                              <p className="text-sm">Find mentors in the &quot;Find Mentors&quot; tab</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-3"
                                onClick={() => setActiveTab('find-mentors')}
                              >
                                <Search className="h-4 w-4 mr-2" />
                                Browse Mentors
                              </Button>
                            </div>
                          ) : (
                            mentorshipRequests.map((request) => (
                              <div 
                                key={request.id} 
                                className={`p-4 rounded-lg border-l-4 ${
                                  request.status === 'ACTIVE' ? 'bg-green-50 border-l-green-500' :
                                  request.status === 'REQUESTED' ? 'bg-yellow-50 border-l-yellow-500' :
                                  request.status === 'COMPLETED' ? 'bg-blue-50 border-l-blue-500' :
                                  'bg-red-50 border-l-red-500'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-green-200 flex items-center justify-center text-green-700 font-bold">
                                      {request.mentorName?.charAt(0) || 'M'}
                                    </div>
                                    <div>
                                      <p className="font-semibold">{request.mentorName}</p>
                                      <p className="text-sm text-muted-foreground">{formatArea(request.area)}</p>
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(request.status)}>
                                    {request.status}
                                  </Badge>
                                </div>
                                
                                {/* Actions based on status */}
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {request.startDate ? `Started: ${new Date(request.startDate).toLocaleDateString()}` : 
                                     request.requestDate ? `Requested: ${new Date(request.requestDate).toLocaleDateString()}` : ''}
                                  </span>
                                  <div className="flex gap-2">
                                    {request.status === 'ACTIVE' && (
                                      <Button size="sm" variant="outline" onClick={() => setMessageDialogMentor(request.mentorName)}>
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        Message
                                      </Button>
                                    )}
                                    {request.status === 'COMPLETED' && request.rating > 0 && (
                                      <div className="flex items-center gap-1">
                                        {renderStars(request.rating)}
                                        <span className="text-sm font-medium">{request.rating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>

                      {/* RIGHT: My Mentees (I am the Mentor) */}
                      <Card>
                        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-transparent">
                          <CardTitle className="flex items-center gap-2 text-blue-800">
                            <GraduationCap className="h-5 w-5" />
                            My Mentees
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {incomingMentorshipRequests.length}
                            </Badge>
                            {incomingMentorshipRequests.filter(r => r.status === 'REQUESTED').length > 0 && (
                              <Badge variant="destructive">
                                {incomingMentorshipRequests.filter(r => r.status === 'REQUESTED').length} New
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Alumni seeking your mentorship guidance
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                          {mentorApplicationStatus !== 'approved' ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              <p className="font-medium">Become a Mentor First</p>
                              <p className="text-sm">Apply to become a mentor to receive mentee requests</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-3"
                                onClick={() => setActiveTab('become-mentor')}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Apply Now
                              </Button>
                            </div>
                          ) : incomingMentorshipRequests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                              <p className="font-medium">No mentee requests yet</p>
                              <p className="text-sm">When alumni request your mentorship, they&apos;ll appear here</p>
                            </div>
                          ) : (
                            incomingMentorshipRequests.map((request) => (
                              <div 
                                key={request.id} 
                                className={`p-4 rounded-lg border-l-4 ${
                                  request.status === 'REQUESTED' ? 'bg-yellow-50 border-l-yellow-500' :
                                  request.status === 'ACTIVE' ? 'bg-green-50 border-l-green-500' :
                                  request.status === 'COMPLETED' ? 'bg-blue-50 border-l-blue-500' :
                                  'bg-red-50 border-l-red-500'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                      {request.menteeName?.charAt(0) || 'M'}
                                    </div>
                                    <div>
                                      <p className="font-semibold">{request.menteeName || 'Mentee'}</p>
                                      <p className="text-sm text-muted-foreground">{formatArea(request.area)}</p>
                                      <p className="text-xs text-muted-foreground">{request.menteeEmail}</p>
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(request.status)}>
                                    {request.status}
                                  </Badge>
                                </div>
                                
                                {request.message && (
                                  <p className="mt-2 text-sm italic text-muted-foreground bg-white/50 p-2 rounded">
                                    &ldquo;{request.message}&rdquo;
                                  </p>
                                )}
                                
                                {/* Actions based on status */}
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {request.requestDate ? `Requested: ${new Date(request.requestDate).toLocaleDateString()}` : ''}
                                  </span>
                                  <div className="flex gap-2">
                                    {request.status === 'REQUESTED' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 hover:bg-red-50"
                                          onClick={() => handleMentorshipResponse(request.id, 'decline')}
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Decline
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => handleMentorshipResponse(request.id, 'accept')}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Accept
                                        </Button>
                                      </>
                                    )}
                                    {request.status === 'ACTIVE' && (
                                      <Button size="sm" variant="outline" onClick={() => setMessageDialogMentor(request.menteeName)}>
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        Message
                                      </Button>
                                    )}
                                    {request.status === 'COMPLETED' && request.rating > 0 && (
                                      <div className="flex items-center gap-1">
                                        {renderStars(request.rating)}
                                        <span className="text-sm font-medium">{request.rating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Action - Find More Mentors */}
                    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Looking for more mentorship opportunities?</h3>
                          <p className="text-sm text-muted-foreground">Browse our directory of {mentors.length}+ mentors ready to help you grow.</p>
                        </div>
                        <Button onClick={() => setActiveTab('find-mentors')}>
                          <Search className="h-4 w-4 mr-2" />
                          Find Mentors
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {!isAdmin && (
                  <TabsContent value="become-mentor" className="space-y-6">
                    {/* Application Status Card - Shows when application is submitted */}
                    {mentorApplicationStatus !== 'none' && (
                      <Card className={`border-l-4 ${mentorApplicationStatus === 'pending' ? 'border-l-yellow-500 bg-yellow-50/50' :
                        mentorApplicationStatus === 'approved' ? 'border-l-green-500 bg-green-50/50' :
                          'border-l-red-500 bg-red-50/50'
                        }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {mentorApplicationStatus === 'pending' && (
                                <>
                                  <Clock className="h-5 w-5 text-yellow-600" />
                                  Application Under Review
                                </>
                              )}
                              {mentorApplicationStatus === 'approved' && (
                                <>
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  Application Approved
                                </>
                              )}
                              {mentorApplicationStatus === 'rejected' && (
                                <>
                                  <XCircle className="h-5 w-5 text-red-600" />
                                  Application Not Approved
                                </>
                              )}
                            </CardTitle>
                            <Badge variant={
                              mentorApplicationStatus === 'pending' ? 'secondary' :
                                mentorApplicationStatus === 'approved' ? 'default' : 'destructive'
                            }>
                              {mentorApplicationStatus.charAt(0).toUpperCase() + mentorApplicationStatus.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Submitted On</p>
                              <p className="font-medium">{mentorApplicationDate || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Experience Level</p>
                              <p className="font-medium">
                                {mentorApplicationExperience === 'early' ? '0-3 years (Early Career)' :
                                 mentorApplicationExperience === 'mid' ? '4-10 years (Mid Career)' :
                                 mentorApplicationExperience === 'senior' ? '10+ years (Senior/Executive)' :
                                 mentorApplicationExperience || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Availability</p>
                              <p className="font-medium">{mentorApplicationAvailability || 'N/A'}</p>
                            </div>
                          </div>
                          {mentorApplicationAreas.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-muted-foreground mb-2">Selected Areas</p>
                              <div className="flex flex-wrap gap-2">
                                {mentorApplicationAreas.map(area => (
                                  <Badge key={area} variant="outline" className="text-xs">
                                    {area.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {mentorApplicationStatus === 'pending' && (
                            <div className="mt-4 space-y-3">
                              <p className="text-sm text-muted-foreground">
                                Your application is being reviewed by our admin team. You will be notified once a decision is made.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to withdraw your application?')) {
                                    try {
                                      const response = await fetch('/api/mentorship/apply', {
                                        method: 'DELETE',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-user-email': user?.email || ''
                                        }
                                      });
                                      if (response.ok) {
                                        alert('✅ Application withdrawn successfully');
                                        setMentorApplicationStatus('none');
                                        setMentorApplicationSubmitted(false);
                                        setMentorApplicationExperience('');
                                        setMentorApplicationAvailability('');
                                        setMentorApplicationAreas([]);
                                        setMentorApplicationBio('');
                                      } else {
                                        alert('❌ Failed to withdraw application');
                                      }
                                    } catch (error) {
                                      console.error('Error withdrawing application:', error);
                                      alert('❌ Error withdrawing application');
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Withdraw Application
                              </Button>
                            </div>
                          )}
                          {mentorApplicationStatus === 'rejected' && (
                            <div className="mt-4 space-y-3">
                              <p className="text-sm text-red-700">
                                Your application was not approved. You can submit a new application with updated information.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm('Delete this application and apply again?')) {
                                    try {
                                      const response = await fetch('/api/mentorship/apply', {
                                        method: 'DELETE',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-user-email': user?.email || ''
                                        }
                                      });
                                      if (response.ok) {
                                        setMentorApplicationStatus('none');
                                        setMentorApplicationSubmitted(false);
                                        setMentorApplicationExperience('');
                                        setMentorApplicationAvailability('');
                                        setMentorApplicationAreas([]);
                                        setMentorApplicationBio('');
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                    }
                                  }
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Apply Again
                              </Button>
                            </div>
                          )}
                          {mentorApplicationStatus === 'approved' && (
                            <div className="mt-4 space-y-4">
                              <p className="text-sm text-green-700">
                                🎉 Congratulations! You are now an approved mentor. Alumni can now request mentorship from you.
                              </p>
                              
                              {/* Mentor Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-center">
                                  <p className="text-xl font-bold text-green-700">{incomingMentorshipRequests.length}</p>
                                  <p className="text-xs text-green-600">Total Requests</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xl font-bold text-yellow-700">{incomingMentorshipRequests.filter(r => r.status === 'REQUESTED').length}</p>
                                  <p className="text-xs text-yellow-600">Pending</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xl font-bold text-blue-700">{incomingMentorshipRequests.filter(r => r.status === 'ACTIVE').length}</p>
                                  <p className="text-xs text-blue-600">Active Mentees</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xl font-bold text-purple-700">{incomingMentorshipRequests.filter(r => r.status === 'COMPLETED').length}</p>
                                  <p className="text-xs text-purple-600">Completed</p>
                                </div>
                              </div>

                              {/* Mentee List Preview */}
                              {incomingMentorshipRequests.length > 0 && (
                                <div className="p-4 bg-white rounded-lg border">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-blue-600" />
                                    Your Mentees
                                  </h4>
                                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                    {incomingMentorshipRequests.slice(0, 5).map((request) => (
                                      <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                          <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-semibold text-xs">
                                            {request.menteeName?.charAt(0) || 'M'}
                                          </div>
                                          <div>
                                            <p className="font-medium text-sm">{request.menteeName}</p>
                                            <p className="text-xs text-muted-foreground">{request.area}</p>
                                          </div>
                                        </div>
                                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                          {request.status}
                                        </Badge>
                                      </div>
                                    ))}
                                    {incomingMentorshipRequests.length > 5 && (
                                      <p className="text-xs text-muted-foreground text-center pt-2">
                                        +{incomingMentorshipRequests.length - 5} more mentees
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveTab('my-mentorships')}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  View My Mentorships
                                  {incomingMentorshipRequests.filter(r => r.status === 'REQUESTED').length > 0 && (
                                    <Badge variant="destructive" className="ml-2">
                                      {incomingMentorshipRequests.filter(r => r.status === 'REQUESTED').length}
                                    </Badge>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveTab('find-mentors')}
                                >
                                  <Search className="h-4 w-4 mr-2" />
                                  Browse Mentors
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to withdraw from the mentor program? This will remove you from the mentor directory.')) {
                                      try {
                                        const response = await fetch('/api/mentorship/apply', {
                                          method: 'DELETE',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'x-user-email': user?.email || ''
                                          }
                                        });
                                        if (response.ok) {
                                          alert('✅ You have been removed from the mentor program');
                                          setMentorApplicationStatus('none');
                                          setMentorApplicationSubmitted(false);
                                          setMentorApplicationExperience('');
                                          setMentorApplicationAvailability('');
                                          setMentorApplicationAreas([]);
                                          setMentorApplicationBio('');
                                        } else {
                                          alert('❌ Failed to withdraw');
                                        }
                                      } catch (error) {
                                        console.error('Error:', error);
                                        alert('❌ Error withdrawing');
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Withdraw from Program
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Apply to be a Mentor Form */}

                    {/* Application Form - Only shows when no application submitted */}
                    {mentorApplicationStatus === 'none' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Form */}
                        <div className="lg:col-span-2">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Become a Mentor
                              </CardTitle>
                              <CardDescription>
                                Share your expertise and help fellow alumni grow in their careers. Complete the form below to apply.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Your experience level</label>
                                  <select
                                    className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                                    value={mentorApplicationExperience}
                                    onChange={(e) => setMentorApplicationExperience(e.target.value)}
                                  >
                                    <option value="">Select experience</option>
                                    <option value="early">0-3 years (early career)</option>
                                    <option value="mid">4-10 years (mid career)</option>
                                    <option value="senior">10+ years (senior/executive)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-1 block">Weekly availability</label>
                                  <select
                                    className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                                    value={mentorApplicationAvailability}
                                    onChange={(e) => setMentorApplicationAvailability(e.target.value)}
                                  >
                                    <option value="">Select availability</option>
                                    <option value="1-2 hours/week">1–2 hours per week</option>
                                    <option value="2-3 hours/week">2–3 hours per week</option>
                                    <option value="3-4 hours/week">3–4 hours per week</option>
                                    <option value="4+ hours/week">4+ hours per week</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">
                                  Mentorship areas you can support
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {(availableAreas.length > 0 ? availableAreas : ["CAREER_DEVELOPMENT", "TECHNICAL_SKILLS", "LEADERSHIP", "ENTREPRENEURSHIP", "NETWORKING", "ACADEMIC_GUIDANCE"]).map(
                                    (area) => {
                                      const label = area.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase());
                                      const isSelected = mentorApplicationAreas.includes(area);
                                      return (
                                        <label
                                          key={area}
                                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${isSelected
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-input hover:border-primary/50'
                                            }`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="rounded text-primary"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              setMentorApplicationAreas((prev) =>
                                                e.target.checked
                                                  ? [...prev, area]
                                                  : prev.filter((l) => l !== area)
                                              );
                                            }}
                                          />
                                          <span className="text-sm font-medium">{label}</span>
                                        </label>
                                      );
                                    }
                                  )}
                                </div>
                                {mentorApplicationAreas.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {mentorApplicationAreas.length} area{mentorApplicationAreas.length > 1 ? 's' : ''} selected
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-1 block">Your bio and mentoring approach</label>
                                <textarea
                                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                                  rows={4}
                                  placeholder="Describe your background, expertise, and how you'd like to support mentees."
                                  value={mentorApplicationBio}
                                  onChange={(e) => setMentorApplicationBio(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {mentorApplicationBio.length}/500 characters
                                </p>
                              </div>

                              {mentorApplicationError && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                  <p className="text-sm text-destructive">{mentorApplicationError}</p>
                                </div>
                              )}

                              {/* Success Message - Shows after submission */}
                              {mentorApplicationSubmitted && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                      <p className="font-medium text-green-800">Application Submitted Successfully!</p>
                                      <p className="text-sm text-green-700 mt-1">
                                        Your mentor application has been submitted and is now pending admin review.
                                        You will be notified once a decision is made.
                                      </p>
                                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                                        <div>
                                          <span className="text-green-600">Submitted:</span>{' '}
                                          <span className="font-medium text-green-800">{mentorApplicationDate}</span>
                                        </div>
                                        <div>
                                          <span className="text-green-600">Status:</span>{' '}
                                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                            <Clock className="h-3 w-3 mr-1" />
                                            Pending Review
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-end pt-4 border-t">
                                <Button
                                  onClick={handleSubmitMentorApplication}
                                  disabled={mentorApplicationSubmitted || !mentorApplicationExperience || !mentorApplicationAvailability || mentorApplicationAreas.length === 0}
                                  className="gap-2"
                                >
                                  <Send className="h-4 w-4" />
                                  {mentorApplicationSubmitted ? 'Application Submitted' : 'Submit Application'}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Sidebar - Benefits & Info */}
                        <div className="space-y-6">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Why Become a Mentor?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Award className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Give Back</p>
                                  <p className="text-xs text-muted-foreground">Help the next generation succeed</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Build Network</p>
                                  <p className="text-xs text-muted-foreground">Expand your professional connections</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Star className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">Recognition</p>
                                  <p className="text-xs text-muted-foreground">Get recognized for your contributions</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Application Process</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">1</div>
                                  <span className="text-sm">Complete the application form</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">2</div>
                                  <span className="text-sm text-muted-foreground">Admin reviews your application</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">3</div>
                                  <span className="text-sm text-muted-foreground">Get approved & start mentoring</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{mentors.filter(m => !pendingMentorIds.includes(m.id)).length}+</p>
                                <p className="text-sm text-muted-foreground">Active Mentors</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* User Analytics Tab */}
                {!isAdmin && (
                  <TabsContent value="user-analytics" className="space-y-6">
                    {/* Analytics Filters */}
                    <Card className="border-primary/20">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Analytics Filters
                          </span>
                          <Button variant="outline" size="sm" onClick={clearUserAnalyticsFilters}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Filters
                          </Button>
                        </CardTitle>
                        <CardDescription>
                          Filter mentor data to explore specific segments
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Company Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Company</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={userAnalyticsCompany}
                              onChange={e => setUserAnalyticsCompany(e.target.value)}
                            >
                              <option value="">All Companies</option>
                              {uniqueCompanies.slice(0, 10).map(company => (
                                <option key={company} value={company}>{company}</option>
                              ))}
                            </select>
                          </div>

                          {/* Min Rating Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Minimum Rating</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={userAnalyticsMinRating}
                              onChange={e => setUserAnalyticsMinRating(e.target.value)}
                            >
                              <option value="">Any Rating</option>
                              <option value="4.5">4.5+ Stars</option>
                              <option value="4.0">4.0+ Stars</option>
                              <option value="3.5">3.5+ Stars</option>
                              <option value="3.0">3.0+ Stars</option>
                            </select>
                          </div>

                          {/* Mentorship Area Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Mentorship Area</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={userAnalyticsArea}
                              onChange={e => setUserAnalyticsArea(e.target.value)}
                            >
                              <option value="">All Areas</option>
                              {availableAreas.map((areaItem) => (
                                <option key={areaItem} value={areaItem}>
                                  {areaItem.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {/* User Analytics Tab */}
                {!isAdmin && (
                  <TabsContent value="user-analytics" className="space-y-6">
                    {/* Analytics Filters */}
                    <Card className="border-primary/20">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Analytics Filters
                          </span>
                          <Button variant="outline" size="sm" onClick={clearUserAnalyticsFilters}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Filters
                          </Button>
                        </CardTitle>
                        <CardDescription>
                          Filter mentor data to explore specific segments
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Company Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Company</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={userAnalyticsCompany}
                              onChange={e => setUserAnalyticsCompany(e.target.value)}
                            >
                              <option value="">All Companies</option>
                              {uniqueCompanies.map(company => (
                                <option key={company} value={company}>{company}</option>
                              ))}
                            </select>
                          </div>

                          {/* Minimum Rating Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Minimum Rating</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={userAnalyticsMinRating}
                              onChange={e => setUserAnalyticsMinRating(e.target.value)}
                            >
                              <option value="">Any Rating</option>
                              <option value="4.5">4.5+ Stars</option>
                              <option value="4.0">4.0+ Stars</option>
                              <option value="3.5">3.5+ Stars</option>
                              <option value="3.0">3.0+ Stars</option>
                            </select>
                          </div>

                          {/* Mentorship Area Filter */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Mentorship Area</label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={userAnalyticsArea}
                              onChange={e => setUserAnalyticsArea(e.target.value)}
                            >
                              <option value="">All Areas</option>
                              {availableAreas.map((area) => (
                                <option key={area} value={area}>
                                  {area.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Active Filters Summary */}
                        {(userAnalyticsCompany || userAnalyticsMinRating || userAnalyticsArea) && (
                          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {userAnalyticsCompany && (
                              <Badge variant="secondary" className="gap-1">
                                {userAnalyticsCompany}
                                <button onClick={() => setUserAnalyticsCompany("")} className="ml-1 hover:text-destructive">×</button>
                              </Badge>
                            )}
                            {userAnalyticsMinRating && (
                              <Badge variant="secondary" className="gap-1">
                                {userAnalyticsMinRating}+ Stars
                                <button onClick={() => setUserAnalyticsMinRating("")} className="ml-1 hover:text-destructive">×</button>
                              </Badge>
                            )}
                            {userAnalyticsArea && (
                              <Badge variant="secondary" className="gap-1">
                                {userAnalyticsArea.replace(/_/g, ' ')}
                                <button onClick={() => setUserAnalyticsArea("")} className="ml-1 hover:text-destructive">×</button>
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-sm text-muted-foreground font-medium">Available Mentors</div>
                        <div className="text-3xl font-bold text-primary mt-1">{userFilteredMentors.length}</div>
                        <div className="text-xs text-muted-foreground mt-1">Ready to connect</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm text-muted-foreground font-medium">Average Rating</div>
                        <div className="text-3xl font-bold text-green-600 mt-1">
                          {userFilteredMentors.length > 0
                            ? (userFilteredMentors.reduce((acc, m) => acc + m.rating, 0) / userFilteredMentors.length).toFixed(1)
                            : '0.0'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Out of 5.0 stars</div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-muted-foreground font-medium">Total Mentees Helped</div>
                        <div className="text-3xl font-bold text-blue-600 mt-1">
                          {userFilteredMentors.reduce((acc, m) => acc + m.totalMentees, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Career journeys supported</div>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-sm text-muted-foreground font-medium">Companies Represented</div>
                        <div className="text-3xl font-bold text-amber-600 mt-1">
                          {new Set(userFilteredMentors.map(m => m.company)).size}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Industry diversity</div>
                      </div>
                    </div>

                    {/* Key Insights Section */}
                    <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          Key Mentorship Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-white rounded-lg border shadow-sm">
                            <div className="text-sm text-muted-foreground">Top Expertise Area</div>
                            <div className="text-lg font-semibold text-primary mt-1">
                              {(() => {
                                const areas: { [key: string]: number } = {};
                                userFilteredMentors.forEach(m => m.mentorshipAreas.forEach(a => { areas[a] = (areas[a] || 0) + 1; }));
                                const top = Object.entries(areas).sort((a, b) => b[1] - a[1])[0];
                                return top ? top[0].replace(/_/g, ' ') : 'N/A';
                              })()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Most offered specialty</div>
                          </div>
                          <div className="p-4 bg-white rounded-lg border shadow-sm">
                            <div className="text-sm text-muted-foreground">Top Rated Mentor</div>
                            <div className="text-lg font-semibold text-primary mt-1">
                              {userFilteredMentors.length > 0
                                ? `${[...userFilteredMentors].sort((a, b) => b.rating - a.rating)[0].firstName} ${[...userFilteredMentors].sort((a, b) => b.rating - a.rating)[0].lastName}`
                                : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {userFilteredMentors.length > 0
                                ? `${[...userFilteredMentors].sort((a, b) => b.rating - a.rating)[0].rating.toFixed(1)} stars`
                                : ''}
                            </div>
                          </div>
                          <div className="p-4 bg-white rounded-lg border shadow-sm">
                            <div className="text-sm text-muted-foreground">Most Active Mentor</div>
                            <div className="text-lg font-semibold text-primary mt-1">
                              {userFilteredMentors.length > 0
                                ? `${[...userFilteredMentors].sort((a, b) => b.totalMentees - a.totalMentees)[0].firstName} ${[...userFilteredMentors].sort((a, b) => b.totalMentees - a.totalMentees)[0].lastName}`
                                : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {userFilteredMentors.length > 0
                                ? `${[...userFilteredMentors].sort((a, b) => b.totalMentees - a.totalMentees)[0].totalMentees} mentees`
                                : ''}
                            </div>
                          </div>
                          <div className="p-4 bg-white rounded-lg border shadow-sm">
                            <div className="text-sm text-muted-foreground">Program Quality</div>
                            <div className="text-lg font-semibold text-primary mt-1">
                              {(() => {
                                const avg = userFilteredMentors.length > 0
                                  ? userFilteredMentors.reduce((acc, m) => acc + m.rating, 0) / userFilteredMentors.length
                                  : 0;
                                return avg >= 4.5 ? 'Excellent' : avg >= 4.0 ? 'Very Good' : avg >= 3.5 ? 'Good' : 'Growing';
                              })()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Based on mentor ratings</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Mentorship Areas Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Mentorship Areas Distribution
                          </CardTitle>
                          <CardDescription>
                            Areas of expertise offered by mentors
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          {userFilteredMentors.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={(() => {
                                    const areas: { [key: string]: number } = {};
                                    userFilteredMentors.forEach(m => m.mentorshipAreas.forEach(a => { areas[a] = (areas[a] || 0) + 1; }));
                                    return Object.entries(areas).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
                                  })()}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={2}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {(() => {
                                    const areas: { [key: string]: number } = {};
                                    userFilteredMentors.forEach(m => m.mentorshipAreas.forEach(a => { areas[a] = (areas[a] || 0) + 1; }));
                                    return Object.entries(areas).map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ));
                                  })()}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              No mentor data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Rating Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            Mentor Rating Distribution
                          </CardTitle>
                          <CardDescription>
                            Quality distribution across mentors
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          {userFilteredMentors.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={(() => {
                                  const ratings = { '5 Stars': 0, '4 Stars': 0, '3 Stars': 0, '2 Stars': 0, '1 Star': 0 };
                                  userFilteredMentors.forEach(m => {
                                    const r = Math.round(m.rating);
                                    if (r >= 5) ratings['5 Stars']++;
                                    else if (r >= 4) ratings['4 Stars']++;
                                    else if (r >= 3) ratings['3 Stars']++;
                                    else if (r >= 2) ratings['2 Stars']++;
                                    else ratings['1 Star']++;
                                  });
                                  return Object.entries(ratings).map(([name, value]) => ({ name, value })).reverse();
                                })()}
                                layout="vertical"
                                margin={{ left: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={70} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#FFC72C" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              No rating data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Experience Level Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Experience Level Distribution
                          </CardTitle>
                          <CardDescription>
                            Mentor experience based on graduation year
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          {userFilteredMentors.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={(() => {
                                    const currentYear = new Date().getFullYear();
                                    const levels = { 'Early Career': 0, 'Mid Career': 0, 'Senior': 0, 'Executive': 0 };
                                    userFilteredMentors.forEach(m => {
                                      const yearsExp = currentYear - (m.graduationYear || currentYear);
                                      if (yearsExp <= 5) levels['Early Career']++;
                                      else if (yearsExp <= 10) levels['Mid Career']++;
                                      else if (yearsExp <= 20) levels['Senior']++;
                                      else levels['Executive']++;
                                    });
                                    return Object.entries(levels).map(([name, value]) => ({ name, value }));
                                  })()}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {[0, 1, 2, 3].map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              No data available
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Companies Distribution */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Top Companies Represented
                          </CardTitle>
                          <CardDescription>
                            Industry diversity among mentors
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          {userFilteredMentors.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={(() => {
                                  const companies: { [key: string]: number } = {};
                                  userFilteredMentors.forEach(m => {
                                    const company = m.company || 'Independent';
                                    companies[company] = (companies[company] || 0) + 1;
                                  });
                                  return Object.entries(companies)
                                    .map(([name, value]) => ({ name, value }))
                                    .sort((a, b) => b.value - a.value)
                                    .slice(0, 6);
                                })()}
                                margin={{ top: 10, right: 10, left: 10, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="name"
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  tick={{ fontSize: 11 }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#53C3EE" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              No company data available
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Mentors Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Rated Mentors */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Top Rated Mentors
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {userFilteredMentors.length > 0 ? (
                              [...userFilteredMentors]
                                .sort((a, b) => b.rating - a.rating)
                                .slice(0, 5)
                                .map((mentor, index) => (
                                  <div key={mentor.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                          index === 2 ? 'bg-amber-600' : 'bg-primary/60'
                                        }`}>
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="font-medium">{mentor.firstName} {mentor.lastName}</p>
                                        <p className="text-sm text-muted-foreground">{mentor.jobTitle} at {mentor.company}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        <span className="font-bold">{mentor.rating.toFixed(1)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No mentors available
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Most Active Mentors */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Most Active Mentors
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {userFilteredMentors.length > 0 ? (
                              [...userFilteredMentors]
                                .sort((a, b) => b.totalMentees - a.totalMentees)
                                .slice(0, 5)
                                .map((mentor, index) => (
                                  <div key={mentor.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-blue-500' :
                                        index === 1 ? 'bg-blue-400' :
                                          index === 2 ? 'bg-blue-300' : 'bg-primary/60'
                                        }`}>
                                        {index + 1}
                                      </div>
                                      <div>
                                        <p className="font-medium">{mentor.firstName} {mentor.lastName}</p>
                                        <p className="text-sm text-muted-foreground">{mentor.company}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-primary">{mentor.totalMentees}</div>
                                      <div className="text-xs text-muted-foreground">mentees</div>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No mentors available
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Graduation Year Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Mentors by Graduation Year
                        </CardTitle>
                        <CardDescription>
                          Distribution of mentors across graduation cohorts
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        {userFilteredMentors.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={(() => {
                                const years: { [key: string]: number } = {};
                                userFilteredMentors.forEach(m => {
                                  const year = m.graduationYear?.toString() || 'Unknown';
                                  if (year !== 'Unknown') {
                                    years[year] = (years[year] || 0) + 1;
                                  }
                                });
                                return Object.entries(years)
                                  .map(([year, count]) => ({ year, count }))
                                  .sort((a, b) => parseInt(a.year) - parseInt(b.year));
                              })()}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="count"
                                name="Mentors"
                                stroke="#003DA5"
                                fill="#003DA5"
                                fillOpacity={0.2}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            No graduation data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {isAdmin && (
                  <>
                    <TabsContent value="mentor-approval" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            Pending Mentor Applications
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={fetchPendingApplications}
                              disabled={pendingApplicationsLoading}
                            >
                              <RefreshCw className={`h-4 w-4 ${pendingApplicationsLoading ? 'animate-spin' : ''}`} />
                            </Button>
                          </CardTitle>
                          <CardDescription>
                            Review and approve or reject mentor applications from alumni.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {pendingApplicationsLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-muted-foreground">Loading applications...</span>
                            </div>
                          ) : pendingApplications.length > 0 ? (
                            pendingApplications.map((application) => (
                              <div
                                key={application.id}
                                className="flex items-center justify-between border rounded-md px-4 py-3"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-lg">
                                    {application.firstName} {application.lastName}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    {application.jobTitle}
                                    {application.company && ` at ${application.company}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Applied: {new Date(application.appliedAt).toLocaleDateString()}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {(application.mentorshipAreas || application.expertise || []).map((area: string) => (
                                      <Badge key={area} variant="outline" className="text-xs">
                                        {area.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                  {application.bio && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      {application.bio}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveApplication(application.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectApplication(application.id)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="font-medium">No Pending Applications</p>
                              <p className="text-sm mt-1">
                                All mentor applications have been reviewed.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Application History Card */}
                      <Card className="border-primary/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Application History
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {applicationHistory.length}
                              </Badge>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => fetchApplicationHistory()}
                                disabled={applicationHistoryLoading}
                              >
                                <RefreshCw className={`h-4 w-4 ${applicationHistoryLoading ? 'animate-spin' : ''}`} />
                              </Button>
                            </div>
                          </CardTitle>
                          <CardDescription>
                            Complete history of all mentor applications including pending, approved, and rejected.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Filter Tabs */}
                          <div className="flex gap-2 flex-wrap">
                            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                              <Button
                                key={status}
                                variant={historyFilter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setHistoryFilter(status)}
                                className="capitalize"
                              >
                                {status}
                                <Badge 
                                  variant="secondary" 
                                  className={`ml-2 ${
                                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    status === 'approved' ? 'bg-green-100 text-green-800' :
                                    status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {status === 'all' 
                                    ? applicationHistory.length 
                                    : applicationHistory.filter(app => app.status === status).length}
                                </Badge>
                              </Button>
                            ))}
                          </div>

                          {/* Application List */}
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {applicationHistoryLoading ? (
                              <div className="text-center py-8">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="text-muted-foreground mt-2">Loading application history...</p>
                              </div>
                            ) : (
                              applicationHistory
                                .filter(app => historyFilter === 'all' || app.status === historyFilter)
                                .length > 0 ? (
                                  applicationHistory
                                    .filter(app => historyFilter === 'all' || app.status === historyFilter)
                                    .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime())
                                    .map((app) => (
                                      <div
                                        key={app.id}
                                        className="flex items-center justify-between border rounded-md px-4 py-3 hover:bg-muted/50"
                                      >
                                        <div className="flex-1">
                                          <div className="font-medium">
                                            {app.name || `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Unknown Applicant'}
                                          </div>
                                          <div className="text-muted-foreground text-sm">
                                            {app.email}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {app.areas?.slice(0, 3).map((area: string) => (
                                              <Badge key={area} variant="outline" className="text-xs">
                                                {area.replace('_', ' ')}
                                              </Badge>
                                            ))}
                                            {(app.areas?.length || 0) > 3 && (
                                              <Badge variant="outline" className="text-xs">
                                                +{app.areas.length - 3} more
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            Submitted: {app.submittedAt 
                                              ? new Date(app.submittedAt).toLocaleDateString() 
                                              : app.createdAt 
                                              ? new Date(app.createdAt).toLocaleDateString()
                                              : 'N/A'}
                                            {app.reviewedAt && (
                                              <span className="ml-2">
                                                • Reviewed: {new Date(app.reviewedAt).toLocaleDateString()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                          <Badge 
                                            variant="secondary" 
                                            className={
                                              app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                              app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                              'bg-gray-100 text-gray-800'
                                            }
                                          >
                                            {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Unknown'}
                                          </Badge>
                                          {app.status === 'pending' && (
                                            <div className="flex gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 hover:bg-green-50"
                                                onClick={() => handleApproveApplication(app.id)}
                                              >
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() => handleRejectApplication(app.id)}
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-8">
                                    {historyFilter === 'all' 
                                      ? 'No mentor applications yet.' 
                                      : `No ${historyFilter} applications.`}
                                  </p>
                                )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                      {/* Advanced Analytics Filters */}
                      <Card className="border-primary/20">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Analytics Filters
                            </span>
                            <Button variant="outline" size="sm" onClick={clearMentorshipAnalyticsFilters}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Reset Filters
                            </Button>
                          </CardTitle>
                          <CardDescription>
                            Filter the analytics data to focus on specific mentor segments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Expertise Filter */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Expertise</label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={analyticsExpertise}
                                onChange={e => setAnalyticsExpertise(e.target.value)}
                              >
                                <option value="">All Expertise</option>
                                {uniqueExpertise.map(exp => (
                                  <option key={exp} value={exp}>{exp}</option>
                                ))}
                              </select>
                            </div>

                            {/* Mentorship Area Filter */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Mentorship Area</label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={analyticsArea}
                                onChange={e => setAnalyticsArea(e.target.value)}
                              >
                                <option value="">All Areas</option>
                                {uniqueAreas.map(area => (
                                  <option key={area} value={area}>{area.replace('_', ' ')}</option>
                                ))}
                              </select>
                            </div>

                            {/* Min Rating Filter */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Min Rating</label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={analyticsMinRating}
                                onChange={e => setAnalyticsMinRating(e.target.value)}
                              >
                                <option value="">Any Rating</option>
                                <option value="4.5">4.5+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="3.5">3.5+ Stars</option>
                                <option value="3">3+ Stars</option>
                              </select>
                            </div>

                            {/* Availability Filter */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Availability</label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={analyticsAvailability}
                                onChange={e => setAnalyticsAvailability(e.target.value)}
                              >
                                <option value="">Any Availability</option>
                                {uniqueAvailabilities.map(avail => (
                                  <option key={avail} value={avail}>{avail}</option>
                                ))}
                              </select>
                            </div>

                            {/* Graduation Year Range */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Grad Year From</label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={analyticsGradYearStart}
                                onChange={e => setAnalyticsGradYearStart(e.target.value)}
                              >
                                <option value="">Any</option>
                                {Array.from({ length: gradYearRange.max - gradYearRange.min + 1 }, (_, i) => gradYearRange.min + i).map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Grad Year To</label>
                              <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={analyticsGradYearEnd}
                                onChange={e => setAnalyticsGradYearEnd(e.target.value)}
                              >
                                <option value="">Any</option>
                                {Array.from({ length: gradYearRange.max - gradYearRange.min + 1 }, (_, i) => gradYearRange.min + i).map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Active Filters Summary */}
                          {(analyticsExpertise || analyticsArea || analyticsMinRating || analyticsAvailability || analyticsGradYearStart || analyticsGradYearEnd) && (
                            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
                              <span className="text-sm text-muted-foreground">Active filters:</span>
                              {analyticsExpertise && (
                                <Badge variant="secondary" className="gap-1">
                                  {analyticsExpertise}
                                  <button onClick={() => setAnalyticsExpertise("")} className="ml-1 hover:text-destructive">×</button>
                                </Badge>
                              )}
                              {analyticsArea && (
                                <Badge variant="secondary" className="gap-1">
                                  {analyticsArea.replace('_', ' ')}
                                  <button onClick={() => setAnalyticsArea("")} className="ml-1 hover:text-destructive">×</button>
                                </Badge>
                              )}
                              {analyticsMinRating && (
                                <Badge variant="secondary" className="gap-1">
                                  {analyticsMinRating}+ Stars
                                  <button onClick={() => setAnalyticsMinRating("")} className="ml-1 hover:text-destructive">×</button>
                                </Badge>
                              )}
                              {analyticsAvailability && (
                                <Badge variant="secondary" className="gap-1">
                                  {analyticsAvailability}
                                  <button onClick={() => setAnalyticsAvailability("")} className="ml-1 hover:text-destructive">×</button>
                                </Badge>
                              )}
                              {analyticsGradYearStart && (
                                <Badge variant="secondary" className="gap-1">
                                  From {analyticsGradYearStart}
                                  <button onClick={() => setAnalyticsGradYearStart("")} className="ml-1 hover:text-destructive">×</button>
                                </Badge>
                              )}
                              {analyticsGradYearEnd && (
                                <Badge variant="secondary" className="gap-1">
                                  To {analyticsGradYearEnd}
                                  <button onClick={() => setAnalyticsGradYearEnd("")} className="ml-1 hover:text-destructive">×</button>
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="text-sm text-muted-foreground font-medium">Filtered Mentors</div>
                          <div className="text-3xl font-bold text-primary mt-1">
                            {analyticsFilteredMentors.length}
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm text-muted-foreground font-medium">Active Mentorships</div>
                          <div className="text-3xl font-bold text-blue-600 mt-1">
                            {analyticsData?.stats?.active || mentorshipRequests.filter(r => r.status === 'ACTIVE').length}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm text-muted-foreground font-medium">Total Mentees</div>
                          <div className="text-3xl font-bold text-green-600 mt-1">
                            {totalMentees}
                          </div>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="text-sm text-muted-foreground font-medium">Avg Rating</div>
                          <div className="text-3xl font-bold text-amber-600 mt-1">
                            {avgMentorRating}
                          </div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="text-sm text-muted-foreground font-medium">Areas Covered</div>
                          <div className="text-3xl font-bold text-purple-600 mt-1">
                            {mentorshipAreasDistribution.length}
                          </div>
                        </div>
                      </div>

                      {/* Key Insights Section - At the top */}
                      <Card className="mb-6 border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            Key Mentorship Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                              <div className="text-sm text-muted-foreground">Top Expertise Area</div>
                              <div className="text-lg font-semibold text-primary mt-1">
                                {mentorshipAreasDistribution.length > 0
                                  ? mentorshipAreasDistribution.reduce((a, b) => a.value > b.value ? a : b).name
                                  : 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {mentorshipAreasDistribution.length > 0
                                  ? `${mentorshipAreasDistribution.reduce((a, b) => a.value > b.value ? a : b).value} mentors`
                                  : ''}
                              </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                              <div className="text-sm text-muted-foreground">Mentor-Mentee Ratio</div>
                              <div className="text-lg font-semibold text-primary mt-1">
                                1:{totalMentees > 0 && analyticsFilteredMentors.length > 0
                                  ? Math.round(totalMentees / analyticsFilteredMentors.length)
                                  : 0}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Average mentees per mentor
                              </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                              <div className="text-sm text-muted-foreground">Rating Quality</div>
                              <div className="text-lg font-semibold text-primary mt-1">
                                {parseFloat(avgMentorRating) >= 4.5 ? 'Excellent' :
                                  parseFloat(avgMentorRating) >= 4.0 ? 'Very Good' :
                                    parseFloat(avgMentorRating) >= 3.5 ? 'Good' : 'Needs Attention'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Based on {avgMentorRating} average rating
                              </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border shadow-sm">
                              <div className="text-sm text-muted-foreground">Program Health</div>
                              <div className="text-lg font-semibold text-primary mt-1">
                                {analyticsData?.stats?.active > 0 ? 'Active' : 'Stable'}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {analyticsData?.stats?.active || 0} ongoing mentorships
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="col-span-1 md:col-span-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Mentorship Program Growth
                              <Badge variant="outline" className="ml-2">
                                {analyticsFilteredMentors.length} of {mentors.length} Mentors
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              Active mentorships and approved mentors over the last 6 months.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={mentorshipGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                  </linearGradient>
                                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="month" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="activeMentorships" stroke="#2563eb" fillOpacity={1} fill="url(#colorActive)" name="Active Mentorships" />
                                <Area type="monotone" dataKey="approvedMentors" stroke="#16a34a" fillOpacity={1} fill="url(#colorApproved)" name="Approved Mentors" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Target className="h-5 w-5" />
                              Mentorship Areas
                            </CardTitle>
                            <CardDescription>Distribution of expertise across mentors.</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={mentorshipAreasDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {mentorshipAreasDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Star className="h-5 w-5" />
                              Mentor Ratings
                            </CardTitle>
                            <CardDescription>Overview of mentor satisfaction ratings.</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={mentorRatingsDistribution}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={60} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Mentors" />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        <Card className="col-span-1 md:col-span-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              Mentorship Seasonality
                            </CardTitle>
                            <CardDescription>
                              Monthly mentorship activity trends showing active, completed, and requested mentorships.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="h-[350px]">
                            {analyticsLoading ? (
                              <div className="flex items-center justify-center h-full">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                              </div>
                            ) : seasonalityData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={seasonalityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="month" />
                                  <YAxis />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                      borderRadius: '8px',
                                      border: 'none',
                                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                  />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="active"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    name="Active Mentorships"
                                    dot={{ fill: '#2563eb', r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#16a34a"
                                    strokeWidth={2}
                                    name="Completed"
                                    dot={{ fill: '#16a34a', r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="requested"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="Requested"
                                    dot={{ fill: '#f59e0b', r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>No seasonality data available</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Program Settings</CardTitle>
                          <CardDescription>
                            Review and configure mentorship program settings.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Max mentees per mentor</span>
                            <span>{programSettings.maxMenteesPerMentor}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Default session duration</span>
                            <span>{programSettings.sessionDurationMinutes} minutes</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Program length</span>
                            <span>{programSettings.programDurationMonths} months</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Request handling</span>
                            <span>
                              {programSettings.autoApprove === "auto"
                                ? "Auto-approve requests"
                                : "Manual review"}
                            </span>
                          </div>

                          <div className="pt-4 flex justify-end">
                            <Button
                              variant="outline"
                              onClick={() => setIsProgramSettingsOpen(true)}
                              disabled={!programSettingsHydrated}
                            >
                              Edit Program Settings
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </>
                )}
              </Tabs>

              {/* Mentorship Rating Dialog */}
              {ratingDialogRequest && (
                <Dialog
                  open={!!ratingDialogRequest}
                  onOpenChange={(open) => {
                    if (!open) {
                      setRatingDialogRequest(null);
                      setRatingValue(0);
                    }
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Rate {ratingDialogRequest.mentorName}
                      </DialogTitle>
                      <DialogDescription>
                        Share how helpful this mentorship has been. Your rating helps improve the
                        program and helps other mentees find great mentors.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2 text-sm">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Your rating</label>
                        <div className="flex items-center gap-2 mt-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <button
                              key={i}
                              type="button"
                              className="focus:outline-none"
                              onClick={() => setRatingValue(i + 1)}
                            >
                              <Star
                                className={`h-5 w-5 ${i < ratingValue ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                              />
                            </button>
                          ))}
                          {ratingValue > 0 && (
                            <span className="text-xs text-muted-foreground">{ratingValue} / 5</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRatingDialogRequest(null);
                            setRatingValue(0);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          disabled={ratingValue <= 0}
                          onClick={async () => {
                            if (!ratingDialogRequest || ratingValue <= 0) return;
                            
                            try {
                              const response = await fetch('/api/mentorship', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'x-user-email': user?.email || ''
                                },
                                body: JSON.stringify({
                                  requestId: ratingDialogRequest.id,
                                  rating: ratingValue
                                })
                              });
                              
                              if (response.ok) {
                                // Update local state
                                setMentorshipRequests((prev) =>
                                  prev.map((r) =>
                                    r.id === ratingDialogRequest.id ? { ...r, rating: ratingValue } : r
                                  )
                                );
                                alert(`✅ Thank you! You rated ${ratingDialogRequest.mentorName} ${ratingValue}/5 stars.`);
                                // Refresh data
                                await fetchMyMentorshipRequests();
                              } else {
                                const data = await response.json();
                                alert(`❌ Failed to submit rating: ${data.error}`);
                              }
                            } catch (error) {
                              console.error('Error submitting rating:', error);
                              alert('❌ Error submitting rating');
                            }
                            
                            setRatingDialogRequest(null);
                            setRatingValue(0);
                          }}
                        >
                          Submit Rating
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )
              }

              {/* Request Mentorship Dialog */}
              {
                selectedMentor && (
                  <Dialog
                    open={isRequestDialogOpen}
                    onOpenChange={(open) => {
                      if (!open) {
                        setIsRequestDialogOpen(false);
                        setSelectedMentor(null);
                        setMentorshipArea("");
                        setMentorshipMessage("");
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          Request Mentorship with {selectedMentor.firstName} {selectedMentor.lastName}
                        </DialogTitle>
                        <DialogDescription>
                          Select the area you want support in and add a short message so your mentor
                          understands your goals.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Mentorship Area</label>
                          <select
                            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                            value={mentorshipArea}
                            onChange={(e) => setMentorshipArea(e.target.value)}
                          >
                            <option value="">Select an area</option>
                            {selectedMentor.mentorshipAreas?.map((area: string) => (
                              <option key={area} value={area}>
                                {area.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                              </option>
                            ))}
                          </select>
                          {(!selectedMentor.mentorshipAreas || selectedMentor.mentorshipAreas.length === 0) && (
                            <p className="text-xs text-muted-foreground mt-1">No specific areas listed. Contact mentor directly.</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Message (optional)</label>
                          <textarea
                            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                            rows={4}
                            placeholder="Share your background, what you’d like help with, or topics you’d like to focus on."
                            value={mentorshipMessage}
                            onChange={(e) => setMentorshipMessage(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsRequestDialogOpen(false);
                              setSelectedMentor(null);
                              setMentorshipArea("");
                              setMentorshipMessage("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (!selectedMentor) return;
                              handleRequestMentorship(selectedMentor);
                            }}
                            disabled={!mentorshipArea}
                          >
                            Send Request
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              }

              {
                isAdmin && (
                  <>
                    <Dialog open={isAddMentorOpen} onOpenChange={setIsAddMentorOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Mentor</DialogTitle>
                          <DialogDescription>
                            Add a new mentor to the mentorship program.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">First Name</label>
                              <Input
                                placeholder="Enter first name"
                                value={newMentorForm.firstName}
                                onChange={(e) =>
                                  setNewMentorForm((prev) => ({
                                    ...prev,
                                    firstName: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Last Name</label>
                              <Input
                                placeholder="Enter last name"
                                value={newMentorForm.lastName}
                                onChange={(e) =>
                                  setNewMentorForm((prev) => ({
                                    ...prev,
                                    lastName: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Job Title</label>
                              <Input
                                placeholder="e.g. Senior Engineer"
                                value={newMentorForm.jobTitle}
                                onChange={(e) =>
                                  setNewMentorForm((prev) => ({
                                    ...prev,
                                    jobTitle: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Company</label>
                              <Input
                                placeholder="e.g. SLU Health"
                                value={newMentorForm.company}
                                onChange={(e) =>
                                  setNewMentorForm((prev) => ({
                                    ...prev,
                                    company: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Primary Mentorship Area</label>
                            <select
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                              value={newMentorForm.primaryArea}
                              onChange={(e) =>
                                setNewMentorForm((prev) => ({
                                  ...prev,
                                  primaryArea: e.target.value,
                                }))
                              }
                            >
                              <option value="">Select an area</option>
                              {availableAreas.map((area) => (
                                <option key={area} value={area}>
                                  {area.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                                </option>
                              ))}
                              {availableAreas.length === 0 && (
                                <>
                                  <option value="CAREER_DEVELOPMENT">Career Development</option>
                                  <option value="TECHNICAL_SKILLS">Technical Skills</option>
                                  <option value="LEADERSHIP">Leadership</option>
                                  <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                                  <option value="NETWORKING">Networking</option>
                                  <option value="ACADEMIC_GUIDANCE">Academic Guidance</option>
                                </>
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Mentor Bio</label>
                            <textarea
                              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                              rows={3}
                              placeholder="Short summary of the mentor's background and expertise"
                              value={newMentorForm.bio}
                              onChange={(e) =>
                                setNewMentorForm((prev) => ({
                                  ...prev,
                                  bio: e.target.value,
                                }))
                              }
                            />
                          </div>
                          {addMentorError && (
                            <p className="text-sm text-destructive text-right">{addMentorError}</p>
                          )}
                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsAddMentorOpen(false)} disabled={addMentorLoading}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveNewMentor} disabled={addMentorLoading}>
                              {addMentorLoading ? "Saving..." : "Save Mentor"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isProgramSettingsOpen} onOpenChange={setIsProgramSettingsOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mentorship Program Settings</DialogTitle>
                          <DialogDescription>
                            Configure high-level defaults for how the mentorship program operates.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Max Mentees per Mentor</label>
                              <Input
                                type="number"
                                className="mt-1"
                                value={programSettings.maxMenteesPerMentor}
                                onChange={(e) =>
                                  setProgramSettings((prev) => ({
                                    ...prev,
                                    maxMenteesPerMentor: parseInt(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">
                                Default Session Duration (minutes)
                              </label>
                              <Input
                                type="number"
                                className="mt-1"
                                value={programSettings.sessionDurationMinutes}
                                onChange={(e) =>
                                  setProgramSettings((prev) => ({
                                    ...prev,
                                    sessionDurationMinutes: parseInt(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Program Length (months)</label>
                              <Input
                                type="number"
                                className="mt-1"
                                value={programSettings.programDurationMonths}
                                onChange={(e) =>
                                  setProgramSettings((prev) => ({
                                    ...prev,
                                    programDurationMonths: parseInt(e.target.value) || 0,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Auto-approve Requests</label>
                              <select
                                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                                value={programSettings.autoApprove}
                                onChange={(e) =>
                                  setProgramSettings((prev) => ({
                                    ...prev,
                                    autoApprove: e.target.value === "auto" ? "auto" : "manual",
                                  }))
                                }
                              >
                                <option value="manual">Manual Review</option>
                                <option value="auto">Auto-approve</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Notification Preferences</label>
                            <div className="space-y-2 mt-1">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={programSettings.notifications.newMentorApplications}
                                  onChange={(e) =>
                                    setProgramSettings((prev) => ({
                                      ...prev,
                                      notifications: {
                                        ...prev.notifications,
                                        newMentorApplications: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-sm">New mentor applications</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={programSettings.notifications.mentorshipRequests}
                                  onChange={(e) =>
                                    setProgramSettings((prev) => ({
                                      ...prev,
                                      notifications: {
                                        ...prev.notifications,
                                        mentorshipRequests: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-sm">Mentorship requests</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={programSettings.notifications.sessionReminders}
                                  onChange={(e) =>
                                    setProgramSettings((prev) => ({
                                      ...prev,
                                      notifications: {
                                        ...prev.notifications,
                                        sessionReminders: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-sm">Session reminders</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={programSettings.notifications.programCompletion}
                                  onChange={(e) =>
                                    setProgramSettings((prev) => ({
                                      ...prev,
                                      notifications: {
                                        ...prev.notifications,
                                        programCompletion: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-sm">Program completion</span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={programSettings.notifications.feedbackRequests}
                                  onChange={(e) =>
                                    setProgramSettings((prev) => ({
                                      ...prev,
                                      notifications: {
                                        ...prev.notifications,
                                        feedbackRequests: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span className="text-sm">Feedback requests</span>
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2 pt-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsProgramSettingsOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  handleSaveProgramSettings();
                                  setIsProgramSettingsOpen(false);
                                }}
                                disabled={!programSettingsHydrated}
                              >
                                {saveSettingsStatus === "saved" ? "Settings Saved" : "Save Settings"}
                              </Button>
                            </div>
                            {saveSettingsStatus === "saved" && (
                              <p className="text-xs text-green-600 text-right">
                                Program settings saved for this browser.
                              </p>
                            )}
                            {saveSettingsStatus === "error" && (
                              <p className="text-xs text-destructive text-right">
                                Could not save settings. Please try again.
                              </p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Mentorship Request Dialog */}
                    <Dialog
                      open={!!editingRequest}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingRequest(null);
                        }
                      }}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Mentorship Request</DialogTitle>
                          <DialogDescription>
                            Update the status of a mentorship request. Changes are for this session only.
                          </DialogDescription>
                        </DialogHeader>
                        {editingRequest && (
                          <div className="space-y-4 mt-2 text-sm">
                            <div>
                              <span className="font-medium">Mentor: </span>
                              {editingRequest.mentorName}
                            </div>
                            <div>
                              <span className="font-medium">Area: </span>
                              {editingRequest.area}
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Status</label>
                              <select
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                value={editingStatus}
                                onChange={(e) =>
                                  setEditingStatus(e.target.value as MentorshipRequest["status"])
                                }
                              >
                                <option value="REQUESTED">REQUESTED</option>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="COMPLETED">COMPLETED</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Last Interaction</label>
                              <Input
                                value={editingRequest.lastInteraction}
                                onChange={(e) =>
                                  setEditingRequest((prev) =>
                                    prev ? { ...prev, lastInteraction: e.target.value } : prev
                                  )
                                }
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" onClick={() => setEditingRequest(null)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  if (!editingRequest) return;
                                  setMentorshipRequests((prev) =>
                                    prev.map((r) =>
                                      r.id === editingRequest.id
                                        ? { ...editingRequest, status: editingStatus }
                                        : r
                                    )
                                  );
                                  setEditingRequest(null);
                                }}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Review Mentor Application Dialog */}
                    <Dialog
                      open={!!reviewMentor}
                      onOpenChange={(open) => {
                        if (!open) {
                          setReviewMentor(null);
                        }
                      }}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Mentor Application</DialogTitle>
                          <DialogDescription>
                            Preview key details from the mentor&apos;s profile before approval.
                          </DialogDescription>
                        </DialogHeader>
                        {reviewMentor && (
                          <div className="space-y-3 mt-2 text-sm">
                            <div className="font-medium text-base">
                              {reviewMentor.firstName} {reviewMentor.lastName}
                            </div>
                            <div>
                              <span className="font-medium">Role: </span>
                              {reviewMentor.jobTitle}
                              {reviewMentor.company && ` at ${reviewMentor.company}`}
                            </div>
                            <div>
                              <span className="font-medium">Graduation Year: </span>
                              {reviewMentor.graduationYear}
                            </div>
                            <div>
                              <span className="font-medium">Expertise: </span>
                              {reviewMentor.expertise.join(", ")}
                            </div>
                            <div>
                              <span className="font-medium">Mentorship Areas: </span>
                              {reviewMentor.mentorshipAreas.join(", ")}
                            </div>
                            <div>
                              <span className="font-medium">Bio: </span>
                              <span className="text-muted-foreground">{reviewMentor.bio}</span>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" onClick={() => setReviewMentor(null)}>
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </>
                )
              }

              {/* My Mentorships Message Dialog */}
              {
                messageDialogMentor && (
                  <Dialog
                    open={!!messageDialogMentor}
                    onOpenChange={(open) => {
                      if (!open) {
                        setMessageDialogMentor(null);
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Message {messageDialogMentor}</DialogTitle>
                        <DialogDescription>
                          Send a quick update or question to your mentor.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Message</label>
                          <textarea
                            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                            rows={4}
                            placeholder="Share an update, ask a question, or propose a topic for your next session."
                            value={mentorshipMessage}
                            onChange={(e) => setMentorshipMessage(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setMessageDialogMentor(null);
                              setMentorshipMessage("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={!mentorshipMessage.trim()}
                            onClick={() => {
                              // Demo-only: in a full implementation, this would call the messages API.
                              setMessageDialogMentor(null);
                              setMentorshipMessage("");
                            }}
                          >
                            Send Message
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              }

              {/* My Mentorships Schedule Dialog */}
              {
                scheduleDialogMentor && (
                  <Dialog
                    open={!!scheduleDialogMentor}
                    onOpenChange={(open) => {
                      if (!open) {
                        setScheduleDialogMentor(null);
                        setScheduleDate("");
                        setScheduleTime("");
                        setScheduleNote("");
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Session with {scheduleDialogMentor}</DialogTitle>
                        <DialogDescription>
                          Propose a date and time for your next mentorship meeting.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Preferred Date</label>
                            <Input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Preferred Time</label>
                            <Input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Note (optional)</label>
                          <textarea
                            className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                            rows={3}
                            placeholder="Add any context or agenda you want to share."
                            value={scheduleNote}
                            onChange={(e) => setScheduleNote(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setScheduleDialogMentor(null);
                              setScheduleDate("");
                              setScheduleTime("");
                              setScheduleNote("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={!scheduleDate || !scheduleTime}
                            onClick={() => {
                              // Demo-only: in a full implementation, this would create a calendar request.
                              setScheduleDialogMentor(null);
                              setScheduleDate("");
                              setScheduleTime("");
                              setScheduleNote("");
                            }}
                          >
                            Send Request
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              }
            </div >
      </MainLayout >
    </ProtectedRoute >
  );
}
