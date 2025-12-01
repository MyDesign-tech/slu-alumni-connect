"use client";

import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, Filter, Plus, Edit, Trash2, Settings, BarChart3, Shield, RefreshCw, Star, Search, TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  capacity: number;
  registered: number;
  isVirtual: boolean;
  department: string;
  status?: string;
  createdDate?: string;
}

export default function EventsPage() {
  const { user, isHydrated } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [adminTab, setAdminTab] = useState("manage-events");
  const [userTab, setUserTab] = useState("browse"); // New user tab state
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventStats, setEventStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [rsvpData, setRsvpData] = useState({
    guestCount: 0,
    specialRequirements: ""
  });
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEventSettingsOpen, setIsEventSettingsOpen] = useState(false);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  const [createEventErrors, setCreateEventErrors] = useState<Record<string, string>>({});
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Event Settings State
  const [defaultCapacity, setDefaultCapacity] = useState(100);
  const [registrationDeadline, setRegistrationDeadline] = useState(3);
  const [autoApprove, setAutoApprove] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedCapacity = localStorage.getItem("eventDefaultCapacity");
    const savedDeadline = localStorage.getItem("eventRegistrationDeadline");
    const savedAutoApprove = localStorage.getItem("eventAutoApprove");
    if (savedCapacity) setDefaultCapacity(parseInt(savedCapacity));
    if (savedDeadline) setRegistrationDeadline(parseInt(savedDeadline));
    if (savedAutoApprove) setAutoApprove(savedAutoApprove === "true");
  }, []);

  // Save settings handler
  const handleSaveSettings = () => {
    localStorage.setItem("eventDefaultCapacity", defaultCapacity.toString());
    localStorage.setItem("eventRegistrationDeadline", registrationDeadline.toString());
    localStorage.setItem("eventAutoApprove", autoApprove.toString());
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Advanced Analytics Filters
  const [analyticsDateStart, setAnalyticsDateStart] = useState("");
  const [analyticsDateEnd, setAnalyticsDateEnd] = useState("");
  const [analyticsEventType, setAnalyticsEventType] = useState("");
  const [analyticsVirtualFilter, setAnalyticsVirtualFilter] = useState("");
  const [analyticsCapacityMin, setAnalyticsCapacityMin] = useState("");
  const [analyticsDepartment, setAnalyticsDepartment] = useState("");

  // Filtered events for analytics based on advanced filters
  const analyticsFilteredEvents = useMemo(() => {
    return events.filter(event => {
      // Date range filter
      if (analyticsDateStart) {
        const eventDate = new Date(event.date);
        const startDate = new Date(analyticsDateStart);
        if (eventDate < startDate) return false;
      }
      if (analyticsDateEnd) {
        const eventDate = new Date(event.date);
        const endDate = new Date(analyticsDateEnd);
        if (eventDate > endDate) return false;
      }

      // Event type filter
      if (analyticsEventType && event.type !== analyticsEventType) return false;

      // Virtual filter
      if (analyticsVirtualFilter === 'virtual' && !event.isVirtual) return false;
      if (analyticsVirtualFilter === 'in-person' && event.isVirtual) return false;

      // Capacity filter
      if (analyticsCapacityMin && event.capacity < parseInt(analyticsCapacityMin)) return false;

      // Department filter
      if (analyticsDepartment && event.department !== analyticsDepartment) return false;

      return true;
    });
  }, [events, analyticsDateStart, analyticsDateEnd, analyticsEventType, analyticsVirtualFilter, analyticsCapacityMin, analyticsDepartment]);

  // Get unique values for filter dropdowns
  const uniqueEventTypes = useMemo(() => {
    return [...new Set(events.map(e => e.type).filter(Boolean))].sort();
  }, [events]);

  const uniqueDepartments = useMemo(() => {
    return [...new Set(events.map(e => e.department).filter(Boolean))].sort();
  }, [events]);

  // Clear all analytics filters
  const clearEventsAnalyticsFilters = () => {
    setAnalyticsDateStart("");
    setAnalyticsDateEnd("");
    setAnalyticsEventType("");
    setAnalyticsVirtualFilter("");
    setAnalyticsCapacityMin("");
    setAnalyticsDepartment("");
  };

  // Analytics Data Preparation - Now uses analyticsFilteredEvents
  const eventsByType = useMemo(() => {
    const types: Record<string, number> = {};
    analyticsFilteredEvents.forEach(event => {
      types[event.type] = (types[event.type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredEvents]);

  const registrationsByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    analyticsFilteredEvents.forEach(event => {
      if (!event.date) return;
      const date = new Date(event.date);
      const month = date.toLocaleString('default', { month: 'short' });
      months[month] = (months[month] || 0) + (event.registered || 0);
    });
    // Sort months chronologically if needed, but for now simple map
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredEvents]);

  const virtualVsInPerson = useMemo(() => {
    let virtual = 0;
    let inPerson = 0;
    analyticsFilteredEvents.forEach(event => {
      if (event.isVirtual) virtual++;
      else inPerson++;
    });
    return [
      { name: 'Virtual', value: virtual },
      { name: 'In-Person', value: inPerson },
    ];
  }, [analyticsFilteredEvents]);

  // Additional analytics data
  const capacityUtilization = useMemo(() => {
    if (analyticsFilteredEvents.length === 0) return 0;
    const totalRegistered = analyticsFilteredEvents.reduce((sum, e) => sum + (e.registered || 0), 0);
    const totalCapacity = analyticsFilteredEvents.reduce((sum, e) => sum + (e.capacity || 0), 0);
    return totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;
  }, [analyticsFilteredEvents]);

  const departmentDistribution = useMemo(() => {
    const depts: Record<string, number> = {};
    analyticsFilteredEvents.forEach(event => {
      const dept = event.department || 'General';
      depts[dept] = (depts[dept] || 0) + 1;
    });
    return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredEvents]);

  // Advanced User Analytics - New Calculations
  const registrationTrendsByWeek = useMemo(() => {
    const weeks: Record<string, { registered: number; events: number; capacity: number }> = {};
    analyticsFilteredEvents.forEach(event => {
      if (!event.date) return;
      const date = new Date(event.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = `${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
      if (!weeks[weekKey]) weeks[weekKey] = { registered: 0, events: 0, capacity: 0 };
      weeks[weekKey].registered += event.registered || 0;
      weeks[weekKey].events += 1;
      weeks[weekKey].capacity += event.capacity || 0;
    });
    return Object.entries(weeks).map(([week, data]) => ({
      week,
      registered: data.registered,
      events: data.events,
      fillRate: data.capacity > 0 ? Math.round((data.registered / data.capacity) * 100) : 0
    }));
  }, [analyticsFilteredEvents]);

  const eventPopularityScore = useMemo(() => {
    return analyticsFilteredEvents.map(event => ({
      name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
      fullName: event.title,
      score: Math.round((event.registered / (event.capacity || 1)) * 100),
      registered: event.registered,
      capacity: event.capacity,
      type: event.type
    })).sort((a, b) => b.score - a.score).slice(0, 10);
  }, [analyticsFilteredEvents]);

  const eventsByDayOfWeek = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts: Record<string, { events: number; registrations: number }> = {};
    days.forEach(d => dayCounts[d] = { events: 0, registrations: 0 });

    analyticsFilteredEvents.forEach(event => {
      if (!event.date) return;
      const date = new Date(event.date);
      const dayName = days[date.getDay()];
      dayCounts[dayName].events += 1;
      dayCounts[dayName].registrations += event.registered || 0;
    });

    return days.map(day => ({
      day: day.substring(0, 3),
      fullDay: day,
      events: dayCounts[day].events,
      registrations: dayCounts[day].registrations,
      avgPerEvent: dayCounts[day].events > 0 ? Math.round(dayCounts[day].registrations / dayCounts[day].events) : 0
    }));
  }, [analyticsFilteredEvents]);

  const eventsByTimeSlot = useMemo(() => {
    const slots: Record<string, number> = {
      'Morning (6AM-12PM)': 0,
      'Afternoon (12PM-5PM)': 0,
      'Evening (5PM-9PM)': 0,
      'Night (9PM+)': 0
    };

    analyticsFilteredEvents.forEach(event => {
      if (!event.time) return;
      const hour = parseInt(event.time.split(':')[0]);
      if (hour >= 6 && hour < 12) slots['Morning (6AM-12PM)']++;
      else if (hour >= 12 && hour < 17) slots['Afternoon (12PM-5PM)']++;
      else if (hour >= 17 && hour < 21) slots['Evening (5PM-9PM)']++;
      else slots['Night (9PM+)']++;
    });

    return Object.entries(slots).map(([name, value]) => ({ name, value }));
  }, [analyticsFilteredEvents]);

  const registrationVsCapacityTrend = useMemo(() => {
    return [...analyticsFilteredEvents]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15)
      .map(event => ({
        name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
        registered: event.registered,
        capacity: event.capacity,
        utilization: Math.round((event.registered / (event.capacity || 1)) * 100)
      }));
  }, [analyticsFilteredEvents]);

  const locationAnalytics = useMemo(() => {
    const locations: Record<string, { count: number; registrations: number }> = {};
    analyticsFilteredEvents.forEach(event => {
      const loc = event.location || 'Unknown';
      if (!locations[loc]) locations[loc] = { count: 0, registrations: 0 };
      locations[loc].count += 1;
      locations[loc].registrations += event.registered || 0;
    });
    return Object.entries(locations)
      .map(([location, data]) => ({
        location: location.length > 25 ? location.substring(0, 25) + '...' : location,
        fullLocation: location,
        events: data.count,
        registrations: data.registrations
      }))
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 8);
  }, [analyticsFilteredEvents]);

  const upcomingVsPastEvents = useMemo(() => {
    const now = new Date();
    let upcoming = 0, past = 0, upcomingReg = 0, pastReg = 0;
    analyticsFilteredEvents.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate > now) {
        upcoming++;
        upcomingReg += event.registered || 0;
      } else {
        past++;
        pastReg += event.registered || 0;
      }
    });
    return [
      { name: 'Upcoming', value: upcoming, registrations: upcomingReg },
      { name: 'Past', value: past, registrations: pastReg }
    ];
  }, [analyticsFilteredEvents]);

  const avgRegistrationsPerType = useMemo(() => {
    const typeData: Record<string, { total: number; count: number }> = {};
    analyticsFilteredEvents.forEach(event => {
      const type = event.type || 'Other';
      if (!typeData[type]) typeData[type] = { total: 0, count: 0 };
      typeData[type].total += event.registered || 0;
      typeData[type].count += 1;
    });
    return Object.entries(typeData)
      .map(([type, data]) => ({
        type,
        avgRegistrations: Math.round(data.total / data.count),
        totalEvents: data.count
      }))
      .sort((a, b) => b.avgRegistrations - a.avgRegistrations);
  }, [analyticsFilteredEvents]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const [createEventData, setCreateEventData] = useState({
    title: "",
    type: "Networking",
    date: "",
    time: "",
    location: "",
    capacity: 100,
    description: "",
    department: "General",
    isVirtual: false,
  });

  const eventsForAnalytics = useMemo(
    () => events.filter((event) => event.capacity > 0 && event.registered >= 0),
    [events]
  );

  const attendanceTrendData = useMemo(() => {
    if (!eventsForAnalytics.length) return [] as { label: string; registered: number; capacity: number }[];

    const withDate = eventsForAnalytics
      .map((e) => {
        const d = new Date(e.date);
        const ts = Number.isNaN(d.getTime()) ? 0 : d.getTime();
        const label = Number.isNaN(d.getTime())
          ? e.title
          : `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
        return { label, registered: e.registered, capacity: e.capacity, ts };
      })
      .sort((a, b) => a.ts - b.ts);

    return withDate.map(({ ts, ...rest }) => rest);
  }, [eventsForAnalytics]);

  const typeDistributionData = useMemo(() => {
    if (!eventsForAnalytics.length) return [] as { type: string; count: number }[];
    const byType: Record<string, number> = {};
    for (const e of eventsForAnalytics) {
      const key = e.type || "Other";
      byType[key] = (byType[key] || 0) + 1;
    }
    return Object.entries(byType).map(([type, count]) => ({ type, count }));
  }, [eventsForAnalytics]);

  const statusColors = ["#2563eb", "#16a34a", "#f97316", "#ef4444", "#8b5cf6", "#0d9488"];

  const rsvpStatusChart = useMemo(() => {
    if (!eventStats?.events || !eventStats.events.length) {
      return { data: [] as any[], keys: [] as string[] };
    }

    const keysSet = new Set<string>();

    const sorted = [...eventStats.events]
      .sort((a: any, b: any) => (b.totalRsvps || 0) - (a.totalRsvps || 0))
      .slice(0, 8);

    const data = sorted.map((ev: any) => {
      const row: any = {
        title: ev.title || ev.id,
      };

      Object.entries(ev.statusCounts || {}).forEach(([status, count]) => {
        keysSet.add(status);
        row[status] = count as number;
      });

      return row;
    });

    return {
      data,
      keys: Array.from(keysSet),
    };
  }, [eventStats]);

  const [attendeesDialogEvent, setAttendeesDialogEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [userRsvpEventIds, setUserRsvpEventIds] = useState<string[]>([]);
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [editEventData, setEditEventData] = useState({
    title: "",
    type: "",
    date: "",
    time: "",
    location: "",
    capacity: 0,
    description: "",
    department: "",
    isVirtual: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [capacityMin, setCapacityMin] = useState("");
  const [capacityMax, setCapacityMax] = useState("");
  const [registrationMin, setRegistrationMin] = useState("");
  const [virtualFilter, setVirtualFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const isEventInPast = (event: Event) => {
    if (!event.date) return false;
    try {
      const timePart = event.time && event.time.length > 0 ? event.time : "00:00";
      const eventDateTime = new Date(`${event.date}T${timePart}`);
      if (Number.isNaN(eventDateTime.getTime())) {
        const fallback = new Date(event.date);
        return fallback.getTime() < Date.now();
      }
      return eventDateTime.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const isEventClosed = (event: Event) => {
    const status = (event.status || "").toLowerCase();
    if (status === "cancelled" || status === "completed") return true;
    return isEventInPast(event);
  };

  // Get unique values for advanced filters
  const uniqueLocations = useMemo(() => {
    return [...new Set(events.map(e => e.location).filter(Boolean))].sort();
  }, [events]);

  const uniqueDepartmentsForFilter = useMemo(() => {
    return [...new Set(events.map(e => e.department).filter(Boolean))].sort();
  }, [events]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedType) count++;
    if (selectedStatus) count++;
    if (showMyEventsOnly) count++;
    if (locationFilter) count++;
    if (departmentFilter) count++;
    if (capacityMin) count++;
    if (capacityMax) count++;
    if (registrationMin) count++;
    if (virtualFilter) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [searchTerm, selectedType, selectedStatus, showMyEventsOnly, locationFilter, departmentFilter, capacityMin, capacityMax, registrationMin, virtualFilter, dateFrom, dateTo]);

  // Map an event into a high-level status bucket used for filtering.
  // "upcoming", "ongoing", "completed", "cancelled"
  const getEventStatusBucket = (event: Event): string => {
    const status = (event.status || "").toLowerCase();
    const inPast = isEventInPast(event);

    if (status === "cancelled") return "cancelled";
    if (status === "completed") return "completed";
    if (status === "ongoing") return inPast ? "completed" : "ongoing";

    // Planned or unknown: treat as upcoming if not already past
    if (inPast) return "completed";
    return "upcoming";
  };

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  // Listen for real-time data updates (e.g., new RSVPs, event changes)
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('?? Data update detected, refreshing events...');
      setTimeout(() => {
        fetchEvents();
        if (isAdmin) fetchEventStats();
      }, 500);
    };

    window.addEventListener('eventsUpdated', handleDataUpdate);
    window.addEventListener('profileUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('eventsUpdated', handleDataUpdate);
      window.removeEventListener('profileUpdated', handleDataUpdate);
    };
  }, [isAdmin]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('? Real CSV events loaded:', data.events?.length || 0, 'events');
        const loadedEvents: Event[] = data.events || [];
        setEvents(loadedEvents);

        // Build dynamic list of event types from actual data so filters work
        const types = Array.from(
          new Set(
            loadedEvents
              .map((e) => e.type)
              .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          )
        ).sort();
        setAvailableTypes(types);
      } else {
        console.error('? Failed to fetch events:', response.status, response.statusText);
        setEvents([]); // No fallback - force real data only
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (adminTab === "analytics") {
      fetchEventStats();
    }
  }, [isAdmin, adminTab]);

  const fetchEventStats = async () => {
    if (!isAdmin) return;
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await fetch('/api/events/stats', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEventStats(data);
      } else {
        const errorData = await response.json().catch(() => null);
        setStatsError(errorData?.error || 'Failed to load event analytics.');
      }
    } catch (error) {
      console.error('Events stats error:', error);
      setStatsError('Error loading event analytics.');
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    // Basic filters
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || event.type === selectedType;
    const bucket = getEventStatusBucket(event);
    const matchesStatus = !selectedStatus || bucket === selectedStatus;
    const matchesMine = !showMyEventsOnly || userRsvpEventIds.includes(event.id);

    // Advanced filters
    const matchesLocation = !locationFilter ||
      event.location?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesDepartment = !departmentFilter || event.department === departmentFilter;

    const matchesCapacityMin = !capacityMin || event.capacity >= parseInt(capacityMin);
    const matchesCapacityMax = !capacityMax || event.capacity <= parseInt(capacityMax);

    const matchesRegistrationMin = !registrationMin || event.registered >= parseInt(registrationMin);

    const matchesVirtual = !virtualFilter ||
      (virtualFilter === 'virtual' && event.isVirtual) ||
      (virtualFilter === 'in-person' && !event.isVirtual);

    const matchesDateFrom = !dateFrom || new Date(event.date) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(event.date) <= new Date(dateTo);

    return matchesSearch && matchesType && matchesStatus && matchesMine &&
      matchesLocation && matchesDepartment && matchesCapacityMin && matchesCapacityMax &&
      matchesRegistrationMin && matchesVirtual && matchesDateFrom && matchesDateTo;
  })

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus, showMyEventsOnly, locationFilter, departmentFilter, capacityMin, capacityMax, registrationMin, virtualFilter, dateFrom, dateTo]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedStatus("");
    setShowMyEventsOnly(false);
    setLocationFilter("");
    setDepartmentFilter("");
    setCapacityMin("");
    setCapacityMax("");
    setRegistrationMin("");
    setVirtualFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const submitRSVP = async () => {
    if (!selectedEvent) return;
    const eventId = selectedEvent.id;

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'user@slu.edu'
        },
        body: JSON.stringify(rsvpData)
      });

      if (response.ok) {
        alert("RSVP submitted successfully!");
        setSelectedEvent(null);
        setRsvpData({ guestCount: 0, specialRequirements: "" });
        setUserRsvpEventIds(prev => (
          prev.includes(eventId) ? prev : [...prev, eventId]
        ));
        fetchEvents(); // Refresh events to update registration count
      } else {
        alert("Failed to submit RSVP. Please try again.");
      }
    } catch (error) {
      console.error('RSVP error:', error);
      alert("Error submitting RSVP. Please try again.");
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditEventData({
      title: event.title || "",
      type: event.type || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || "",
      capacity: event.capacity || 0,
      description: event.description || "",
      department: event.department || "",
      isVirtual: event.isVirtual || false,
    });
  };

  // Open delete confirmation dialog
  const handleDeleteEvent = (event: Event) => {
    console.log('Delete button clicked for:', event.id, event.title);
    setDeleteConfirmEvent(event);
  };

  // Actually perform the delete
  const confirmDeleteEvent = async () => {
    if (!deleteConfirmEvent) return;

    const event = deleteConfirmEvent;
    console.log('Confirming delete for:', event.id, event.title);
    setDeletingEventId(event.id);
    setDeleteConfirmEvent(null);

    try {
      console.log('Making DELETE request to:', `/api/events/${event.id}`);
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      console.log('Delete response status:', response.status);
      const data = await response.json().catch(() => ({}));
      console.log('Delete response:', data);

      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== event.id));
        window.dispatchEvent(new Event('eventsUpdated'));
      } else {
        console.error('Delete failed:', data);
        alert(data?.error || 'Failed to delete event. Please try again.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting event. Please try again.');
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleViewAttendees = async (event: Event) => {
    setAttendeesDialogEvent(event);
    setAttendees([]);
    setAttendeesError(null);
    setAttendeesLoading(true);

    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setAttendeesError(errorData?.error || 'Failed to load RSVP details.');
        return;
      }

      const data = await response.json();
      setAttendees(data.rsvps || []);
    } catch (error) {
      console.error('Load attendees error:', error);
      setAttendeesError('Error loading RSVP details.');
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setIsCreateEventOpen(true);
  };

  const handleEventSettings = () => {
    setIsEventSettingsOpen(true);
  };

  const handleSubmitCreateEvent = async () => {
    const errors: Record<string, string> = {};
    if (!createEventData.title.trim()) errors.title = "Title is required";
    if (!createEventData.type) errors.type = "Event type is required";
    if (!createEventData.date) errors.date = "Date is required";
    if (!createEventData.location.trim() && !createEventData.isVirtual) errors.location = "Location is required";
    if (createEventData.isVirtual && !createEventData.virtualLink?.trim()) errors.virtualLink = "Virtual link is required";

    if (Object.keys(errors).length > 0) { setCreateEventErrors(errors); return; }

    setCreateEventErrors({});
    setIsCreatingEvent(true);

    try {
      const eventPayload = {
        ...createEventData,
        location: createEventData.isVirtual ? (createEventData.virtualLink || "Virtual") : createEventData.location,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': user?.email || 'admin@slu.edu' },
        body: JSON.stringify(eventPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setCreateEventErrors({ submit: errorData?.error || 'Failed to create event.' });
        return;
      }

      await response.json();
      alert('Event created successfully!');
      setIsCreateEventOpen(false);
      setCreateEventData({ title: "", type: "Networking", date: "", time: "", endTime: "", location: "", capacity: 100, description: "", department: "General", isVirtual: false, virtualLink: "" });
      setCreateEventErrors({});
      fetchEvents();
    } catch (error) {
      console.error('Create event error:', error);
      setCreateEventErrors({ submit: 'Error creating event. Please try again.' });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-4">
                {isAdmin ? "Event Management" : "Alumni Events"}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {isAdmin
                  ? "Manage events, track attendance, and create new opportunities for alumni engagement."
                  : "Discover upcoming events, reunions, and networking opportunities with fellow SLU alumni."
                }
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
                <Button variant="outline" onClick={handleEventSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            )}
          </div>

          {isAdmin ? (
            <Tabs value={adminTab} onValueChange={setAdminTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manage-events">Manage Events</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="manage-events" className="space-y-6">
                {/* Admin Event Management */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1">
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">All Types</option>
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">All Statuses</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Button
                      variant={showAdvancedFilters ? "default" : "outline"}
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={showAdvancedFilters ? "bg-primary text-primary-foreground" : ""}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Advanced Filters
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setLocationFilter("");
                            setDepartmentFilter("");
                            setCapacityMin("");
                            setCapacityMax("");
                            setRegistrationMin("");
                            setVirtualFilter("");
                            setDateFrom("");
                            setDateTo("");
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          Clear All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Location Filter */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Location</label>
                          <Input
                            placeholder="Filter by location..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="h-9"
                          />
                        </div>

                        {/* Department Filter */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Department</label>
                          <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="w-full h-9 px-3 border border-input rounded-md bg-background text-sm"
                          >
                            <option value="">All Departments</option>
                            {uniqueDepartments.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        {/* Virtual/In-Person Filter */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Event Format</label>
                          <select
                            value={virtualFilter}
                            onChange={(e) => setVirtualFilter(e.target.value)}
                            className="w-full h-9 px-3 border border-input rounded-md bg-background text-sm"
                          >
                            <option value="">All Formats</option>
                            <option value="virtual">Virtual Only</option>
                            <option value="in-person">In-Person Only</option>
                          </select>
                        </div>

                        {/* Capacity Range */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Capacity Range</label>
                          <div className="flex gap-2 flex-wrap">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={capacityMin}
                              onChange={(e) => setCapacityMin(e.target.value)}
                              className="h-9 w-1/2"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={capacityMax}
                              onChange={(e) => setCapacityMax(e.target.value)}
                              className="h-9 w-1/2"
                            />
                          </div>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Date From</label>
                          <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Date To</label>
                          <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-9"
                          />
                        </div>

                        {/* Min Registration */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">Min Registrations</label>
                          <Input
                            type="number"
                            placeholder="Minimum registrations..."
                            value={registrationMin}
                            onChange={(e) => setRegistrationMin(e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedEvents.map((event) => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const isUpcoming = eventDate >= now;
                    const isPast = eventDate < now;
                    const isToday = eventDate.toDateString() === now.toDateString();
                    const capacityPercent = event.capacity > 0 ? Math.round((event.registered / event.capacity) * 100) : 0;
                    const isNearlyFull = capacityPercent >= 80;
                    const isFull = capacityPercent >= 100;
                    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isDeleting = deletingEventId === event.id;
                    return (
                      <Card key={event.id} className={`hover:shadow-xl transition-all duration-300 border-l-4 ${isFull ? 'border-l-red-500' : isToday ? 'border-l-yellow-500' : isUpcoming ? 'border-l-green-500' : 'border-l-gray-400'} relative overflow-hidden ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant={event.isVirtual ? "secondary" : "outline"}>
                                {event.isVirtual ? "Virtual" : "In-Person"}
                              </Badge>
                              <Badge variant="outline">{event.type}</Badge>
                              <Badge variant={event.allowGuests ? "default" : "destructive"} className={event.allowGuests ? "bg-purple-500 hover:bg-purple-600" : ""}>
                                {event.allowGuests ? "Guests OK" : "No Guests"}
                              </Badge>
                            </div>
                            <Badge className={`${isToday ? 'bg-yellow-500' : isFull ? 'bg-red-500' : isUpcoming ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
                              {isToday ? "Today" : isFull ? "Full" : isUpcoming ? (daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`) : "Past"}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="mx-1">|</span>
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span>{event.location}</span>
                            </div>
                            {/* Capacity Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className={`font-medium ${isFull ? 'text-red-600' : isNearlyFull ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                  <Users className="h-3 w-3 inline mr-1" />
                                  {event.registered}/{event.capacity} {isFull ? '(Full)' : isNearlyFull ? '(Nearly Full)' : 'registered'}
                                </span>
                                <span className="text-muted-foreground font-medium">{capacityPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : isNearlyFull ? 'bg-orange-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t">
                            <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)} className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"><Edit className="h-4 w-4 mr-1" />Edit</Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewAttendees(event)} className="flex-1 hover:bg-green-50 hover:border-green-300 hover:text-green-700"><Users className="h-4 w-4 mr-1" />Attendees ({event.registered})</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event)} disabled={isDeleting} className="hover:bg-red-600">
                              {isDeleting ? (<div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />) : (<Trash2 className="h-4 w-4 mr-1" />)}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No events found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or filters to find more events.
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
                    <div className="ml-4 text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({filteredEvents.length} events)
                    </div>
                  </div>
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
                      <Button variant="outline" size="sm" onClick={clearEventsAnalyticsFilters}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Filters
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Filter the analytics data to focus on specific events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {/* Date Range */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date From</label>
                        <Input
                          type="date"
                          value={analyticsDateStart}
                          onChange={e => setAnalyticsDateStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date To</label>
                        <Input
                          type="date"
                          value={analyticsDateEnd}
                          onChange={e => setAnalyticsDateEnd(e.target.value)}
                        />
                      </div>

                      {/* Event Type Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Event Type</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={analyticsEventType}
                          onChange={e => setAnalyticsEventType(e.target.value)}
                        >
                          <option value="">All Types</option>
                          {uniqueEventTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Virtual Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Format</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={analyticsVirtualFilter}
                          onChange={e => setAnalyticsVirtualFilter(e.target.value)}
                        >
                          <option value="">All Formats</option>
                          <option value="virtual">Virtual</option>
                          <option value="in-person">In-Person</option>
                        </select>
                      </div>

                      {/* Capacity Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Min Capacity</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={analyticsCapacityMin}
                          onChange={e => setAnalyticsCapacityMin(e.target.value)}
                        >
                          <option value="">Any</option>
                          <option value="50">50+</option>
                          <option value="100">100+</option>
                          <option value="200">200+</option>
                          <option value="500">500+</option>
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
                    </div>

                    {/* Active Filters Summary */}
                    {(analyticsDateStart || analyticsDateEnd || analyticsEventType || analyticsVirtualFilter || analyticsCapacityMin || analyticsDepartment) && (
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {analyticsDateStart && (
                          <Badge variant="secondary" className="gap-1">
                            From {analyticsDateStart}
                            <button onClick={() => setAnalyticsDateStart("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsDateEnd && (
                          <Badge variant="secondary" className="gap-1">
                            To {analyticsDateEnd}
                            <button onClick={() => setAnalyticsDateEnd("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsEventType && (
                          <Badge variant="secondary" className="gap-1">
                            {analyticsEventType}
                            <button onClick={() => setAnalyticsEventType("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsVirtualFilter && (
                          <Badge variant="secondary" className="gap-1">
                            {analyticsVirtualFilter === 'virtual' ? 'Virtual' : 'In-Person'}
                            <button onClick={() => setAnalyticsVirtualFilter("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsCapacityMin && (
                          <Badge variant="secondary" className="gap-1">
                            Capacity {analyticsCapacityMin}+
                            <button onClick={() => setAnalyticsCapacityMin("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsDepartment && (
                          <Badge variant="secondary" className="gap-1">
                            {analyticsDepartment}
                            <button onClick={() => setAnalyticsDepartment("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Event Analytics Dashboard
                        <Badge variant="outline" className="ml-2">
                          {analyticsFilteredEvents.length} of {events.length} Events
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchEvents();
                          fetchEventStats();
                        }}
                        disabled={loading || statsLoading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-sm text-muted-foreground font-medium">Filtered Events</div>
                        <div className="text-3xl font-bold text-primary mt-1">{analyticsFilteredEvents.length}</div>
                      </div>
                      <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/10">
                        <div className="text-sm text-muted-foreground font-medium">Total Registrations</div>
                        <div className="text-3xl font-bold text-secondary mt-1">
                          {analyticsFilteredEvents.reduce((sum, event) => sum + event.registered, 0)}
                        </div>
                      </div>
                      <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                        <div className="text-sm text-muted-foreground font-medium">Avg. Attendance</div>
                        <div className="text-3xl font-bold text-accent mt-1">
                          {analyticsFilteredEvents.length > 0
                            ? Math.round(analyticsFilteredEvents.reduce((sum, event) => sum + event.registered, 0) / analyticsFilteredEvents.length)
                            : 0}
                        </div>
                      </div>
                      <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/10">
                        <div className="text-sm text-muted-foreground font-medium">Capacity Utilization</div>
                        <div className="text-3xl font-bold text-green-600 mt-1">{capacityUtilization}%</div>
                      </div>
                      <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/10">
                        <div className="text-sm text-muted-foreground font-medium">Virtual Events</div>
                        <div className="text-3xl font-bold text-purple-600 mt-1">
                          {analyticsFilteredEvents.filter(event => event.isVirtual).length}
                        </div>
                      </div>
                    </div>

                    {/* Executive Analytics Dashboard */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">Executive Analytics Dashboard</h3>
                            <p className="text-sm text-gray-500">Real-time performance metrics</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs font-medium text-green-700">Live</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg text-white">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-emerald-100 text-sm font-medium">SUCCESS RATE</span>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-xs font-bold">{analyticsFilteredEvents.length > 0 ? `${Math.round((analyticsFilteredEvents.filter(e => e.registered >= e.capacity * 0.5).length / analyticsFilteredEvents.length) * 100) > 50 ? "+" : ""}${Math.round((analyticsFilteredEvents.filter(e => e.registered >= e.capacity * 0.5).length / analyticsFilteredEvents.length) * 100) - 50}%` : "0%"}</span>
                              </div>
                            </div>
                            <div className="text-3xl font-bold mb-1">{analyticsFilteredEvents.length > 0 ? Math.round((analyticsFilteredEvents.filter(e => e.registered >= e.capacity * 0.5).length / analyticsFilteredEvents.length) * 100) : 0}%</div>
                            <div className="text-emerald-100 text-sm">Events meeting targets</div>
                          </div>
                        </div>
                        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg text-white">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-blue-100 text-sm font-medium">ATTENDANCE</span>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                                <Users className="h-3 w-3" />
                                <span className="text-xs font-bold">{analyticsFilteredEvents.filter(e => new Date(e.date) >= new Date()).length} upcoming</span>
                              </div>
                            </div>
                            <div className="text-3xl font-bold mb-1">{analyticsFilteredEvents.reduce((sum, e) => sum + e.registered, 0).toLocaleString()}</div>
                            <div className="text-blue-100 text-sm">Total registrations</div>
                          </div>
                        </div>
                        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg text-white">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-violet-100 text-sm font-medium">ENGAGEMENT</span>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                                <Star className="h-3 w-3" />
                                <span className="text-xs font-bold">{analyticsFilteredEvents.length > 0 ? (Math.round(analyticsFilteredEvents.reduce((sum, e) => sum + (e.registered / e.capacity * 100), 0) / analyticsFilteredEvents.length) >= 80 ? "High" : Math.round(analyticsFilteredEvents.reduce((sum, e) => sum + (e.registered / e.capacity * 100), 0) / analyticsFilteredEvents.length) >= 50 ? "Medium" : "Low") : "N/A"}</span>
                              </div>
                            </div>
                            <div className="text-3xl font-bold mb-1">{analyticsFilteredEvents.length > 0 ? Math.round(analyticsFilteredEvents.reduce((sum, e) => sum + (e.registered / e.capacity * 100), 0) / analyticsFilteredEvents.length) : 0}%</div>
                            <div className="text-violet-100 text-sm">Avg. fill rate</div>
                          </div>
                        </div>
                        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg text-white">
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-amber-100 text-sm font-medium">CAPACITY</span>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs font-bold">{analyticsFilteredEvents.length}</span>
                              </div>
                            </div>
                            <div className="text-3xl font-bold mb-1">{analyticsFilteredEvents.reduce((sum, e) => sum + e.capacity, 0).toLocaleString()}</div>
                            <div className="text-amber-100 text-sm">Total capacity</div>
                          </div>
                        </div>
                      </div>
                      <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-1.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
                              <Star className="h-4 w-4 text-white" />
                            </div>
                            Strategic Command Center
                          </CardTitle>
                          <CardDescription>AI-powered insights and recommendations</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg"><TrendingUp className="h-4 w-4 text-blue-600" /></div>
                                <span className="font-semibold text-gray-800">Performance</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-600 mb-1">{eventsByType.length > 0 ? eventsByType.reduce((a, b) => a.value > b.value ? a : b).name : 'N/A'}</div>
                              <div className="text-sm text-gray-500">Top category with {eventsByType.length > 0 ? eventsByType.reduce((a, b) => a.value > b.value ? a : b).value : 0} events</div>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-emerald-100 rounded-lg"><Users className="h-4 w-4 text-emerald-600" /></div>
                                <span className="font-semibold text-gray-800">Top Event</span>
                              </div>
                              <div className="text-lg font-bold text-emerald-600 mb-1 truncate">{analyticsFilteredEvents.length > 0 ? [...analyticsFilteredEvents].sort((a, b) => b.registered - a.registered)[0]?.title : 'N/A'}</div>
                              <div className="text-sm text-gray-500">{analyticsFilteredEvents.length > 0 ? `${[...analyticsFilteredEvents].sort((a, b) => b.registered - a.registered)[0]?.registered} attendees` : 'No data'}</div>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-purple-100 rounded-lg"><BarChart3 className="h-4 w-4 text-purple-600" /></div>
                                <span className="font-semibold text-gray-800">Format Trend</span>
                              </div>
                              <div className="text-2xl font-bold text-purple-600 mb-1">{virtualVsInPerson[0]?.value > virtualVsInPerson[1]?.value ? 'Virtual' : 'In-Person'}</div>
                              <div className="text-sm text-gray-500">Preferred with {Math.max(virtualVsInPerson[0]?.value || 0, virtualVsInPerson[1]?.value || 0)} events</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Registration Trends - Area Chart */}
                      <Card className="border-2 hover:border-primary/30 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Registration Trends
                          </CardTitle>
                          <CardDescription>
                            Monthly registration patterns
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={registrationsByMonth}>
                              <defs>
                                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip
                                formatter={(value: number) => [`${value} registrations`, 'Count']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              />
                              <Area type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} fillOpacity={1} fill="url(#colorReg)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Event Type Distribution - Horizontal Bar */}
                      <Card className="border-2 hover:border-primary/30 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-green-500" />
                            Event Types Distribution
                          </CardTitle>
                          <CardDescription>
                            {eventsByType.length} event categories
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventsByType} layout="vertical" margin={{ left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                              <XAxis type="number" tick={{ fontSize: 11 }} />
                              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                              <Tooltip
                                formatter={(value: number) => [`${value} events`, 'Count']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              />
                              <Bar dataKey="value" fill="#00C49F" radius={[0, 4, 4, 0]}>
                                {eventsByType.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Virtual vs In-Person - Donut Chart */}
                      <Card className="border-2 hover:border-primary/30 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            Virtual vs In-Person
                          </CardTitle>
                          <CardDescription>
                            Event format distribution
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={virtualVsInPerson}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }: { name?: string; percent?: number }) =>
                                  `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                                }
                              >
                                <Cell fill="#8b5cf6" />
                                <Cell fill="#22c55e" />
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => [`${value} events`, 'Count']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Department Distribution - Pie Chart */}
                      <Card className="border-2 hover:border-primary/30 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-500" />
                            Department Distribution
                          </CardTitle>
                          <CardDescription>
                            Events by department
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={departmentDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }: { name?: string; percent?: number }) =>
                                  `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                                }
                              >
                                {departmentDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => [`${value} events`, 'Count']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Top Performing Events Table */}
                    <Card className="mt-6 border-2 hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          Top Performing Events
                        </CardTitle>
                        <CardDescription>
                          Events with highest registration counts
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-4 bg-muted p-3 font-medium text-sm">
                            <div className="col-span-2">Event Name</div>
                            <div className="text-center">Capacity</div>
                            <div className="text-right">Registrations</div>
                          </div>
                          <div className="divide-y">
                            {[...analyticsFilteredEvents].sort((a, b) => b.registered - a.registered).slice(0, 5).map((event) => (
                              <div key={event.id} className="grid grid-cols-4 p-3 text-sm hover:bg-muted/50 transition-colors">
                                <div className="col-span-2 truncate font-medium">{event.title}</div>
                                <div className="text-center text-muted-foreground">{event.capacity}</div>
                                <div className="text-right">
                                  <span className="font-semibold">{event.registered}</span>
                                  <span className="text-muted-foreground text-xs ml-1">
                                    ({Math.round((event.registered / event.capacity) * 100)}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Event Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Default Event Capacity</label>
                        <Input type="number" value={defaultCapacity} onChange={(e) => setDefaultCapacity(parseInt(e.target.value) || 0)} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Registration Deadline (days before event)</label>
                        <Input type="number" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(parseInt(e.target.value) || 0)} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Auto-approve Registrations</label>
                        <select className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background" value={autoApprove ? "true" : "false"} onChange={(e) => setAutoApprove(e.target.value === "true")}>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <Button className={`w-full ${settingsSaved ? "bg-green-600 hover:bg-green-700" : ""}`} onClick={handleSaveSettings}>{settingsSaved ? " Settings Saved!" : "Save Settings"}</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs value={userTab} onValueChange={setUserTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Browse Events
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Event Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-6">
                {/* Search and Filters */}
                <Card className="mb-8 border-2 border-primary/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search & Filter Events
                        {activeFilterCount > 0 && (
                          <Badge variant="default" className="ml-2">
                            {activeFilterCount} active
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap">
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
                          {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Basic Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="lg:col-span-2">
                        <Input
                          placeholder="Search events by title or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">All Types</option>
                        {availableTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>

                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">All Statuses</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <Button
                        variant={showMyEventsOnly ? "default" : "outline"}
                        onClick={() => setShowMyEventsOnly(prev => !prev)}
                        className="w-full"
                      >
                        My Events
                      </Button>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showAdvancedFilters && (
                      <div className="mt-6 pt-6 border-t space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-sm">Advanced Filters</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Date Range */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Date Range</label>
                            <div className="flex gap-2 flex-wrap">
                              <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                placeholder="From"
                                className="text-sm"
                              />
                              <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                placeholder="To"
                                className="text-sm"
                              />
                            </div>
                          </div>

                          {/* Location */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Location</label>
                            <select
                              value={locationFilter}
                              onChange={(e) => setLocationFilter(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                            >
                              <option value="">All Locations</option>
                              {uniqueLocations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                              ))}
                            </select>
                          </div>

                          {/* Department */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Department</label>
                            <select
                              value={departmentFilter}
                              onChange={(e) => setDepartmentFilter(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                            >
                              <option value="">All Departments</option>
                              {uniqueDepartmentsForFilter.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          </div>

                          {/* Format */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Event Format</label>
                            <select
                              value={virtualFilter}
                              onChange={(e) => setVirtualFilter(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                            >
                              <option value="">All Formats</option>
                              <option value="virtual">Virtual</option>
                              <option value="in-person">In-Person</option>
                            </select>
                          </div>

                          {/* Capacity Range */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                            <div className="flex gap-2 flex-wrap">
                              <Input
                                type="number"
                                value={capacityMin}
                                onChange={(e) => setCapacityMin(e.target.value)}
                                placeholder="Min"
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                value={capacityMax}
                                onChange={(e) => setCapacityMax(e.target.value)}
                                placeholder="Max"
                                className="text-sm"
                              />
                            </div>
                          </div>

                          {/* Min Registrations */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Min Registrations</label>
                            <Input
                              type="number"
                              value={registrationMin}
                              onChange={(e) => setRegistrationMin(e.target.value)}
                              placeholder="Minimum"
                              className="text-sm"
                            />
                          </div>
                        </div>

                        {/* Active Advanced Filters Display */}
                        {(locationFilter || departmentFilter || capacityMin || capacityMax || registrationMin || virtualFilter || dateFrom || dateTo) && (
                          <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
                            <span className="text-sm text-muted-foreground font-medium">Active advanced filters:</span>
                            {dateFrom && (
                              <Badge variant="secondary" className="gap-1">
                                From {dateFrom}
                                <button onClick={() => setDateFrom("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                            {dateTo && (
                              <Badge variant="secondary" className="gap-1">
                                To {dateTo}
                                <button onClick={() => setDateTo("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                            {locationFilter && (
                              <Badge variant="secondary" className="gap-1">
                                {locationFilter}
                                <button onClick={() => setLocationFilter("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                            {departmentFilter && (
                              <Badge variant="secondary" className="gap-1">
                                {departmentFilter}
                                <button onClick={() => setDepartmentFilter("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                            {virtualFilter && (
                              <Badge variant="secondary" className="gap-1">
                                {virtualFilter === 'virtual' ? 'Virtual' : 'In-Person'}
                                <button onClick={() => setVirtualFilter("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                            {capacityMin && (
                              <Badge variant="secondary" className="gap-1">
                                Capacity Min: {capacityMin}
                                <button onClick={() => setCapacityMin("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                            {capacityMax && (
                              <Badge variant="secondary" className="gap-1">
                                Capacity Max: {capacityMax}
                                <button onClick={() => setCapacityMax("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                            {registrationMin && (
                              <Badge variant="secondary" className="gap-1">
                                Min Reg: {registrationMin}
                                <button onClick={() => setRegistrationMin("")} className="ml-1 hover:text-destructive">?</button>
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Page {currentPage} of {totalPages}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Regular User Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedEvents.map((event) => {
                    const eventDate = new Date(event.date);
                    const now = new Date();
                    const isUpcoming = eventDate >= now;
                    const isPast = eventDate < now;
                    const isToday = eventDate.toDateString() === now.toDateString();
                    const capacityPercent = event.capacity > 0 ? Math.round((event.registered / event.capacity) * 100) : 0;
                    const isNearlyFull = capacityPercent >= 80;
                    const isFull = capacityPercent >= 100;
                    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isDeleting = deletingEventId === event.id;
                    return (
                      <Card key={event.id} className={`hover:shadow-xl transition-all duration-300 border-l-4 ${isFull ? 'border-l-red-500' : isToday ? 'border-l-yellow-500' : isUpcoming ? 'border-l-green-500' : 'border-l-gray-400'} relative overflow-hidden ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant={event.isVirtual ? "secondary" : "outline"}>
                                {event.isVirtual ? "Virtual" : "In-Person"}
                              </Badge>
                              <Badge variant="outline">{event.type}</Badge>
                              <Badge variant={event.allowGuests ? "default" : "destructive"} className={event.allowGuests ? "bg-purple-500 hover:bg-purple-600" : ""}>
                                {event.allowGuests ? "Guests OK" : "No Guests"}
                              </Badge>
                            </div>
                            <Badge className={`${isToday ? 'bg-yellow-500' : isFull ? 'bg-red-500' : isUpcoming ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
                              {isToday ? "Today" : isFull ? "Full" : isUpcoming ? (daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`) : "Past"}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {event.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="mx-1">|</span>
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span>{event.location}</span>
                            </div>
                            {/* Capacity Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className={`font-medium ${isFull ? 'text-red-600' : isNearlyFull ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                  <Users className="h-3 w-3 inline mr-1" />
                                  {event.registered}/{event.capacity} {isFull ? '(Full)' : isNearlyFull ? '(Nearly Full)' : 'registered'}
                                </span>
                                <span className="text-muted-foreground font-medium">{capacityPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : isNearlyFull ? 'bg-orange-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t">
                            {(() => {
                              const closed = isEventClosed(event);
                              const full = event.registered >= event.capacity;
                              const hasRsvped = userRsvpEventIds.includes(event.id);
                              const label = closed
                                ? "Event Closed"
                                : full
                                  ? "Event Full"
                                  : hasRsvped
                                    ? "RSVP Submitted"
                                    : "RSVP Now";

                              return (
                                <Button
                                  onClick={() => {
                                    if (!closed && !full && !hasRsvped) {
                                      setSelectedEvent(event);
                                    }
                                  }}
                                  disabled={closed || full || hasRsvped}
                                >
                                  {label}
                                </Button>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No events found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search or filter to find events.
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
                    <div className="ml-4 text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({filteredEvents.length} events)
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* User Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {/* Advanced Analytics Filters for Users */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Analytics Filters
                      </span>
                      <Button variant="outline" size="sm" onClick={clearEventsAnalyticsFilters}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Filters
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Filter and explore event data to discover trends and insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {/* Date Range */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date From</label>
                        <Input
                          type="date"
                          value={analyticsDateStart}
                          onChange={e => setAnalyticsDateStart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date To</label>
                        <Input
                          type="date"
                          value={analyticsDateEnd}
                          onChange={e => setAnalyticsDateEnd(e.target.value)}
                        />
                      </div>

                      {/* Event Type Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Event Type</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={analyticsEventType}
                          onChange={e => setAnalyticsEventType(e.target.value)}
                        >
                          <option value="">All Types</option>
                          {uniqueEventTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Virtual Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Format</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={analyticsVirtualFilter}
                          onChange={e => setAnalyticsVirtualFilter(e.target.value)}
                        >
                          <option value="">All Formats</option>
                          <option value="virtual">Virtual</option>
                          <option value="in-person">In-Person</option>
                        </select>
                      </div>

                      {/* Capacity Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Min Capacity</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={analyticsCapacityMin}
                          onChange={e => setAnalyticsCapacityMin(e.target.value)}
                        >
                          <option value="">Any</option>
                          <option value="25">25+</option>
                          <option value="50">50+</option>
                          <option value="100">100+</option>
                          <option value="200">200+</option>
                          <option value="500">500+</option>
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
                    </div>

                    {/* Active Filters Summary */}
                    {(analyticsDateStart || analyticsDateEnd || analyticsEventType || analyticsVirtualFilter || analyticsCapacityMin || analyticsDepartment) && (
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {analyticsDateStart && (
                          <Badge variant="secondary" className="gap-1">
                            From {analyticsDateStart}
                            <button onClick={() => setAnalyticsDateStart("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsDateEnd && (
                          <Badge variant="secondary" className="gap-1">
                            To {analyticsDateEnd}
                            <button onClick={() => setAnalyticsDateEnd("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsEventType && (
                          <Badge variant="secondary" className="gap-1">
                            {analyticsEventType}
                            <button onClick={() => setAnalyticsEventType("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsVirtualFilter && (
                          <Badge variant="secondary" className="gap-1">
                            {analyticsVirtualFilter === 'virtual' ? 'Virtual' : 'In-Person'}
                            <button onClick={() => setAnalyticsVirtualFilter("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsCapacityMin && (
                          <Badge variant="secondary" className="gap-1">
                            Capacity {analyticsCapacityMin}+
                            <button onClick={() => setAnalyticsCapacityMin("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                        {analyticsDepartment && (
                          <Badge variant="secondary" className="gap-1">
                            {analyticsDepartment}
                            <button onClick={() => setAnalyticsDepartment("")} className="ml-1 hover:text-destructive">?</button>
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="text-sm text-muted-foreground font-medium">Total Events</div>
                    <div className="text-2xl font-bold text-primary mt-1">{analyticsFilteredEvents.length}</div>
                    <div className="text-xs text-muted-foreground">of {events.length}</div>
                  </div>
                  <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <div className="text-sm text-muted-foreground font-medium">Registrations</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {analyticsFilteredEvents.reduce((sum, e) => sum + e.registered, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">total attendees</div>
                  </div>
                  <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/10">
                    <div className="text-sm text-muted-foreground font-medium">Fill Rate</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">{capacityUtilization}%</div>
                    <div className="text-xs text-muted-foreground">avg capacity used</div>
                  </div>
                  <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/10">
                    <div className="text-sm text-muted-foreground font-medium">Virtual</div>
                    <div className="text-2xl font-bold text-purple-600 mt-1">
                      {analyticsFilteredEvents.filter(e => e.isVirtual).length}
                    </div>
                    <div className="text-xs text-muted-foreground">online events</div>
                  </div>
                  <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/10">
                    <div className="text-sm text-muted-foreground font-medium">Upcoming</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">
                      {upcomingVsPastEvents[0]?.value || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">future events</div>
                  </div>
                  <div className="p-4 bg-rose-500/5 rounded-lg border border-rose-500/10">
                    <div className="text-sm text-muted-foreground font-medium">Avg/Event</div>
                    <div className="text-2xl font-bold text-rose-600 mt-1">
                      {analyticsFilteredEvents.length > 0
                        ? Math.round(analyticsFilteredEvents.reduce((sum, e) => sum + e.registered, 0) / analyticsFilteredEvents.length)
                        : 0}
                    </div>
                    <div className="text-xs text-muted-foreground">registrations</div>
                  </div>
                </div>

                {/* Key Insights */}
                <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      Key Event Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-white rounded-lg border shadow-sm">
                        <div className="text-sm text-muted-foreground">Most Popular Type</div>
                        <div className="text-lg font-semibold text-primary mt-1">
                          {eventsByType.length > 0
                            ? eventsByType.reduce((a, b) => a.value > b.value ? a : b).name
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {eventsByType.length > 0
                            ? `${eventsByType.reduce((a, b) => a.value > b.value ? a : b).value} events`
                            : ''}
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-lg border shadow-sm">
                        <div className="text-sm text-muted-foreground">Best Day for Events</div>
                        <div className="text-lg font-semibold text-primary mt-1">
                          {eventsByDayOfWeek.length > 0
                            ? eventsByDayOfWeek.reduce((a, b) => a.registrations > b.registrations ? a : b).fullDay
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {eventsByDayOfWeek.length > 0
                            ? `${eventsByDayOfWeek.reduce((a, b) => a.registrations > b.registrations ? a : b).registrations} registrations`
                            : ''}
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-lg border shadow-sm">
                        <div className="text-sm text-muted-foreground">Peak Time Slot</div>
                        <div className="text-lg font-semibold text-primary mt-1">
                          {eventsByTimeSlot.length > 0
                            ? eventsByTimeSlot.reduce((a, b) => a.value > b.value ? a : b).name.split(' ')[0]
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {eventsByTimeSlot.length > 0
                            ? `${eventsByTimeSlot.reduce((a, b) => a.value > b.value ? a : b).value} events`
                            : ''}
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-lg border shadow-sm">
                        <div className="text-sm text-muted-foreground">Top Location</div>
                        <div className="text-lg font-semibold text-primary mt-1 truncate">
                          {locationAnalytics.length > 0
                            ? locationAnalytics[0].location
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {locationAnalytics.length > 0
                            ? `${locationAnalytics[0].registrations} attendees`
                            : ''}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Charts Grid - Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Event Popularity Score */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Event Popularity Score
                      </CardTitle>
                      <CardDescription>
                        Top 10 events by fill rate percentage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {eventPopularityScore.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={eventPopularityScore} layout="vertical" margin={{ left: 10, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                                      <p className="font-medium text-sm">{data.fullName}</p>
                                      <p className="text-xs text-muted-foreground">{data.type}</p>
                                      <div className="mt-2 space-y-1 text-xs">
                                        <p>Fill Rate: <span className="font-semibold text-primary">{data.score}%</span></p>
                                        <p>Registered: {data.registered} / {data.capacity}</p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                              {eventPopularityScore.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.score >= 80 ? '#22c55e' : entry.score >= 50 ? '#f59e0b' : '#ef4444'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No event data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Registrations by Day of Week */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Registrations by Day
                      </CardTitle>
                      <CardDescription>
                        Best performing days for events
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={eventsByDayOfWeek}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-lg border">
                                    <p className="font-medium">{data.fullDay}</p>
                                    <div className="mt-1 space-y-1 text-sm">
                                      <p>Events: {data.events}</p>
                                      <p>Registrations: <span className="font-semibold text-primary">{data.registrations}</span></p>
                                      <p>Avg/Event: {data.avgPerEvent}</p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {eventsByDayOfWeek.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Charts Grid - Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Time Slot Distribution */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-500" />
                        Time Slot Distribution
                      </CardTitle>
                      <CardDescription>
                        When events are scheduled
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={eventsByTimeSlot}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }: { name?: string; percent?: number }) =>
                              `${(percent ? percent * 100 : 0).toFixed(0)}%`
                            }
                          >
                            {eventsByTimeSlot.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#8b5cf6', '#f59e0b', '#22c55e', '#3b82f6'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [`${value} events`, name.split(' ')[0]]} />
                          <Legend
                            formatter={(value) => value.split(' ')[0]}
                            wrapperStyle={{ fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Virtual vs In-Person */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        Event Format
                      </CardTitle>
                      <CardDescription>
                        Virtual vs In-Person breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={virtualVsInPerson}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }: { name?: string; percent?: number }) =>
                              `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                            }
                          >
                            <Cell fill="#8b5cf6" />
                            <Cell fill="#22c55e" />
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} events`, 'Count']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Upcoming vs Past */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-rose-500" />
                        Timeline Status
                      </CardTitle>
                      <CardDescription>
                        Upcoming vs completed events
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={upcomingVsPastEvents}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }: { name?: string; percent?: number }) =>
                              `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                            }
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#6b7280" />
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 rounded-lg shadow-lg border">
                                    <p className="font-medium">{data.name}</p>
                                    <p className="text-sm">{data.value} events</p>
                                    <p className="text-sm text-muted-foreground">{data.registrations} registrations</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Charts Grid - Row 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Registration vs Capacity Trend */}
                  <Card className="lg:col-span-2 border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        Registration vs Capacity Trend
                      </CardTitle>
                      <CardDescription>
                        Compare registrations against capacity for recent events
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      {registrationVsCapacityTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={registrationVsCapacityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0.2} />
                              </linearGradient>
                              <linearGradient id="colorRegistered" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                                      <p className="font-medium text-sm">{data.name}</p>
                                      <div className="mt-2 space-y-1 text-xs">
                                        <p>Capacity: <span className="font-semibold">{data.capacity}</span></p>
                                        <p>Registered: <span className="font-semibold text-blue-600">{data.registered}</span></p>
                                        <p>Fill Rate: <span className="font-semibold text-green-600">{data.utilization}%</span></p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="capacity" name="Capacity" stroke="#9ca3af" fill="url(#colorCapacity)" strokeWidth={2} />
                            <Area type="monotone" dataKey="registered" name="Registered" stroke="#3b82f6" fill="url(#colorRegistered)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No trend data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Charts Grid - Row 4 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Average Registrations by Type */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        Avg Registrations by Type
                      </CardTitle>
                      <CardDescription>
                        Which event types attract most attendees
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                      {avgRegistrationsPerType.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={avgRegistrationsPerType}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                                      <p className="font-medium">{data.type}</p>
                                      <div className="mt-1 space-y-1 text-sm">
                                        <p>Avg Registrations: <span className="font-semibold text-primary">{data.avgRegistrations}</span></p>
                                        <p>Total Events: {data.totalEvents}</p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="avgRegistrations" fill="#6366f1" radius={[4, 4, 0, 0]}>
                              {avgRegistrationsPerType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No type data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Locations */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-rose-500" />
                        Top Event Locations
                      </CardTitle>
                      <CardDescription>
                        Most popular venues by attendance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                      {locationAnalytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={locationAnalytics} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis dataKey="location" type="category" width={100} tick={{ fontSize: 9 }} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border">
                                      <p className="font-medium text-sm">{data.fullLocation}</p>
                                      <div className="mt-1 space-y-1 text-sm">
                                        <p>Events: {data.events}</p>
                                        <p>Registrations: <span className="font-semibold text-primary">{data.registrations}</span></p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="registrations" fill="#f43f5e" radius={[0, 4, 4, 0]}>
                              {locationAnalytics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#22c55e'][index % 8]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No location data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Department Distribution & Event Types */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Distribution */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        Department Distribution
                      </CardTitle>
                      <CardDescription>
                        Events organized by department
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={departmentDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            label={({ name, percent }: { name?: string; percent?: number }) =>
                              `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`
                            }
                          >
                            {departmentDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} events`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Event Types Breakdown */}
                  <Card className="border-2 hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-teal-500" />
                        Event Types Breakdown
                      </CardTitle>
                      <CardDescription>
                        Distribution across event categories
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={eventsByType}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => [`${value} events`, 'Count']} />
                          <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                            {eventsByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Events Table */}
                <Card className="border-2 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Top Performing Events
                    </CardTitle>
                    <CardDescription>
                      Events with highest registration rates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-6 bg-muted p-3 font-medium text-sm">
                        <div className="col-span-2">Event Name</div>
                        <div className="text-center">Type</div>
                        <div className="text-center">Date</div>
                        <div className="text-center">Capacity</div>
                        <div className="text-right">Fill Rate</div>
                      </div>
                      <div className="divide-y max-h-80 overflow-y-auto">
                        {[...analyticsFilteredEvents]
                          .sort((a, b) => (b.registered / b.capacity) - (a.registered / a.capacity))
                          .slice(0, 10)
                          .map((event) => {
                            const fillRate = Math.round((event.registered / event.capacity) * 100);
                            return (
                              <div key={event.id} className="grid grid-cols-6 p-3 text-sm hover:bg-muted/50 transition-colors">
                                <div className="col-span-2 truncate font-medium">{event.title}</div>
                                <div className="text-center">
                                  <Badge variant="outline" className="text-xs">{event.type}</Badge>
                                </div>
                                <div className="text-center text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="text-center text-muted-foreground">
                                  {event.registered}/{event.capacity}
                                </div>
                                <div className="text-right">
                                  <span className={`font-semibold ${fillRate >= 80 ? 'text-green-600' : fillRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {fillRate}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* RSVP Dialog - Only for non-admin users */}
          {!isAdmin && selectedEvent && (
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    RSVP Registration
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Complete your registration for this event
                  </DialogDescription>
                </DialogHeader>

                {/* Event Details Card */}
                <div className="bg-linear-to-br from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                  <h3 className="font-semibold text-lg text-primary mb-2">{selectedEvent.title}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{new Date(selectedEvent.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{selectedEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Badge variant={selectedEvent.isVirtual ? "secondary" : "outline"} className="text-xs">
                        {selectedEvent.isVirtual ? "Virtual" : "In-Person"}
                      </Badge>
                    </div>
                  </div>

                  {/* Real-time Capacity Bar */}
                  <div className="mt-4 pt-3 border-t border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Users className="h-4 w-4 text-primary" />
                        Capacity
                      </span>
                      <span className={`text-sm font-bold ${selectedEvent.registered >= selectedEvent.capacity
                          ? 'text-red-600'
                          : selectedEvent.registered >= selectedEvent.capacity * 0.8
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}>
                        {selectedEvent.registered}/{selectedEvent.capacity} spots filled
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${selectedEvent.registered >= selectedEvent.capacity
                            ? 'bg-red-500'
                            : selectedEvent.registered >= selectedEvent.capacity * 0.8
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                        style={{ width: `${Math.min((selectedEvent.registered / selectedEvent.capacity) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {selectedEvent.capacity - selectedEvent.registered > 0
                        ? `${selectedEvent.capacity - selectedEvent.registered} spots remaining`
                        : 'Event is full - Waitlist available'}
                    </p>
                  </div>
                </div>

                {/* Registration Form */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Number of Additional Guests
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={() => setRsvpData(prev => ({ ...prev, guestCount: Math.max(0, prev.guestCount - 1) }))}
                        disabled={rsvpData.guestCount <= 0}
                      >
                        -
                      </Button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-bold text-primary">{rsvpData.guestCount}</span>
                        <p className="text-xs text-muted-foreground">guest{rsvpData.guestCount !== 1 ? 's' : ''}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={() => setRsvpData(prev => ({ ...prev, guestCount: Math.min(5, prev.guestCount + 1) }))}
                        disabled={rsvpData.guestCount >= 5}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Maximum 5 guests per registration ? Total: {1 + rsvpData.guestCount} attendee{1 + rsvpData.guestCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      Special Requirements (Optional)
                    </label>
                    <textarea
                      value={rsvpData.specialRequirements}
                      onChange={(e) => setRsvpData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                      placeholder="Dietary restrictions, accessibility needs, parking requirements, etc."
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedEvent(null);
                      setRsvpData({ guestCount: 0, specialRequirements: "" });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitRSVP}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={selectedEvent.registered >= selectedEvent.capacity}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedEvent.registered >= selectedEvent.capacity ? 'Join Waitlist' : 'Confirm RSVP'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Admin Dialogs */}
          {isAdmin && (
            <>
              {/* Delete Confirmation Dialog */}
              <Dialog open={!!deleteConfirmEvent} onOpenChange={(open) => !open && setDeleteConfirmEvent(null)}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <Trash2 className="h-5 w-5" />
                      Delete Event
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{deleteConfirmEvent?.title}&quot;? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setDeleteConfirmEvent(null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteEvent}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Attendees dialog */}
              <Dialog
                open={!!attendeesDialogEvent}
                onOpenChange={(open) => {
                  if (!open) {
                    setAttendeesDialogEvent(null);
                    setAttendees([]);
                    setAttendeesError(null);
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>RSVPs for {attendeesDialogEvent?.title}</DialogTitle>
                    <DialogDescription>
                      View alumni who have RSVP'd for this event.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    {attendeesLoading && (
                      <p className="text-sm text-muted-foreground">Loading RSVP details...</p>
                    )}
                    {attendeesError && (
                      <p className="text-sm text-destructive">{attendeesError}</p>
                    )}
                    {!attendeesLoading && !attendeesError && attendees.length === 0 && (
                      <p className="text-sm text-muted-foreground">No RSVPs yet for this event.</p>
                    )}
                    {!attendeesLoading && attendees.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {attendees.map((rsvp) => (
                          <div
                            key={rsvp.id}
                            className="flex justify-between items-center border rounded-md px-3 py-2 text-sm"
                          >
                            <div>
                              <div className="font-medium">
                                {rsvp.alumniName || `Alumni #${rsvp.alumniId}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(rsvp.alumniEmail as string) || 'Email unknown'}
                                {rsvp.rsvpDate && ` ? RSVP on ${rsvp.rsvpDate}`}
                              </div>
                              {rsvp.specialRequirements && (
                                <div className="text-xs mt-1">
                                  Special: {rsvp.specialRequirements}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <div>Guests: {rsvp.guestCount ?? 0}</div>
                              <div>Status: {rsvp.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Event dialog */}
              <Dialog
                open={!!editingEvent}
                onOpenChange={(open) => {
                  if (!open) {
                    setEditingEvent(null);
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                    <DialogDescription>
                      Update event details for this session. Changes will be reflected in the current listings.
                    </DialogDescription>
                  </DialogHeader>
                  {editingEvent && (
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Title</label>
                          <Input
                            placeholder="Event title"
                            value={editEventData.title}
                            onChange={(e) =>
                              setEditEventData((prev) => ({ ...prev, title: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Type</label>
                          <select
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                            value={editEventData.type}
                            onChange={(e) =>
                              setEditEventData((prev) => ({ ...prev, type: e.target.value }))
                            }
                          >
                            <option value="Networking">Networking</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Social">Social</option>
                            <option value="Conference">Conference</option>
                            <option value="Career Fair">Career Fair</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Date</label>
                          <Input
                            type="date"
                            value={editEventData.date}
                            onChange={(e) =>
                              setEditEventData((prev) => ({ ...prev, date: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Time</label>
                          <Input
                            type="time"
                            value={editEventData.time}
                            onChange={(e) =>
                              setEditEventData((prev) => ({ ...prev, time: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Capacity</label>
                          <Input
                            type="number"
                            value={editEventData.capacity}
                            onChange={(e) =>
                              setEditEventData((prev) => ({
                                ...prev,
                                capacity: parseInt(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Location</label>
                        <Input
                          placeholder="City or virtual link"
                          value={editEventData.location}
                          onChange={(e) =>
                            setEditEventData((prev) => ({ ...prev, location: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <textarea
                          className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                          rows={3}
                          placeholder="Brief description of the event"
                          value={editEventData.description}
                          onChange={(e) =>
                            setEditEventData((prev) => ({ ...prev, description: e.target.value }))
                          }
                        ></textarea>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingEvent(null)}>
                          Cancel
                        </Button>
                        <Button
                          disabled={editSaving}
                          onClick={async () => {
                            if (!editingEvent) return;
                            setEditSaving(true);
                            try {
                              const response = await fetch(`/api/events/${editingEvent.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(editEventData),
                              });
                              if (response.ok) {
                                const updatedEvent: Event = {
                                  ...editingEvent,
                                  ...editEventData,
                                };
                                setEvents((prev) =>
                                  prev.map((e) => (e.id === editingEvent.id ? updatedEvent : e))
                                );
                                setEditingEvent(null);
                                window.dispatchEvent(new Event('eventsUpdated'));
                              } else {
                                console.error('Failed to update event');
                              }
                            } catch (error) {
                              console.error('Error updating event:', error);
                            } finally {
                              setEditSaving(false);
                            }
                          }}
                          className="min-w-[120px]"
                        >
                          {editSaving ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Create Event Dialog */}
              <Dialog open={isCreateEventOpen} onOpenChange={(open) => {
                if (!isCreatingEvent) {
                  setIsCreateEventOpen(open);
                  if (!open) setCreateEventErrors({});
                }
              }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Create New Event
                    </DialogTitle>
                    <DialogDescription>
                      Fill in the details below to create a new alumni event.
                    </DialogDescription>
                  </DialogHeader>

                  {createEventErrors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                      <span>{createEventErrors.submit}</span>
                    </div>
                  )}

                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium mb-1.5 block">Event Title <span className="text-red-500">*</span></label>
                          <Input placeholder="e.g. Alumni Networking Mixer" value={createEventData.title} onChange={(e) => setCreateEventData(prev => ({ ...prev, title: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Event Type</label>
                          <select className="w-full px-3 py-2 border border-input rounded-md bg-background" value={createEventData.type} onChange={(e) => setCreateEventData(prev => ({ ...prev, type: e.target.value }))}>
                            <option value="Networking">Networking</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Social">Social</option>
                            <option value="Conference">Conference</option>
                            <option value="Career Fair">Career Fair</option>
                            <option value="Webinar">Webinar</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Department</label>
                          <select className="w-full px-3 py-2 border border-input rounded-md bg-background" value={createEventData.department} onChange={(e) => setCreateEventData(prev => ({ ...prev, department: e.target.value }))}>
                            <option value="General">General</option>
                            <option value="Business">Business</option>
                            <option value="Engineering">Engineering</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        Date and Time
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Date <span className="text-red-500">*</span></label>
                          <Input type="date" value={createEventData.date} onChange={(e) => setCreateEventData(prev => ({ ...prev, date: e.target.value }))} min={new Date().toISOString().split("T")[0]} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Start Time <span className="text-red-500">*</span></label>
                          <Input type="time" value={createEventData.time} onChange={(e) => setCreateEventData(prev => ({ ...prev, time: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">End Time</label>
                          <Input type="time" value={createEventData.endTime} onChange={(e) => setCreateEventData(prev => ({ ...prev, endTime: e.target.value }))} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        Location
                      </h3>
                      <div className="pl-8 space-y-4">
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                          <input type="checkbox" checked={createEventData.isVirtual} onChange={(e) => setCreateEventData(prev => ({ ...prev, isVirtual: e.target.checked }))} className="w-4 h-4" />
                          <div><span className="font-medium text-sm">Virtual Event</span></div>
                        </div>
                        {createEventData.isVirtual ? (
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Meeting Link <span className="text-red-500">*</span></label>
                            <Input placeholder="https://zoom.us/j/..." value={createEventData.virtualLink} onChange={(e) => setCreateEventData(prev => ({ ...prev, virtualLink: e.target.value }))} />
                          </div>
                        ) : (
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Location <span className="text-red-500">*</span></label>
                            <Input placeholder="SLU Campus" value={createEventData.location} onChange={(e) => setCreateEventData(prev => ({ ...prev, location: e.target.value }))} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        Capacity
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Max Capacity <span className="text-red-500">*</span></label>
                          <Input type="number" placeholder="100" value={createEventData.capacity} onChange={(e) => setCreateEventData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Allow Guests</label>
                          <select className="w-full px-3 py-2 border border-input rounded-md bg-background" value={createEventData.allowGuests ? "yes" : "no"} onChange={(e) => setCreateEventData(prev => ({ ...prev, allowGuests: e.target.value === "yes" }))}>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                        Event Details
                      </h3>
                      <div className="pl-8">
                        <label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label>
                        <textarea className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none" rows={4} placeholder="Describe the event..." value={createEventData.description} onChange={(e) => setCreateEventData(prev => ({ ...prev, description: e.target.value }))} maxLength={500}></textarea>
                        <div className="flex justify-end mt-1">
                          <span className="text-xs text-gray-400">{createEventData.description.length}/500</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-4 pt-4 border-t">
                    <p className="text-xs text-gray-500"><span className="text-red-500">*</span> Required</p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => { setIsCreateEventOpen(false); setCreateEventErrors({}); }} disabled={isCreatingEvent}>Cancel</Button>
                      <Button onClick={handleSubmitCreateEvent} disabled={isCreatingEvent} className="bg-blue-600 hover:bg-blue-700">
                        {isCreatingEvent ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create Event</>}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>



              <Dialog open={isEventSettingsOpen} onOpenChange={setIsEventSettingsOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Event Settings</DialogTitle>
                    <DialogDescription>
                      Configure default behaviour for alumni events.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Default Registration Limit</label>
                      <Input type="number" placeholder="100" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Allow RSVP with guests</label>
                      <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Send email reminders</label>
                      <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                        <option value="24">24 hours before</option>
                        <option value="72">3 days before</option>
                        <option value="0">Do not send reminders</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEventSettingsOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsEventSettingsOpen(false)}>
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

