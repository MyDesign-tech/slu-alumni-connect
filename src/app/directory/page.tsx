"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { SendMessageDialog } from "@/components/messaging/send-message-dialog";
import { Users, Search, Filter, Grid, List, MapPin, Briefcase, GraduationCap, MessageCircle, UserPlus, Star, Settings, Edit, Trash2, Plus, Shield, Eye, Calendar, RefreshCw } from "lucide-react";

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

  // Fetch alumni data from API
  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/directory', {
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real CSV data loaded:', data.alumni?.length || 0, 'alumni');
        setAlumniProfiles(data.alumni || []);
      } else {
        console.error('❌ Failed to fetch alumni:', response.status, response.statusText);
        setAlumniProfiles([]); // No fallback - force real data only
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

  const handleConnect = async (alumni: AlumniProfile) => {
    if (connectedAlumniIds.includes(alumni.id)) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || 'user@slu.edu'
        },
        body: JSON.stringify({
          recipientEmail: alumni.email,
          type: 'connection_request',
          title:
            user?.profile
              ? `New connection request from ${user.profile.firstName} ${user.profile.lastName}`
              : `New connection request from ${user?.email || 'SLU Alumni'}`,
          message: `${user?.email || 'An alumni'} would like to connect with you on SLU Alumni Connect.`,
          relatedId: alumni.id
        })
      });

      if (!response.ok) {
        console.error('Connection error - API returned non-OK:', response.status);
        alert("Failed to send connection request. Please try again.");
        return;
      }

      setConnectedAlumniIds(prev => (
        prev.includes(alumni.id) ? prev : [...prev, alumni.id]
      ));
    } catch (error) {
      console.error('Connection error:', error);
      alert("Error sending connection request. Please try again.");
    }
  };

  const handleEdit = (alumni: AlumniProfile) => {
    setEditingAlumni(alumni);
  };

  const handleDelete = async (alumni: AlumniProfile) => {
    if (!confirm(`Are you sure you want to remove ${alumni.firstName} ${alumni.lastName} from the directory?`)) return;
    
    try {
      const response = await fetch(`/api/directory/${alumni.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user?.email || 'admin@slu.edu'
        }
      });
      
      if (response.ok) {
        alert(`${alumni.firstName} ${alumni.lastName} has been removed from the directory.`);
        fetchAlumni(); // Refresh the list
      } else {
        alert("Failed to remove alumni. Please try again.");
      }
    } catch (error) {
      console.error('Delete alumni error:', error);
      alert("Error removing alumni. Please try again.");
    }
  };

  const handleAddAlumni = () => {
    setIsAddAlumniOpen(true);
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
                  : "Connect with fellow SLU alumni across industries, locations, and graduation years. Build your professional network and discover new opportunities."
                }
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button onClick={handleAddAlumni}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alumni
                </Button>
                <Button variant="outline" onClick={handleDirectorySettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Directory Settings
                </Button>
              </div>
            )}
          </div>

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
                  {Array.from({length: 10}, (_, i) => 2024 - i).map(year => (
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
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    List
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAlumni(alumni)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(alumni)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(alumni)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <>
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
                          <Button
                            size="sm"
                            onClick={() => handleConnect(alumni)}
                            disabled={connectedAlumniIds.includes(alumni.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {connectedAlumniIds.includes(alumni.id) ? 'Request Sent' : 'Connect'}
                          </Button>
                        </>
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
              {/* View Alumni */}
              <Dialog
                open={!!selectedAlumni}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedAlumni(null);
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedAlumni?.firstName} {selectedAlumni?.lastName}
                    </DialogTitle>
                    <DialogDescription>
                      Alumni profile overview.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedAlumni && (
                    <div className="space-y-3 mt-2 text-sm">
                      <div className="font-medium">
                        Class of {selectedAlumni.graduationYear} • {selectedAlumni.program}
                      </div>
                      <div>
                        <span className="font-medium">Email: </span>
                        {selectedAlumni.email}
                      </div>
                      {selectedAlumni.currentEmployer && (
                        <div>
                          <span className="font-medium">Role: </span>
                          {selectedAlumni.jobTitle} at {selectedAlumni.currentEmployer}
                        </div>
                      )}
                      {selectedAlumni.city && (
                        <div>
                          <span className="font-medium">Location: </span>
                          {selectedAlumni.city}, {selectedAlumni.state}
                        </div>
                      )}
                      {selectedAlumni.bio && (
                        <div>
                          <span className="font-medium">Bio: </span>
                          <span className="text-muted-foreground">{selectedAlumni.bio}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Verification: </span>
                        {selectedAlumni.verificationStatus}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Edit Alumni */}
              <Dialog
                open={!!editingAlumni}
                onOpenChange={(open) => {
                  if (!open) {
                    setEditingAlumni(null);
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Alumni</DialogTitle>
                    <DialogDescription>
                      Update basic profile details. Changes are applied for this session and used for display only.
                    </DialogDescription>
                  </DialogHeader>
                  {editingAlumni && (
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">First Name</label>
                          <Input
                            value={editingAlumni.firstName}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, firstName: e.target.value } : prev)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Last Name</label>
                          <Input
                            value={editingAlumni.lastName}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, lastName: e.target.value } : prev)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Email</label>
                          <Input
                            type="email"
                            value={editingAlumni.email}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, email: e.target.value } : prev)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Graduation Year</label>
                          <Input
                            type="number"
                            value={editingAlumni.graduationYear}
                            onChange={(e) =>
                              setEditingAlumni(prev =>
                                prev
                                  ? { ...prev, graduationYear: parseInt(e.target.value) || prev.graduationYear }
                                  : prev
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Program</label>
                          <Input
                            value={editingAlumni.program}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, program: e.target.value } : prev)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Department</label>
                          <Input
                            value={editingAlumni.department}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, department: e.target.value } : prev)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Current Employer</label>
                          <Input
                            value={editingAlumni.currentEmployer || ""}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, currentEmployer: e.target.value } : prev)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Job Title</label>
                          <Input
                            value={editingAlumni.jobTitle || ""}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, jobTitle: e.target.value } : prev)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">City</label>
                          <Input
                            value={editingAlumni.city || ""}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, city: e.target.value } : prev)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">State</label>
                          <Input
                            value={editingAlumni.state || ""}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, state: e.target.value } : prev)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Country</label>
                          <Input
                            value={editingAlumni.country}
                            onChange={(e) =>
                              setEditingAlumni(prev => prev ? { ...prev, country: e.target.value } : prev)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Bio</label>
                        <textarea
                          className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                          rows={3}
                          value={editingAlumni.bio || ""}
                          onChange={(e) =>
                            setEditingAlumni(prev => prev ? { ...prev, bio: e.target.value } : prev)
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingAlumni(null)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!editingAlumni) return;
                            try {
                              const response = await fetch(`/api/directory/${editingAlumni.id}`, {
                                method: "PUT",
                                headers: {
                                  "Content-Type": "application/json",
                                  "x-user-email": user?.email || "admin@slu.edu",
                                },
                                body: JSON.stringify(editingAlumni),
                              });

                              if (!response.ok) {
                                console.warn("Update alumni not persisted in backing store (demo mode)");
                              }
                            } catch (error) {
                              console.error("Update alumni error:", error);
                            }

                            setAlumniProfiles(prev =>
                              prev.map(a => (a.id === editingAlumni.id ? editingAlumni : a))
                            );
                            setEditingAlumni(null);
                          }}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={isAddAlumniOpen} onOpenChange={setIsAddAlumniOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Alumni</DialogTitle>
                    <DialogDescription>
                      Quickly add a new alumni profile to the directory. This is a demo form and does not persist data yet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">First Name</label>
                        <Input placeholder="Enter first name" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Last Name</label>
                        <Input placeholder="Enter last name" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email</label>
                      <Input type="email" placeholder="name@email.com" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Graduation Year</label>
                        <Input type="number" placeholder="2020" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Program</label>
                        <Input placeholder="e.g. Computer Science" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Department</label>
                        <Input placeholder="e.g. STEM" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setIsAddAlumniOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsAddAlumniOpen(false)}>
                        Save (Demo)
                      </Button>
                    </div>
                  </div>
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
                    <div>
                      <label className="text-sm font-medium mb-1 block">Show Unverified Profiles</label>
                      <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                        <option value="all">Show all alumni</option>
                        <option value="verified-only">Show verified only</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Allow public directory access</label>
                      <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                        <option value="false">Admins & authenticated alumni only</option>
                        <option value="true">Public (demo)</option>
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
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
