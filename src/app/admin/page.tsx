"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Mail, 
  Settings, 
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Filter,
  Search,
  RefreshCw
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDonations: number;
  totalEvents: number;
  newUsersThisMonth: number;
  donationsThisMonth: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  graduationYear: number;
  department: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  joinDate: string;
  lastActive: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  attendees: number;
  status: "UPCOMING" | "ONGOING" | "COMPLETED";
  category: string;
}

interface Donation {
  id: string;
  donor: string;
  amount: number;
  campaign: string;
  date: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
}

export default function AdminDashboard() {
  const { user, isHydrated } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any | null>(null);
  const [userAction, setUserAction] = useState<string | null>(null);
  const [selectedAdminEvent, setSelectedAdminEvent] = useState<Event | null>(null);
  const [eventAction, setEventAction] = useState<string | null>(null);

  // Fetch admin statistics
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [user?.email]);

  useEffect(() => {
    if (isHydrated && isAdmin) {
      fetchStats();
      fetchUsers();
    }
  }, [isHydrated, isAdmin, fetchStats, fetchUsers]);

  // Admin protection check
  if (!isHydrated) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
                  <p className="text-muted-foreground">You need admin privileges to access this page.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  // Sample events data
  const events: Event[] = [
    {
      id: "1",
      title: "Annual Alumni Gala",
      date: "2024-12-15",
      attendees: 245,
      status: "UPCOMING",
      category: "Social"
    },
    {
      id: "2",
      title: "Career Networking Night",
      date: "2024-11-20",
      attendees: 89,
      status: "UPCOMING",
      category: "Professional"
    },
    {
      id: "3",
      title: "Homecoming Weekend",
      date: "2024-10-15",
      attendees: 567,
      status: "COMPLETED",
      category: "Social"
    }
  ];

  // Sample donations data
  const donations: Donation[] = [
    {
      id: "1",
      donor: "Sarah Johnson",
      amount: 500,
      campaign: "Student Scholarship Fund",
      date: "2024-11-10",
      status: "COMPLETED"
    },
    {
      id: "2",
      donor: "Michael Chen",
      amount: 1000,
      campaign: "Alumni Center Renovation",
      date: "2024-11-08",
      status: "COMPLETED"
    },
    {
      id: "3",
      donor: "Anonymous",
      amount: 250,
      campaign: "Research Innovation Grant",
      date: "2024-11-05",
      status: "PENDING"
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const departmentChartData = stats?.charts?.departmentDistribution || [];
  const graduationChartData = stats?.charts?.graduationYears || [];
  const donationPurposeData = stats?.charts?.donationsByPurpose || [];
  const pieColors = ["#2563eb", "#16a34a", "#f97316", "#ec4899", "#6366f1", "#0f766e"];

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      UPCOMING: "bg-blue-100 text-blue-800",
      ONGOING: "bg-orange-100 text-orange-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleUserAction = (action: string, userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setSelectedAdminUser(target);
    setUserAction(action);
  };

  const handleEventAction = (action: string, eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;
    setSelectedAdminEvent(target);
    setEventAction(action);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage users, events, donations, and platform analytics.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="donations">Donations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-32"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.overview?.totalUsers?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">
                          +{stats?.overview?.newUsersThisMonth || 0} from last month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-32"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.overview?.activeUsers?.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats?.overview?.userGrowthRate || '0%'} growth rate
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-32"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.overview?.totalDonations || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                          +{formatCurrency(stats?.overview?.donationsThisMonth || 0)} this month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-muted rounded w-20 mb-2"></div>
                        <div className="h-4 bg-muted rounded w-32"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stats?.overview?.totalEvents || 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats?.overview?.upcomingEvents || 0} upcoming
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Users</CardTitle>
                      <Button size="sm" variant="outline" onClick={fetchUsers}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="h-4 bg-muted rounded w-32"></div>
                                <div className="h-3 bg-muted rounded w-48"></div>
                              </div>
                              <div className="h-6 bg-muted rounded w-16"></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        stats?.recentActivity?.users?.slice(0, 5).map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                          </div>
                        )) || (
                          <p className="text-muted-foreground text-center py-4">No recent users</p>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Donations</CardTitle>
                      <Button size="sm" variant="outline" onClick={fetchStats}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="h-4 bg-muted rounded w-32"></div>
                                <div className="h-3 bg-muted rounded w-48"></div>
                              </div>
                              <div className="space-y-2 text-right">
                                <div className="h-4 bg-muted rounded w-20"></div>
                                <div className="h-6 bg-muted rounded w-16"></div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        stats?.recentActivity?.donations?.slice(0, 5).map((donation: any) => (
                          <div key={donation.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{donation.donor}</p>
                              <p className="text-sm text-muted-foreground">{donation.campaign}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(donation.amount)}</p>
                              <Badge className={getStatusColor(donation.status)}>
                                {donation.status}
                              </Badge>
                            </div>
                          </div>
                        )) || (
                          <p className="text-muted-foreground text-center py-4">No recent donations</p>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Management</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filters */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Graduation Year</th>
                          <th className="text-left p-2">Department</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Last Active</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2"><div className="h-4 bg-muted rounded w-32 animate-pulse"></div></td>
                              <td className="p-2"><div className="h-4 bg-muted rounded w-48 animate-pulse"></div></td>
                              <td className="p-2"><div className="h-4 bg-muted rounded w-16 animate-pulse"></div></td>
                              <td className="p-2"><div className="h-4 bg-muted rounded w-24 animate-pulse"></div></td>
                              <td className="p-2"><div className="h-6 bg-muted rounded w-16 animate-pulse"></div></td>
                              <td className="p-2"><div className="h-4 bg-muted rounded w-20 animate-pulse"></div></td>
                              <td className="p-2"><div className="h-8 bg-muted rounded w-24 animate-pulse"></div></td>
                            </tr>
                          ))
                        ) : (
                          users.map((user) => (
                            <tr key={user.id} className="border-b">
                              <td className="p-2 font-medium">
                                {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email}
                              </td>
                              <td className="p-2 text-muted-foreground">{user.email}</td>
                              <td className="p-2">{user.profile?.graduationYear || 'N/A'}</td>
                              <td className="p-2">{user.profile?.department || 'N/A'}</td>
                              <td className="p-2">
                                <Badge className={getStatusColor(user.profile?.verificationStatus || 'PENDING')}>
                                  {user.profile?.verificationStatus || 'PENDING'}
                                </Badge>
                              </td>
                              <td className="p-2 text-muted-foreground">
                                {new Date(user.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUserAction("View", user.id)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUserAction("Edit", user.id)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUserAction("Delete", user.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Management Tab */}
            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Event Management</CardTitle>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()} • {event.attendees} attendees
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                            <Badge variant="outline">{event.category}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEventAction("View", event.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEventAction("Edit", event.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Donations Management Tab */}
            <TabsContent value="donations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Donation Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Donor</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Campaign</th>
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((donation) => (
                          <tr key={donation.id} className="border-b">
                            <td className="p-2 font-medium">{donation.donor}</td>
                            <td className="p-2 font-medium">{formatCurrency(donation.amount)}</td>
                            <td className="p-2 text-muted-foreground">{donation.campaign}</td>
                            <td className="p-2">{new Date(donation.date).toLocaleDateString()}</td>
                            <td className="p-2">
                              <Badge className={getStatusColor(donation.status)}>
                                {donation.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      User Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {graduationChartData.length === 0 ? (
                      <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">User growth analytics will appear here once stats are available.</p>
                          <p className="text-sm text-muted-foreground">Powered by admin CSV stats.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={graduationChartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name="Alumni per Year"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Donation Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {donationPurposeData.length === 0 ? (
                      <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">Donation breakdown will appear here once stats are available.</p>
                          <p className="text-sm text-muted-foreground">Shows how giving is distributed by purpose.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip
                              formatter={(value: any, name: any, entry: any) => [
                                formatCurrency(value as number),
                                `${entry.payload.purpose} (${entry.payload.percentage}%)`,
                              ]}
                            />
                            <Legend />
                            <Pie
                              data={donationPurposeData}
                              dataKey="amount"
                              nameKey="purpose"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(entry: any) => `${entry?.payload?.percentage ?? 0}%`}
                            >
                              {donationPurposeData.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Department Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {departmentChartData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Department distribution will appear here once admin stats are available.
                      </p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={departmentChartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#2563eb" name="Alumni" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">System Uptime</span>
                        <Badge className="bg-green-100 text-green-800">99.9%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Database Performance</span>
                        <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Response Time</span>
                        <Badge className="bg-yellow-100 text-yellow-800">245ms</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Sessions</span>
                        <Badge className="bg-blue-100 text-blue-800">127</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Admin action dialogs */}
          <AdminUserActionDialog
            user={selectedAdminUser}
            action={userAction}
            onClose={() => {
              setSelectedAdminUser(null);
              setUserAction(null);
            }}
            onUpdateUsers={setUsers}
          />

          <AdminEventActionDialog
            event={selectedAdminEvent}
            action={eventAction}
            onClose={() => {
              setSelectedAdminEvent(null);
              setEventAction(null);
            }}
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

// Admin action dialogs
function AdminUserActionDialog({
  user,
  action,
  onClose,
  onUpdateUsers,
}: {
  user: any | null;
  action: string | null;
  onClose: () => void;
  onUpdateUsers: (updater: (prev: any[]) => any[]) => void;
}) {
  if (!user || !action) return null as any;

  const title = `${action} User`;
  const isDelete = action === "Delete";
  const isEdit = action === "Edit";

  const handlePrimary = () => {
    if (!user || !action) return;
    if (action === "Delete") {
      onUpdateUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
    if (action === "Edit") {
      onUpdateUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                profile: {
                  ...u.profile,
                  verificationStatus: "VERIFIED",
                },
              }
            : u,
        ),
      );
    }
    onClose();
  };

  const primaryLabel = isDelete
    ? "Remove from List"
    : isEdit
    ? "Mark as Verified (Demo)"
    : "Close";

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            View high-level details for this alumni account. Changes apply only to this session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2 text-sm">
          <div className="font-medium">
            {user.profile
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : user.email}
          </div>
          <div>
            <span className="font-medium">Email: </span>
            {user.email}
          </div>
          <div>
            <span className="font-medium">Department: </span>
            {user.profile?.department || "N/A"}
          </div>
          <div>
            <span className="font-medium">Graduation Year: </span>
            {user.profile?.graduationYear || "N/A"}
          </div>
          <div>
            <span className="font-medium">Verification Status: </span>
            {user.profile?.verificationStatus || "PENDING"}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePrimary}>{primaryLabel}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminEventActionDialog({
  event,
  action,
  onClose,
}: {
  event: Event | null;
  action: string | null;
  onClose: () => void;
}) {
  if (!event || !action) return null as any;

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action} Event</DialogTitle>
          <DialogDescription>
            Summary details for this event. Use the Events page for full event management.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2 text-sm">
          <div className="font-medium">{event.title}</div>
          <div>
            <span className="font-medium">Date: </span>
            {new Date(event.date).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Status: </span>
            {event.status}
          </div>
          <div>
            <span className="font-medium">Category: </span>
            {event.category}
          </div>
          <div>
            <span className="font-medium">Attendees: </span>
            {event.attendees}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
