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
import { Calendar, MapPin, Users, Clock, Filter, Plus, Edit, Trash2, Settings, BarChart3, Shield, RefreshCw } from "lucide-react";
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

  // Analytics Data Preparation
  const eventsByType = useMemo(() => {
    const types: Record<string, number> = {};
    events.forEach(event => {
      types[event.type] = (types[event.type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [events]);

  const registrationsByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    events.forEach(event => {
      if (!event.date) return;
      const date = new Date(event.date);
      const month = date.toLocaleString('default', { month: 'short' });
      months[month] = (months[month] || 0) + (event.registered || 0);
    });
    // Sort months chronologically if needed, but for now simple map
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [events]);

  const virtualVsInPerson = useMemo(() => {
    let virtual = 0;
    let inPerson = 0;
    events.forEach(event => {
      if (event.isVirtual) virtual++;
      else inPerson++;
    });
    return [
      { name: 'Virtual', value: virtual },
      { name: 'In-Person', value: inPerson },
    ];
  }, [events]);

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
        console.log('✅ Real CSV events loaded:', data.events?.length || 0, 'events');
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
        console.error('❌ Failed to fetch events:', response.status, response.statusText);
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
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || event.type === selectedType;
    const bucket = getEventStatusBucket(event);
    const matchesStatus = !selectedStatus || bucket === selectedStatus;
    const matchesMine = !showMyEventsOnly || userRsvpEventIds.includes(event.id);
    return matchesSearch && matchesType && matchesStatus && matchesMine;
  });

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

  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });

      if (response.ok) {
        alert("Event deleted successfully!");
        fetchEvents(); // Refresh events list
      } else {
        alert("Failed to delete event. Please try again.");
      }
    } catch (error) {
      console.error('Delete event error:', error);
      alert("Error deleting event. Please try again.");
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
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'admin@slu.edu',
        },
        body: JSON.stringify(createEventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        alert(errorData?.error || 'Failed to create event. Please check the form and try again.');
        return;
      }

      await response.json();
      alert('Event created successfully!');

      // Close dialog and reset form
      setIsCreateEventOpen(false);
      setCreateEventData({
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

      // Refresh events so the new one appears for admin and alumni
      fetchEvents();
    } catch (error) {
      console.error('Create event error:', error);
      alert('Error creating event. Please try again.');
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
              <div className="flex gap-2">
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
                  <div className="flex gap-2">
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
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>

                {/* Admin Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={event.isVirtual ? "secondary" : "outline"}>
                            {event.isVirtual ? "Virtual" : "In-Person"}
                          </Badge>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {event.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString()} • {event.time}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {event.registered}/{event.capacity} registered
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.registered}/{event.capacity}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditEvent(event)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewAttendees(event)}>
                              <Users className="h-4 w-4 mr-1" />
                              Attendees
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Event Analytics Dashboard
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-sm text-muted-foreground font-medium">Total Events</div>
                        <div className="text-3xl font-bold text-primary mt-1">{filteredEvents.length}</div>
                      </div>
                      <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/10">
                        <div className="text-sm text-muted-foreground font-medium">Total Registrations</div>
                        <div className="text-3xl font-bold text-secondary mt-1">
                          {filteredEvents.reduce((sum, event) => sum + event.registered, 0)}
                        </div>
                      </div>
                      <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                        <div className="text-sm text-muted-foreground font-medium">Avg. Attendance</div>
                        <div className="text-3xl font-bold text-accent mt-1">
                          {filteredEvents.length > 0
                            ? Math.round(filteredEvents.reduce((sum, event) => sum + event.registered, 0) / filteredEvents.length)
                            : 0}
                        </div>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-sm text-muted-foreground font-medium">Virtual Events</div>
                        <div className="text-3xl font-bold text-primary mt-1">
                          {filteredEvents.filter(event => event.isVirtual).length}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Registration Trends */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Registration Trends
                        </h3>
                        <div className="h-[300px] w-full border rounded-lg p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={registrationsByMonth}>
                              <defs>
                                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Area type="monotone" dataKey="value" stroke="#0088FE" fillOpacity={1} fill="url(#colorReg)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Event Type Distribution */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Event Types
                        </h3>
                        <div className="h-[300px] w-full border rounded-lg p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventsByType} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={100} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#00C49F" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Virtual vs In-Person */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Virtual vs In-Person
                        </h3>
                        <div className="h-[300px] w-full border rounded-lg p-4 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={virtualVsInPerson}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {virtualVsInPerson.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Top Performing Events */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Top Performing Events
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-3 bg-muted p-3 font-medium text-sm">
                            <div className="col-span-2">Event Name</div>
                            <div className="text-right">Registrations</div>
                          </div>
                          <div className="divide-y">
                            {[...events].sort((a, b) => b.registered - a.registered).slice(0, 5).map((event) => (
                              <div key={event.id} className="grid grid-cols-3 p-3 text-sm hover:bg-muted/50 transition-colors">
                                <div className="col-span-2 truncate font-medium">{event.title}</div>
                                <div className="text-right">{event.registered}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
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
                        <Input type="number" defaultValue="100" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Registration Deadline (days before event)</label>
                        <Input type="number" defaultValue="3" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Auto-approve Registrations</label>
                        <select className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <Button className="w-full">Save Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* Regular User Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1">
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
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
                  >
                    My Events
                  </Button>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>

              {/* Regular User Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={event.isVirtual ? "secondary" : "outline"}>
                          {event.isVirtual ? "Virtual" : "In-Person"}
                        </Badge>
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString()} • {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {event.registered}/{event.capacity} registered
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.registered}/{event.capacity}
                          </span>
                        </div>
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
                ))}
              </div>
            </>
          )}

          {/* RSVP Dialog - Only for non-admin users */}
          {!isAdmin && (
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>RSVP for {selectedEvent?.title}</DialogTitle>
                  <DialogDescription>
                    Please provide your RSVP details for this event.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Number of Guests</label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={rsvpData.guestCount}
                      onChange={(e) => setRsvpData(prev => ({ ...prev, guestCount: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 5 guests per registration
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Special Requirements</label>
                    <textarea
                      value={rsvpData.specialRequirements}
                      onChange={(e) => setRsvpData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                      placeholder="Any dietary restrictions, accessibility needs, etc."
                      className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setSelectedEvent(null)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={submitRSVP} className="flex-1">
                      Confirm RSVP
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Admin Dialogs */}
          {isAdmin && (
            <>
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
                                {rsvp.rsvpDate && ` • RSVP on ${rsvp.rsvpDate}`}
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
                          onClick={() => {
                            if (!editingEvent) return;
                            const updatedEvent: Event = {
                              ...editingEvent,
                              ...editEventData,
                            };
                            setEvents((prev) =>
                              prev.map((e) => (e.id === editingEvent.id ? updatedEvent : e))
                            );
                            setEditingEvent(null);
                          }}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Event</DialogTitle>
                    <DialogDescription>
                      Draft a new alumni event. This is a demo form and will not persist to the CSV yet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Title</label>
                        <Input
                          placeholder="e.g. Alumni Networking Mixer"
                          value={createEventData.title}
                          onChange={(e) => setCreateEventData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <select
                          className="w-full px-3 py-2 border border-input rounded-md bg-background"
                          value={createEventData.type}
                          onChange={(e) => setCreateEventData(prev => ({ ...prev, type: e.target.value }))}
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
                          value={createEventData.date}
                          onChange={(e) => setCreateEventData(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Time</label>
                        <Input
                          type="time"
                          value={createEventData.time}
                          onChange={(e) => setCreateEventData(prev => ({ ...prev, time: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Capacity</label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={createEventData.capacity}
                          onChange={(e) => setCreateEventData(prev => ({
                            ...prev,
                            capacity: parseInt(e.target.value) || 0,
                          }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location</label>
                      <Input
                        placeholder="City or virtual link"
                        value={createEventData.location}
                        onChange={(e) => setCreateEventData(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <textarea
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                        rows={3}
                        placeholder="Brief description of the event"
                        value={createEventData.description}
                        onChange={(e) => setCreateEventData(prev => ({ ...prev, description: e.target.value }))}
                      ></textarea>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmitCreateEvent}>
                        Save Event
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
                        <option value="0">Do not send (demo)</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsEventSettingsOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsEventSettingsOpen(false)}>
                        Save Settings (Demo)
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
