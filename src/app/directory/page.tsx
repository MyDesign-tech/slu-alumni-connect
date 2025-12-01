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
import { SendMessageDialog } from "@/components/messaging/send-message-dialog";
import { Users, Search, Filter, Grid, List, MapPin, Briefcase, GraduationCap, MessageCircle, UserPlus, Star, Settings, Edit, Trash2, Plus, Shield, Eye, Calendar, RefreshCw, BarChart3, PieChart as PieChartIcon, Mail, Clock, Check } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AlumniProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  graduationYear: number;
  program: string;
  department: string;
  currentEmployer?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  country: string;
  profileImage?: string;
  bio?: string;
  verificationStatus: string;
  lastActive: string;
  isActive?: boolean; // Track if alumni is active or inactive
  lastLoginDate?: string; // Track last login for automatic activity detection
}

const COLORS = ['#003DA5', '#53C3EE', '#FFC72C', '#8FD6BD', '#795D3E', '#ED8B00'];

// Utility function to check if alumni is active based on 180-day rule
const isAlumniActive = (alumni: AlumniProfile): boolean => {
  // If manually set to inactive, respect that
  if (alumni.isActive === false) return false;

  // Check last login date (180 days = 6 months)
  if (alumni.lastLoginDate) {
    const lastLogin = new Date(alumni.lastLoginDate);
    const today = new Date();
    const daysSinceLogin = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLogin <= 180;
  }

  // Fallback to lastActive if no login date
  if (alumni.lastActive) {
    const lastActive = new Date(alumni.lastActive);
    const today = new Date();
    const daysSinceActive = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceActive <= 180;
  }

  // Default to active if no data
  return true;
};

export default function DirectoryPage() {
  const { user, isHydrated } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGradYear, setSelectedGradYear] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedAlumni, setSelectedAlumni] = useState<AlumniProfile | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [alumniProfiles, setAlumniProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAlumniOpen, setIsAddAlumniOpen] = useState(false);
  const [isDirectorySettingsOpen, setIsDirectorySettingsOpen] = useState(false);
  const [directoryDefaultView, setDirectoryDefaultView] = useState<"grid" | "list">("grid");
  const [directorySettingsSaved, setDirectorySettingsSaved] = useState(false);
  const [alumniAddedSuccess, setAlumniAddedSuccess] = useState(false);
  const [alumniToDelete, setAlumniToDelete] = useState<AlumniProfile | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<AlumniProfile | null>(null);
  const [connectedAlumniIds, setConnectedAlumniIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [quickViewAlumni, setQuickViewAlumni] = useState<AlumniProfile | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [gradYearFrom, setGradYearFrom] = useState("");
  const [gradYearTo, setGradYearTo] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Advanced Analytics Filters
  const [analyticsGradYearStart, setAnalyticsGradYearStart] = useState("");
  const [analyticsGradYearEnd, setAnalyticsGradYearEnd] = useState("");
  const [analyticsDepartment, setAnalyticsDepartment] = useState("");
  const [analyticsVerificationStatus, setAnalyticsVerificationStatus] = useState("");
  const [analyticsEmploymentStatus, setAnalyticsEmploymentStatus] = useState("");
  const [analyticsCountry, setAnalyticsCountry] = useState("");

  // New Alumni Form State
  const [newAlumni, setNewAlumni] = useState<any>({});
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'pending' | 'accepted' | 'received' }>({});

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections', {
        headers: {
          'x-user-email': user?.email || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        const statusMap: any = {};
        data.connections.forEach((c: any) => {
          const otherId = c.requesterId === user?.id ? c.recipientId : c.requesterId;
          if (c.status === 'accepted') {
            statusMap[otherId] = 'accepted';
          } else if (c.status === 'pending') {
            if (c.requesterId === user?.id) {
              statusMap[c.recipientId] = 'pending';
            } else {
              statusMap[c.requesterId] = 'received';
            }
          }
        });
        setConnectionStatus(statusMap);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  // Listen for connection updates
  useEffect(() => {
    const handleConnectionUpdate = () => {
      console.log('ðŸ”— Connection updated, refreshing...');
      fetchConnections();
    };

    window.addEventListener('connectionUpdated', handleConnectionUpdate);
    return () => window.removeEventListener('connectionUpdated', handleConnectionUpdate);
  }, [user]);

  // Get unique values for advanced filters
  const uniqueGradYears = useMemo(() => {
    const years = alumniProfiles.map(a => a.graduationYear).filter(Boolean);
    const sorted = [...new Set(years)].sort((a, b) => b - a);
    return sorted;
  }, [alumniProfiles]);

  const uniqueStates = useMemo(() => {
    return [...new Set(alumniProfiles.map(a => a.state).filter(Boolean))].sort();
  }, [alumniProfiles]);

  const uniqueIndustries = useMemo(() => {
    const industries = alumniProfiles
      .map(a => a.currentEmployer)
      .filter(Boolean)
      .map(e => {
        const employer = e || '';
        // Extract industry from employer name (simplified)
        if (employer.toLowerCase().includes('tech') || employer.toLowerCase().includes('software')) return 'Technology';
        if (employer.toLowerCase().includes('health') || employer.toLowerCase().includes('medical')) return 'Healthcare';
        if (employer.toLowerCase().includes('bank') || employer.toLowerCase().includes('finance')) return 'Finance';
        if (employer.toLowerCase().includes('edu')) return 'Education';
        return 'Other';
      });
    return [...new Set(industries)].sort();
  }, [alumniProfiles]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedDepartment) count++;
    if (selectedGradYear) count++;
    if (selectedLocation) count++;
    if (employmentFilter) count++;
    if (verificationFilter) count++;
    if (countryFilter) count++;
    if (stateFilter) count++;
    if (industryFilter) count++;
    if (gradYearFrom) count++;
    if (gradYearTo) count++;
    return count;
  }, [searchTerm, selectedDepartment, selectedGradYear, selectedLocation, employmentFilter, verificationFilter, countryFilter, stateFilter, industryFilter, gradYearFrom, gradYearTo]);

  // Filtered alumni for analytics based on advanced filters
  const analyticsFilteredAlumni = useMemo(() => {
    return alumniProfiles.filter(alumni => {
      // Graduation year range filter
      if (analyticsGradYearStart && alumni.graduationYear < parseInt(analyticsGradYearStart)) return false;
      if (analyticsGradYearEnd && alumni.graduationYear > parseInt(analyticsGradYearEnd)) return false;

      // Department filter
      if (analyticsDepartment && alumni.department !== analyticsDepartment) return false;

      // Verification status filter
      if (analyticsVerificationStatus && alumni.verificationStatus !== analyticsVerificationStatus) return false;

      // Employment status filter (has employer or not)
      if (analyticsEmploymentStatus === 'employed' && !alumni.currentEmployer) return false;
      if (analyticsEmploymentStatus === 'seeking' && alumni.currentEmployer) return false;

      // Country filter
      if (analyticsCountry && alumni.country !== analyticsCountry) return false;

      return true;
    });
  }, [alumniProfiles, analyticsGradYearStart, analyticsGradYearEnd, analyticsDepartment, analyticsVerificationStatus, analyticsEmploymentStatus, analyticsCountry]);

  // Get unique values for filter dropdowns
  const uniqueDepartments = useMemo(() => {
    return [...new Set(alumniProfiles.map(a => a.department).filter(Boolean))].sort();
  }, [alumniProfiles]);

  const uniqueCountries = useMemo(() => {
    return [...new Set(alumniProfiles.map(a => a.country).filter(Boolean))].sort();
  }, [alumniProfiles]);

  const uniqueVerificationStatuses = useMemo(() => {
    return [...new Set(alumniProfiles.map(a => a.verificationStatus).filter(Boolean))].sort();
  }, [alumniProfiles]);

  const gradYearRange = useMemo(() => {
    const years = alumniProfiles.map(a => a.graduationYear).filter(Boolean);
    if (years.length === 0) return { min: 2000, max: new Date().getFullYear() };
    return { min: Math.min(...years), max: Math.max(...years) };
  }, [alumniProfiles]);

  // Analytics Data Preparation - Now uses analyticsFilteredAlumni
  const departmentDistribution = useMemo(() => {
    const depts: Record<string, number> = {};
    analyticsFilteredAlumni.forEach(p => {
      depts[p.department] = (depts[p.department] || 0) + 1;
    });
    return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredAlumni]);

  const locationDistribution = useMemo(() => {
    const locs: Record<string, number> = {};
    analyticsFilteredAlumni.forEach(p => {
      const loc = p.city ? `${p.city}, ${p.state || ''}` : p.country;
      locs[loc] = (locs[loc] || 0) + 1;
    });
    // Top 10 locations
    return Object.entries(locs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredAlumni]);

  const gradYearTrends = useMemo(() => {
    const years: Record<string, number> = {};
    analyticsFilteredAlumni.forEach(p => {
      years[p.graduationYear] = (years[p.graduationYear] || 0) + 1;
    });
    return Object.entries(years)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredAlumni]);

  // Additional analytics data
  const verificationStatusDistribution = useMemo(() => {
    const statuses: Record<string, number> = {};
    analyticsFilteredAlumni.forEach(p => {
      const status = p.verificationStatus || 'Unknown';
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredAlumni]);

  const employmentDistribution = useMemo(() => {
    let employed = 0;
    let seeking = 0;
    analyticsFilteredAlumni.forEach(p => {
      if (p.currentEmployer) employed++;
      else seeking++;
    });
    return [
      { name: 'Employed', value: employed },
      { name: 'Seeking/Unknown', value: seeking }
    ];
  }, [analyticsFilteredAlumni]);

  const countryDistribution = useMemo(() => {
    const countries: Record<string, number> = {};
    analyticsFilteredAlumni.forEach(p => {
      const country = p.country || 'Unknown';
      countries[country] = (countries[country] || 0) + 1;
    });
    return Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredAlumni]);

  // Clear all analytics filters
  const clearAnalyticsFilters = () => {
    setAnalyticsGradYearStart("");
    setAnalyticsGradYearEnd("");
    setAnalyticsDepartment("");
    setAnalyticsVerificationStatus("");
    setAnalyticsEmploymentStatus("");
    setAnalyticsCountry("");
  };

  // Fetch alumni data from API
  useEffect(() => {
    fetchAlumni();
  }, []);

  // Listen for profile updates from other pages and refresh directory
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('ðŸ“ Profile updated, refreshing directory...', event.detail);
      // Add a small delay to ensure the API has the latest data
      setTimeout(() => {
        fetchAlumni();
      }, 500);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/directory', {
        cache: 'no-store',
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlumniProfiles(data.alumni || []);
      } else {
        console.error('âŒ Failed to fetch alumni:', response.status, response.statusText);
        setAlumniProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter alumni based on search criteria
  const filteredAlumni = alumniProfiles.filter(alumni => {
    // Basic search
    const matchesSearch =
      alumni.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.currentEmployer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    // Basic filters
    const matchesDepartment = !selectedDepartment || alumni.department === selectedDepartment;
    const matchesGradYear = !selectedGradYear || alumni.graduationYear.toString() === selectedGradYear;
    const matchesLocation = !selectedLocation ||
      alumni.city?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      alumni.state?.toLowerCase().includes(selectedLocation.toLowerCase());

    // Advanced filters
    const matchesEmployment = !employmentFilter ||
      (employmentFilter === 'employed' && alumni.currentEmployer) ||
      (employmentFilter === 'seeking' && !alumni.currentEmployer);

    const matchesVerification = !verificationFilter || alumni.verificationStatus === verificationFilter;

    const matchesCountry = !countryFilter || alumni.country === countryFilter;

    const matchesState = !stateFilter || alumni.state === stateFilter;

    const matchesIndustry = !industryFilter || (() => {
      const employer = alumni.currentEmployer?.toLowerCase() || '';
      if (industryFilter === 'Technology') return employer.includes('tech') || employer.includes('software');
      if (industryFilter === 'Healthcare') return employer.includes('health') || employer.includes('medical');
      if (industryFilter === 'Finance') return employer.includes('bank') || employer.includes('finance');
      if (industryFilter === 'Education') return employer.includes('edu');
      return industryFilter === 'Other';
    })();

    const matchesGradYearFrom = !gradYearFrom || alumni.graduationYear >= parseInt(gradYearFrom);
    const matchesGradYearTo = !gradYearTo || alumni.graduationYear <= parseInt(gradYearTo);

    // Active status filter - now automatic based on 180-day rule
    const matchesActiveStatus =
      activeStatusFilter === 'all' ||
      (activeStatusFilter === 'active' && isAlumniActive(alumni)) ||
      (activeStatusFilter === 'inactive' && !isAlumniActive(alumni));

    return matchesSearch && matchesDepartment && matchesGradYear && matchesLocation &&
      matchesEmployment && matchesVerification && matchesCountry && matchesState &&
      matchesIndustry && matchesGradYearFrom && matchesGradYearTo && matchesActiveStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlumni = filteredAlumni.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedGradYear, selectedLocation, employmentFilter, verificationFilter, countryFilter, stateFilter, industryFilter, gradYearFrom, gradYearTo]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("");
    setSelectedGradYear("");
    setSelectedLocation("");
    setEmploymentFilter("");
    setVerificationFilter("");
    setCountryFilter("");
    setStateFilter("");
    setIndustryFilter("");
    setGradYearFrom("");
    setGradYearTo("");
  };

  // Analytics Data
  const departmentData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    alumniProfiles.forEach(a => {
      const dept = a.department || 'Unknown';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [alumniProfiles]);

  const locationData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    alumniProfiles.forEach(a => {
      const loc = a.state || a.country || 'Unknown';
      counts[loc] = (counts[loc] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [alumniProfiles]);

  const gradYearData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    alumniProfiles.forEach(a => {
      const year = a.graduationYear.toString();
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, value]) => ({ name, value }));
  }, [alumniProfiles]);

  const handleConnect = async (alumni: AlumniProfile) => {
    if (connectedAlumniIds.includes(alumni.id)) return;

    try {
      // Optimistic update
      setConnectionStatus(prev => ({ ...prev, [alumni.id]: 'pending' }));

      // Send connection request via API
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || ''
        },
        body: JSON.stringify({
          recipientId: alumni.id,
          recipientEmail: alumni.email
        })
      });

      if (response.ok) {
        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('connectionUpdated'));
        alert(`âœ… Connection request sent to ${alumni.firstName} ${alumni.lastName}!`);
      } else {
        // Revert on failure
        setConnectionStatus(prev => {
          const updated = { ...prev };
          delete updated[alumni.id];
          return updated;
        });
        alert('Failed to send connection request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Error sending connection request.');
    }
  };

  const handleEdit = (alumni: AlumniProfile) => {
    setEditingAlumni(alumni);
  };

  const handleDelete = (alumni: AlumniProfile) => {
    setAlumniToDelete(alumni);
  };

  const confirmDelete = async () => {
    if (!alumniToDelete) return;

    try {
      // Call API to delete from backend
      const response = await fetch(`/api/directory/${alumniToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        // Show success message
        setDeleteSuccess(true);

        // Refresh the alumni list from server to ensure sync
        await fetchAlumni();

        setTimeout(() => {
          setDeleteSuccess(false);
          setAlumniToDelete(null);
        }, 1500);
      } else {
        // Parse error response
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status-based message
          if (response.status === 404) {
            errorMessage = 'Alumni not found (may have been already deleted)';
            // Refresh list to sync with server
            await fetchAlumni();
          } else if (response.status === 403) {
            errorMessage = 'Admin access required';
          } else {
            errorMessage = `Server error (${response.status})`;
          }
        }

        console.error('Failed to delete alumni:', errorMessage);
        alert(`Failed to delete alumni: ${errorMessage}`);
        setAlumniToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting alumni:', error);
      alert('Network error while deleting alumni. Please try again.');
      setAlumniToDelete(null);
    }
  };

  const handleVerifyAlumni = (alumni: AlumniProfile) => {
    const updatedProfiles = alumniProfiles.map(a =>
      a.id === alumni.id ? { ...a, verificationStatus: 'VERIFIED' } : a
    );
    setAlumniProfiles(updatedProfiles);
    alert(`${alumni.firstName} ${alumni.lastName} has been verified!`);
  };

  const handleQuickView = (alumni: AlumniProfile) => {
    setQuickViewAlumni(alumni);
  };

  const handleAddAlumni = () => {
    setNewAlumni({});
    setIsAddAlumniOpen(true);
  };

  const saveNewAlumni = async () => {
    if (!newAlumni.firstName || !newAlumni.lastName || !newAlumni.email) {
      alert('Please fill in required fields: First Name, Last Name, and Email');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        },
        body: JSON.stringify({
          firstName: newAlumni.firstName,
          lastName: newAlumni.lastName,
          email: newAlumni.email,
          graduationYear: newAlumni.graduationYear || new Date().getFullYear(),
          program: newAlumni.program || 'General',
          department: newAlumni.department || 'OTHER',
          currentEmployer: newAlumni.currentEmployer || '',
          jobTitle: newAlumni.jobTitle || '',
          city: newAlumni.city || '',
          state: newAlumni.state || '',
          country: newAlumni.country || 'USA',
          bio: newAlumni.bio || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Alumni added:', data);

        // Close dialog and reset form
        setIsAddAlumniOpen(false);
        setNewAlumni({});

        // Refresh the list to show new alumni
        await fetchAlumni();

        alert(`✅ ${newAlumni.firstName} ${newAlumni.lastName} has been added successfully!`);
      } else {
        const error = await response.json();
        alert(`❌ Failed to add alumni: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding alumni:', error);
      alert('❌ Network error while adding alumni. Please try again.');
      setLoading(false);
    }
  };

  const toggleAlumniActiveStatus = async (alumni: AlumniProfile) => {
    const newStatus = !alumni.isActive; // Toggle: if undefined or true, set to false; if false, set to true
    const actualNewStatus = alumni.isActive === undefined ? false : newStatus;

    try {
      const response = await fetch(`/api/directory/${alumni.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        },
        body: JSON.stringify({
          isActive: actualNewStatus
        })
      });

      if (response.ok) {
        // Update local state
        setAlumniProfiles(prev =>
          prev.map(a => a.id === alumni.id ? { ...a, isActive: actualNewStatus } : a)
        );
        console.log(`✅ Alumni ${alumni.firstName} ${alumni.lastName} set to ${actualNewStatus ? 'active' : 'inactive'}`);
      } else {
        alert('Failed to update alumni status');
      }
    } catch (error) {
      console.error('Error updating alumni status:', error);
      alert('Error updating alumni status');
    }
  };

  const handleDirectorySettings = () => {
    setIsDirectorySettingsOpen(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      STEM: "bg-blue-100 text-blue-800",
      BUSINESS: "bg-green-100 text-green-800",
      HEALTHCARE: "bg-red-100 text-red-800",
      SOCIAL_SCIENCES: "bg-purple-100 text-purple-800",
      HUMANITIES: "bg-orange-100 text-orange-800"
    };
    return colors[department as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-4">
                {isAdmin ? "Alumni Directory Management" : "Alumni Directory"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {isAdmin
                  ? "Manage alumni profiles, verify accounts, and oversee directory access and privacy settings."
                  : "Connect with fellow SLU alumni across industries, locations, and graduation years."
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAlumni} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {isAdmin && (
                <Button onClick={handleAddAlumni}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alumni
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="directory" className="space-y-6">
            <TabsList>
              <TabsTrigger value="directory" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Directory List
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics & Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="directory">
              {/* Active/Inactive Alumni Status Cards - Admin Only */}
              {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setActiveStatusFilter('all')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Alumni</p>
                          <h3 className="text-3xl font-bold mt-2">{alumniProfiles.length}</h3>
                        </div>
                        <Users className={`h-10 w-10 ${activeStatusFilter === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      {activeStatusFilter === 'all' && (
                        <div className="mt-2">
                          <Badge variant="default">Currently Viewing</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer"
                    onClick={() => setActiveStatusFilter('active')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Alumni</p>
                          <h3 className="text-3xl font-bold mt-2 text-green-600">
                            {alumniProfiles.filter(a => isAlumniActive(a)).length}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">Recently active</p>
                        </div>
                        <Check className={`h-10 w-10 ${activeStatusFilter === 'active' ? 'text-green-600' : 'text-muted-foreground'}`} />
                      </div>
                      {activeStatusFilter === 'active' && (
                        <div className="mt-2">
                          <Badge className="bg-green-600">Currently Viewing</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                    onClick={() => setActiveStatusFilter('inactive')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Inactive Alumni</p>
                          <h3 className="text-3xl font-bold mt-2 text-red-600">
                            {alumniProfiles.filter(a => !isAlumniActive(a)).length}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">Not recently active</p>
                        </div>
                        <Clock className={`h-10 w-10 ${activeStatusFilter === 'inactive' ? 'text-red-600' : 'text-muted-foreground'}`} />
                      </div>
                      {activeStatusFilter === 'inactive' && (
                        <div className="mt-2">
                          <Badge className="bg-red-600">Currently Viewing</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search and Filters */}
              <Card className="mb-8 border-2 border-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search & Filter Alumni
                      {activeFilterCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {activeFilterCount} active
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      {activeFilterCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearAllFilters}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        {showAdvancedFilters ? 'Hide Advanced' : 'Show Advanced'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Basic Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                      <Input
                        placeholder="Search by name, program, company, or job title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">All Departments</option>
                      <option value="STEM">STEM</option>
                      <option value="BUSINESS">Business</option>
                      <option value="HEALTHCARE">Healthcare</option>
                      <option value="SOCIAL_SCIENCES">Social Sciences</option>
                      <option value="HUMANITIES">Humanities</option>
                    </select>

                    <select
                      value={selectedGradYear}
                      onChange={(e) => setSelectedGradYear(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">All Years</option>
                      {uniqueGradYears.slice(0, 10).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>

                    <Input
                      placeholder="Location (city, state)"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    />

                    <select
                      value={activeStatusFilter}
                      onChange={(e) => setActiveStatusFilter(e.target.value as "all" | "active" | "inactive")}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="all">All Alumni</option>
                      <option value="active">✓ Active</option>
                      <option value="inactive">⏰ Inactive</option>
                    </select>
                  </div>

                  {/* Advanced Filters Panel */}
                  {showAdvancedFilters && (
                    <div className="mt-6 pt-6 border-t space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Advanced Filters</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Graduation Year Range */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Grad Year Range</label>
                          <div className="flex gap-2">
                            <select
                              value={gradYearFrom}
                              onChange={(e) => setGradYearFrom(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background"
                            >
                              <option value="">From</option>
                              {uniqueGradYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                            <select
                              value={gradYearTo}
                              onChange={(e) => setGradYearTo(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background"
                            >
                              <option value="">To</option>
                              {uniqueGradYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Employment Status */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                          <select
                            value={employmentFilter}
                            onChange={(e) => setEmploymentFilter(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                          >
                            <option value="">All Status</option>
                            <option value="employed">Employed</option>
                            <option value="seeking">Seeking/Unknown</option>
                          </select>
                        </div>

                        {/* Verification Status */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Verification</label>
                          <select
                            value={verificationFilter}
                            onChange={(e) => setVerificationFilter(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                          >
                            <option value="">All</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="PENDING">Pending</option>
                            <option value="UNVERIFIED">Unverified</option>
                          </select>
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Industry</label>
                          <select
                            value={industryFilter}
                            onChange={(e) => setIndustryFilter(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                          >
                            <option value="">All Industries</option>
                            {uniqueIndustries.map(industry => (
                              <option key={industry} value={industry}>{industry}</option>
                            ))}
                          </select>
                        </div>

                        {/* Country */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Country</label>
                          <select
                            value={countryFilter}
                            onChange={(e) => setCountryFilter(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                          >
                            <option value="">All Countries</option>
                            {uniqueCountries.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                        </div>

                        {/* State */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">State</label>
                          <select
                            value={stateFilter}
                            onChange={(e) => setStateFilter(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                          >
                            <option value="">All States</option>
                            {uniqueStates.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Active Advanced Filters Display */}
                      {(employmentFilter || verificationFilter || countryFilter || stateFilter || industryFilter || gradYearFrom || gradYearTo) && (
                        <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
                          <span className="text-sm text-muted-foreground font-medium">Active advanced filters:</span>
                          {gradYearFrom && (
                            <Badge variant="secondary" className="gap-1">
                              From {gradYearFrom}
                              <button onClick={() => setGradYearFrom("")} className="ml-1 hover:text-destructive">Ã—</button>
                            </Badge>
                          )}
                          {gradYearTo && (
                            <Badge variant="secondary" className="gap-1">
                              To {gradYearTo}
                              <button onClick={() => setGradYearTo("")} className="ml-1 hover:text-destructive">Ã—</button>
                            </Badge>
                          )}
                          {employmentFilter && (
                            <Badge variant="secondary" className="gap-1">
                              {employmentFilter === 'employed' ? 'Employed' : 'Seeking'}
                              <button onClick={() => setEmploymentFilter("")} className="ml-1 hover:text-destructive">Ã—</button>
                            </Badge>
                          )}
                          {verificationFilter && (
                            <Badge variant="secondary" className="gap-1">
                              {verificationFilter}
                              <button onClick={() => setVerificationFilter("")} className="ml-1 hover:text-destructive">Ã—</button>
                            </Badge>
                          )}
                          {industryFilter && (
                            <Badge variant="secondary" className="gap-1">
                              {industryFilter}
                              <button onClick={() => setIndustryFilter("")} className="ml-1 hover:text-destructive">Ã—</button>
                            </Badge>
                          )}
                          {countryFilter && (
                            <Badge variant="secondary" className="gap-1">
                              {countryFilter}
                              <button onClick={() => setCountryFilter("")} className="ml-1 hover:text-destructive">Ã—</button>
                            </Badge>
                          )}
                          {stateFilter && (
                            <Badge variant="secondary" className="gap-1">
                              {stateFilter}
                              <button onClick={() => setStateFilter("")} className="ml-1 hover:text-destructive">Ã—</button>
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredAlumni.length)} of {filteredAlumni.length} alumni
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Page {currentPage} of {totalPages}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alumni Grid/List */}
              <div className={viewMode === "grid" ?
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" :
                "space-y-4"
              }>
                {paginatedAlumni.map((alumni) => (
                  <Card key={alumni.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer group" onClick={() => handleQuickView(alumni)}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-14 h-14 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                            <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                              {getInitials(alumni.firstName, alumni.lastName)}
                            </div>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {alumni.firstName} {alumni.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Class of {alumni.graduationYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {alumni.verificationStatus === "VERIFIED" && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className={`text-xs ${!isAlumniActive(alumni) ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}
                          >
                            {!isAlumniActive(alumni) ? '⏰ Inactive' : '✓ Active'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>{alumni.program}</span>
                        <Badge className={`text-xs ${getDepartmentColor(alumni.department)}`}>
                          {alumni.department}
                        </Badge>
                      </div>

                      {alumni.currentEmployer && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{alumni.jobTitle} at {alumni.currentEmployer}</span>
                        </div>
                      )}

                      {alumni.city && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{alumni.city}, {alumni.state}</span>
                        </div>
                      )}

                      {alumni.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {alumni.bio}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Active {alumni.lastActive}
                          </span>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {isAdmin ? (
                            <div className="flex gap-1">
                              {alumni.verificationStatus !== 'VERIFIED' && (
                                <Button size="sm" variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200" onClick={() => handleVerifyAlumni(alumni)}>
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className={alumni.isActive === false ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}
                                onClick={() => toggleAlumniActiveStatus(alumni)}
                                title={alumni.isActive === false ? "Mark as Active" : "Mark as Inactive"}
                              >
                                {alumni.isActive === false ? (
                                  <>
                                    <Clock className="h-4 w-4" />
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4" />
                                  </>
                                )}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleQuickView(alumni)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(alumni)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(alumni)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <SendMessageDialog
                                recipientEmail={alumni.email}
                                recipientName={`${alumni.firstName} ${alumni.lastName}`}
                                trigger={
                                  <Button size="sm" variant="outline">
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Message
                                  </Button>
                                }
                              />

                              {connectionStatus[alumni.id] === 'accepted' ? (
                                <Button size="sm" variant="outline" className="bg-green-50 text-green-700 border-green-200" disabled>
                                  <Check className="h-4 w-4 mr-1" /> Connected
                                </Button>
                              ) : connectionStatus[alumni.id] === 'pending' ? (
                                <Button size="sm" variant="outline" disabled>
                                  <Clock className="h-4 w-4 mr-1" /> Pending
                                </Button>
                              ) : connectionStatus[alumni.id] === 'received' ? (
                                <Button size="sm" variant="default" onClick={() => window.location.href = '/messages'}>
                                  <UserPlus className="h-4 w-4 mr-1" /> Respond
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleConnect(alumni)}
                                  disabled={connectedAlumniIds.includes(alumni.id)}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" /> Connect
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredAlumni.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alumni found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search criteria or filters to find more alumni.
                  </p>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
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

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
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
                </div>
              )}

              {/* Quick View Modal */}
              <Dialog open={!!quickViewAlumni} onOpenChange={(open) => !open && setQuickViewAlumni(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <div className="w-full h-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                          {quickViewAlumni && getInitials(quickViewAlumni.firstName, quickViewAlumni.lastName)}
                        </div>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          {quickViewAlumni?.firstName} {quickViewAlumni?.lastName}
                          {quickViewAlumni?.verificationStatus === "VERIFIED" && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                              <Check className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Class of {quickViewAlumni?.graduationYear}
                        </p>
                      </div>
                    </DialogTitle>
                  </DialogHeader>
                  {quickViewAlumni && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{quickViewAlumni.email}</p>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Program</label>
                            <div className="flex items-center gap-2 mt-1">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{quickViewAlumni.program}</p>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Department</label>
                            <Badge className={`text-xs mt-1 ${getDepartmentColor(quickViewAlumni.department)}`}>
                              {quickViewAlumni.department}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {quickViewAlumni.currentEmployer && (
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Current Position</label>
                              <div className="flex items-center gap-2 mt-1">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{quickViewAlumni.jobTitle}</p>
                                  <p className="text-xs text-muted-foreground">{quickViewAlumni.currentEmployer}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {(quickViewAlumni.city || quickViewAlumni.state) && (
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Location</label>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">{quickViewAlumni.city}, {quickViewAlumni.state}</p>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Last Active</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{quickViewAlumni.lastActive}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {quickViewAlumni.bio && (
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Bio</label>
                          <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-3 rounded-lg">
                            {quickViewAlumni.bio}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t">
                        {!isAdmin && (
                          <>
                            <SendMessageDialog
                              recipientEmail={quickViewAlumni.email}
                              recipientName={`${quickViewAlumni.firstName} ${quickViewAlumni.lastName}`}
                              trigger={
                                <Button className="flex-1">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Send Message
                                </Button>
                              }
                            />

                            {connectionStatus[quickViewAlumni.id] === 'accepted' ? (
                              <Button variant="outline" className="flex-1 bg-green-50 text-green-700 border-green-200" disabled>
                                <Check className="h-4 w-4 mr-2" /> Connected
                              </Button>
                            ) : connectionStatus[quickViewAlumni.id] === 'pending' ? (
                              <Button variant="outline" className="flex-1" disabled>
                                <Clock className="h-4 w-4 mr-2" /> Pending
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleConnect(quickViewAlumni)}
                              >
                                <UserPlus className="h-4 w-4 mr-2" /> Connect
                              </Button>
                            )}
                          </>
                        )}
                        {isAdmin && (
                          <>
                            {quickViewAlumni.verificationStatus !== 'VERIFIED' && (
                              <Button onClick={() => { handleVerifyAlumni(quickViewAlumni); setQuickViewAlumni(null); }}>
                                <Shield className="h-4 w-4 mr-2" /> Verify Alumni
                              </Button>
                            )}
                            <Button variant="outline" onClick={() => { setEditingAlumni(quickViewAlumni); setQuickViewAlumni(null); }}>
                              <Edit className="h-4 w-4 mr-2" /> Edit Profile
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Admin Dialogs */}
              {isAdmin && (
                <>
                  {/* Add Alumni Dialog */}
                  <Dialog open={isAddAlumniOpen} onOpenChange={setIsAddAlumniOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Alumni</DialogTitle>
                        <DialogDescription>
                          Add a new alumni to the directory. This will update the charts immediately.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="First Name"
                            value={newAlumni.firstName || ''}
                            onChange={e => setNewAlumni({ ...newAlumni, firstName: e.target.value })}
                          />
                          <Input
                            placeholder="Last Name"
                            value={newAlumni.lastName || ''}
                            onChange={e => setNewAlumni({ ...newAlumni, lastName: e.target.value })}
                          />
                        </div>
                        <Input
                          placeholder="Email"
                          value={newAlumni.email || ''}
                          onChange={e => setNewAlumni({ ...newAlumni, email: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Grad Year"
                            type="number"
                            value={newAlumni.graduationYear || ''}
                            onChange={e => setNewAlumni({ ...newAlumni, graduationYear: parseInt(e.target.value) })}
                          />
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={newAlumni.department || ''}
                            onChange={e => setNewAlumni({ ...newAlumni, department: e.target.value })}
                          >
                            <option value="">Select Dept</option>
                            <option value="STEM">STEM</option>
                            <option value="BUSINESS">Business</option>
                            <option value="HEALTHCARE">Healthcare</option>
                            <option value="HUMANITIES">Humanities</option>
                            <option value="SOCIAL_SCIENCES">Social Sciences</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <Input
                          placeholder="State/Location"
                          value={newAlumni.state || ''}
                          onChange={e => setNewAlumni({ ...newAlumni, state: e.target.value })}
                        />
                        <Button onClick={saveNewAlumni} className="w-full">Save Alumni</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* View Alumni */}
                  <Dialog open={!!selectedAlumni} onOpenChange={(open) => !open && setSelectedAlumni(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{selectedAlumni?.firstName} {selectedAlumni?.lastName}</DialogTitle>
                      </DialogHeader>
                      {selectedAlumni && (
                        <div className="space-y-2">
                          <p><strong>Email:</strong> {selectedAlumni.email}</p>
                          <p><strong>Class:</strong> {selectedAlumni.graduationYear}</p>
                          <p><strong>Dept:</strong> {selectedAlumni.department}</p>
                          <p><strong>Location:</strong> {selectedAlumni.city}, {selectedAlumni.state}</p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Edit Alumni */}
                  <Dialog open={!!editingAlumni} onOpenChange={(open) => !open && setEditingAlumni(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Alumni</DialogTitle>
                      </DialogHeader>
                      {editingAlumni && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              value={editingAlumni.firstName}
                              onChange={e => setEditingAlumni({ ...editingAlumni, firstName: e.target.value })}
                            />
                            <Input
                              value={editingAlumni.lastName}
                              onChange={e => setEditingAlumni({ ...editingAlumni, lastName: e.target.value })}
                            />
                          </div>
                          <Input
                            value={editingAlumni.email}
                            onChange={e => setEditingAlumni({ ...editingAlumni, email: e.target.value })}
                          />
                          <Button onClick={() => {
                            setAlumniProfiles(prev => prev.map(a => a.id === editingAlumni.id ? editingAlumni : a));
                            setEditingAlumni(null);
                          }}>Save Changes</Button>
                        </div>
                      )}


                    </DialogContent>
                  </Dialog>

                  <Dialog open={isDirectorySettingsOpen} onOpenChange={setIsDirectorySettingsOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Directory Settings</DialogTitle>
                        <DialogDescription>
                          Configure high-level settings for how the alumni directory behaves.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Default View</label>
                          <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                            <option value="grid">Grid</option>
                            <option value="list">List</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsDirectorySettingsOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setIsDirectorySettingsOpen(false)}>
                            Save Settings
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Confirmation Dialog */}
                  <Dialog open={!!alumniToDelete} onOpenChange={(open) => !open && setAlumniToDelete(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                          <Trash2 className="h-5 w-5" />
                          Confirm Delete
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove <strong className="text-foreground">{alumniToDelete?.firstName} {alumniToDelete?.lastName}</strong> from the directory? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setAlumniToDelete(null)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={confirmDelete}
                          className={deleteSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {deleteSuccess ? '✓ Deleted!' : 'Delete Alumni'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Advanced Analytics Filters */}
              <Card className="border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Analytics Filters
                    </span>
                    <Button variant="outline" size="sm" onClick={clearAnalyticsFilters}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Filters
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Filter the analytics data to focus on specific segments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

                    {/* Department Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Department</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={analyticsDepartment}
                        onChange={e => setAnalyticsDepartment(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {uniqueDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* Verification Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Verification</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={analyticsVerificationStatus}
                        onChange={e => setAnalyticsVerificationStatus(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {uniqueVerificationStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* Employment Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employment</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={analyticsEmploymentStatus}
                        onChange={e => setAnalyticsEmploymentStatus(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="employed">Employed</option>
                        <option value="seeking">Seeking/Unknown</option>
                      </select>
                    </div>

                    {/* Country Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={analyticsCountry}
                        onChange={e => setAnalyticsCountry(e.target.value)}
                      >
                        <option value="">All Countries</option>
                        {uniqueCountries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active Filters Summary */}
                  {(analyticsGradYearStart || analyticsGradYearEnd || analyticsDepartment || analyticsVerificationStatus || analyticsEmploymentStatus || analyticsCountry) && (
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-muted-foreground">Active filters:</span>
                      {analyticsGradYearStart && (
                        <Badge variant="secondary" className="gap-1">
                          From {analyticsGradYearStart}
                          <button onClick={() => setAnalyticsGradYearStart("")} className="ml-1 hover:text-destructive">Ã—</button>
                        </Badge>
                      )}
                      {analyticsGradYearEnd && (
                        <Badge variant="secondary" className="gap-1">
                          To {analyticsGradYearEnd}
                          <button onClick={() => setAnalyticsGradYearEnd("")} className="ml-1 hover:text-destructive">Ã—</button>
                        </Badge>
                      )}
                      {analyticsDepartment && (
                        <Badge variant="secondary" className="gap-1">
                          {analyticsDepartment}
                          <button onClick={() => setAnalyticsDepartment("")} className="ml-1 hover:text-destructive">Ã—</button>
                        </Badge>
                      )}
                      {analyticsVerificationStatus && (
                        <Badge variant="secondary" className="gap-1">
                          {analyticsVerificationStatus}
                          <button onClick={() => setAnalyticsVerificationStatus("")} className="ml-1 hover:text-destructive">Ã—</button>
                        </Badge>
                      )}
                      {analyticsEmploymentStatus && (
                        <Badge variant="secondary" className="gap-1">
                          {analyticsEmploymentStatus === 'employed' ? 'Employed' : 'Seeking'}
                          <button onClick={() => setAnalyticsEmploymentStatus("")} className="ml-1 hover:text-destructive">Ã—</button>
                        </Badge>
                      )}
                      {analyticsCountry && (
                        <Badge variant="secondary" className="gap-1">
                          {analyticsCountry}
                          <button onClick={() => setAnalyticsCountry("")} className="ml-1 hover:text-destructive">Ã—</button>
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Alumni Network Analytics
                    <Badge variant="outline" className="ml-2">
                      {analyticsFilteredAlumni.length} of {alumniProfiles.length} Alumni
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="text-sm text-muted-foreground font-medium">Filtered Alumni</div>
                      <div className="text-3xl font-bold text-primary mt-1">{analyticsFilteredAlumni.length}</div>
                    </div>
                    <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/10">
                      <div className="text-sm text-muted-foreground font-medium">Departments</div>
                      <div className="text-3xl font-bold text-secondary mt-1">{departmentDistribution.length}</div>
                    </div>
                    <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                      <div className="text-sm text-muted-foreground font-medium">Locations</div>
                      <div className="text-3xl font-bold text-accent mt-1">{locationDistribution.length}</div>
                    </div>
                    <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/10">
                      <div className="text-sm text-muted-foreground font-medium">Employed</div>
                      <div className="text-3xl font-bold text-green-600 mt-1">
                        {employmentDistribution.find(e => e.name === 'Employed')?.value || 0}
                      </div>
                    </div>
                  </div>

                  {/* Key Insights Section - At the top */}
                  <Card className="mb-6 border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <div className="text-sm text-muted-foreground">Top Department</div>
                          <div className="text-lg font-semibold text-primary mt-1">
                            {departmentDistribution.length > 0
                              ? departmentDistribution.reduce((a, b) => a.value > b.value ? a : b).name
                              : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {departmentDistribution.length > 0
                              ? `${departmentDistribution.reduce((a, b) => a.value > b.value ? a : b).value} alumni`
                              : ''}
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <div className="text-sm text-muted-foreground">Most Active Location</div>
                          <div className="text-lg font-semibold text-primary mt-1">
                            {locationDistribution.length > 0 ? locationDistribution[0].name : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {locationDistribution.length > 0 ? `${locationDistribution[0].value} alumni` : ''}
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <div className="text-sm text-muted-foreground">Peak Graduation Year</div>
                          <div className="text-lg font-semibold text-primary mt-1">
                            {gradYearTrends.length > 0
                              ? gradYearTrends.reduce((a, b) => a.value > b.value ? a : b).name
                              : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {gradYearTrends.length > 0
                              ? `${gradYearTrends.reduce((a, b) => a.value > b.value ? a : b).value} graduates`
                              : ''}
                          </div>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <div className="text-sm text-muted-foreground">Network Reach</div>
                          <div className="text-lg font-semibold text-primary mt-1">
                            {countryDistribution.length} Countries
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Global alumni presence
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charts Grid - 2x2 Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Distribution - Donut Chart */}
                    <Card className="border-2 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <PieChartIcon className="h-4 w-4 text-primary" />
                          Department Distribution
                        </CardTitle>
                        <CardDescription>
                          Alumni across {departmentDistribution.length} departments
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={departmentDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={85}
                              fill="#8884d8"
                              paddingAngle={3}
                              dataKey="value"
                              label={({ name, percent }: { name?: string; percent?: number }) =>
                                `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                              }
                              labelLine={{ stroke: '#888', strokeWidth: 1 }}
                            >
                              {departmentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [`${value} alumni`, 'Count']}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Graduation Year Trends - Area Chart */}
                    <Card className="border-2 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          Graduation Year Distribution
                        </CardTitle>
                        <CardDescription>
                          Alumni from {gradYearTrends.length > 0 ? gradYearTrends[0]?.name : 'N/A'} - {gradYearTrends.length > 0 ? gradYearTrends[gradYearTrends.length - 1]?.name : 'N/A'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={gradYearTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="gradYearGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#003DA5" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#003DA5" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(value: number) => [`${value} graduates`, 'Count']}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#003DA5"
                              strokeWidth={2}
                              fill="url(#gradYearGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Employment Status - Pie Chart */}
                    <Card className="border-2 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-green-600" />
                          Employment Status
                        </CardTitle>
                        <CardDescription>
                          {((employmentDistribution.find(e => e.name === 'Employed')?.value || 0) / analyticsFilteredAlumni.length * 100).toFixed(1)}% employment rate
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={employmentDistribution}
                              cx="50%"
                              cy="50%"
                              outerRadius={85}
                              dataKey="value"
                              label={({ name, value, percent }: { name?: string; value?: number; percent?: number }) =>
                                `${name}: ${value} (${(percent ? percent * 100 : 0).toFixed(0)}%)`
                              }
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#f97316" />
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [`${value} alumni`, 'Count']}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Verification Status - Pie Chart */}
                    <Card className="border-2 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          Verification Status
                        </CardTitle>
                        <CardDescription>
                          {verificationStatusDistribution.length} verification categories
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={verificationStatusDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={85}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }: { name?: string; percent?: number }) =>
                                `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                              }
                            >
                              {verificationStatusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={
                                  entry.name === 'Verified' ? '#22c55e' :
                                    entry.name === 'Pending' ? '#f59e0b' :
                                      COLORS[index % COLORS.length]
                                } />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [`${value} alumni`, 'Count']}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Full Width Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Top Alumni Locations - Horizontal Bar */}
                    <Card className="border-2 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          Top Alumni Locations
                        </CardTitle>
                        <CardDescription>
                          Geographic distribution across {locationDistribution.length} locations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={locationDistribution} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(value: number) => [`${value} alumni`, 'Count']}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                            <Bar dataKey="value" fill="#003DA5" radius={[0, 4, 4, 0]}>
                              {locationDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Country Distribution - Horizontal Bar */}
                    <Card className="border-2 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          Country Distribution
                        </CardTitle>
                        <CardDescription>
                          Alumni spread across {countryDistribution.length} countries
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={countryDistribution} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip
                              formatter={(value: number) => [`${value} alumni`, 'Count']}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                              {countryDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'][index % 5]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs >
        </div >
      </MainLayout >
    </ProtectedRoute >
  );
}
