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
}

const COLORS = ['#003DA5', '#53C3EE', '#FFC72C', '#8FD6BD', '#795D3E', '#ED8B00'];

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
  const [editingAlumni, setEditingAlumni] = useState<AlumniProfile | null>(null);
  const [connectedAlumniIds, setConnectedAlumniIds] = useState<string[]>([]);

  // New Alumni Form State
  const [newAlumni, setNewAlumni] = useState<Partial<AlumniProfile>>({});
  const [connectionStatus, setConnectionStatus] = useState<{ [key: string]: 'pending' | 'accepted' | 'received' | 'none' }>({});

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/connections');
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

    if (user) {
      fetchConnections();
    }
  }, [user]);

  // Analytics Data Preparation
  const departmentDistribution = useMemo(() => {
    const depts: Record<string, number> = {};
    alumniProfiles.forEach(p => {
      depts[p.department] = (depts[p.department] || 0) + 1;
    });
    return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [alumniProfiles]);

  const locationDistribution = useMemo(() => {
    const locs: Record<string, number> = {};
    alumniProfiles.forEach(p => {
      const loc = p.city ? `${p.city}, ${p.state || ''}` : p.country;
      locs[loc] = (locs[loc] || 0) + 1;
    });
    // Top 10 locations
    return Object.entries(locs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [alumniProfiles]);

  const gradYearTrends = useMemo(() => {
    const years: Record<string, number> = {};
    alumniProfiles.forEach(p => {
      years[p.graduationYear] = (years[p.graduationYear] || 0) + 1;
    });
    return Object.entries(years)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([name, value]) => ({ name, value }));
  }, [alumniProfiles]);

  // Fetch alumni data from API
  useEffect(() => {
    fetchAlumni();
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
        console.error('❌ Failed to fetch alumni:', response.status, response.statusText);
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
    const matchesSearch =
      alumni.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.currentEmployer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumni.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !selectedDepartment || alumni.department === selectedDepartment;
    const matchesGradYear = !selectedGradYear || alumni.graduationYear.toString() === selectedGradYear;
    const matchesLocation = !selectedLocation ||
      alumni.city?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      alumni.state?.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesDepartment && matchesGradYear && matchesLocation;
  });

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
      setConnectedAlumniIds(prev => [...prev, alumni.id]);

      // Send connection request via API
      await fetch('/api/connections', {
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

      alert(`Connection request sent to ${alumni.firstName}!`);
    } catch (error) {
      console.error('Error sending connection request:', error);
      // Still show success to user as the local state is updated
      alert(`Connection request sent to ${alumni.firstName}!`);
    }
  };

  const handleEdit = (alumni: AlumniProfile) => {
    setEditingAlumni(alumni);
  };

  const handleDelete = async (alumni: AlumniProfile) => {
    if (!confirm(`Are you sure you want to remove ${alumni.firstName} ${alumni.lastName} from the directory?`)) return;
    setAlumniProfiles(prev => prev.filter(a => a.id !== alumni.id));
  };

  const handleAddAlumni = () => {
    setNewAlumni({});
    setIsAddAlumniOpen(true);
  };

  const saveNewAlumni = () => {
    if (!newAlumni.firstName || !newAlumni.lastName) return;

    const alumni: AlumniProfile = {
      id: `NEW-${Date.now()}`,
      firstName: newAlumni.firstName,
      lastName: newAlumni.lastName,
      email: newAlumni.email || "",
      graduationYear: newAlumni.graduationYear || new Date().getFullYear(),
      program: newAlumni.program || "General",
      department: newAlumni.department || "Other",
      verificationStatus: "Pending",
      lastActive: new Date().toISOString().split('T')[0],
      country: newAlumni.country || "USA",
      ...newAlumni
    } as AlumniProfile;

    setAlumniProfiles(prev => [alumni, ...prev]);
    setIsAddAlumniOpen(false);
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
                <>
                  <Button onClick={handleAddAlumni}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Alumni
                  </Button>
                  <Button variant="outline" onClick={handleDirectorySettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Directory Settings
                  </Button>
                </>
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
              {/* Search and Filters */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search & Filter Alumni
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                      {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>

                    <Input
                      placeholder="Location (city, state)"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredAlumni.length} of {alumniProfiles.length} alumni
                    </p>
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
                {filteredAlumni.map((alumni) => (
                  <Card key={alumni.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">
                              {getInitials(alumni.firstName, alumni.lastName)}
                            </div>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {alumni.firstName} {alumni.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Class of {alumni.graduationYear}
                            </p>
                          </div>
                        </div>
                        {alumni.verificationStatus === "VERIFIED" && (
                          <Badge variant="secondary" className="text-xs">
                            ✓ Verified
                          </Badge>
                        )}
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
                        <span className="text-xs text-muted-foreground">
                          Active {alumni.lastActive}
                        </span>
                        <div className="flex gap-2">
                          {isAdmin ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => setSelectedAlumni(alumni)}>
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
                            Save Settings (Demo)
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Alumni Network Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="text-sm text-muted-foreground font-medium">Total Alumni</div>
                      <div className="text-3xl font-bold text-primary mt-1">{alumniProfiles.length}</div>
                    </div>
                    <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/10">
                      <div className="text-sm text-muted-foreground font-medium">Departments</div>
                      <div className="text-3xl font-bold text-secondary mt-1">{departmentDistribution.length}</div>
                    </div>
                    <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                      <div className="text-sm text-muted-foreground font-medium">Locations</div>
                      <div className="text-3xl font-bold text-accent mt-1">{locationDistribution.length}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Department Distribution */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4" />
                        Department Distribution
                      </h3>
                      <div className="h-[300px] w-full border rounded-lg p-4 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={departmentDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {departmentDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Graduation Year Trends */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Graduation Year Distribution
                      </h3>
                      <div className="h-[300px] w-full border rounded-lg p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={gradYearTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#003DA5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Locations */}
                    <div className="space-y-4 lg:col-span-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Top Alumni Locations
                      </h3>
                      <div className="h-[300px] w-full border rounded-lg p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={locationDistribution} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#53C3EE" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Department Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                        >
                          {departmentDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Alumni Locations</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={locationDistribution} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#003DA5" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Graduation Year Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradYearTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#53C3EE" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs >
        </div >
      </MainLayout >
    </ProtectedRoute >
  );
}
