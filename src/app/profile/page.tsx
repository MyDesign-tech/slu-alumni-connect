"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { User, MapPin, Briefcase, GraduationCap, Phone, Mail } from "lucide-react";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";

export default function ProfilePage() {
  const { user, isHydrated } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const [isEditing, setIsEditing] = useState(false);
  
  // Use actual user data or fallback to defaults
  const [profileData, setProfileData] = useState({
    firstName: user?.profile?.firstName || "John",
    lastName: user?.profile?.lastName || "Doe",
    email: user?.email || "john.doe@slu.edu",
    phone: "(555) 123-4567",
    graduationYear: user?.profile?.graduationYear?.toString() || "2020",
    program: user?.profile?.program || "Computer Science",
    department: user?.profile?.department || "STEM",
    currentEmployer: user?.profile?.currentEmployer || "Google",
    jobTitle: user?.profile?.jobTitle || "Software Engineer",
    city: user?.profile?.city || "San Francisco",
    state: user?.profile?.state || "CA",
    country: user?.profile?.country || "USA",
    bio: user?.profile?.bio || "Passionate software engineer with expertise in web development and cloud technologies.",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: Save to API
    console.log("Saving profile:", profileData);
    setIsEditing(false);
  };

  const profileCompleteness = 85; // Calculate based on filled fields

  return (
    <ProtectedRoute>
      <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                      {profileData.firstName[0]}{profileData.lastName[0]}
                    </div>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{profileData.firstName} {profileData.lastName}</h2>
                    {isAdmin ? (
                      <>
                        <p className="text-muted-foreground">System Administrator</p>
                        <p className="text-sm text-muted-foreground">Platform Management • Full Access</p>
                        <Badge className="mt-2 bg-red-100 text-red-800">Admin Account</Badge>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">{profileData.jobTitle} at {profileData.currentEmployer}</p>
                        <p className="text-sm text-muted-foreground">Class of {profileData.graduationYear} • {profileData.program}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {!isAdmin && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Profile Completeness</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${profileCompleteness}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{profileCompleteness}%</span>
                      </div>
                    </div>
                  )}
                  <Button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancel" : (isAdmin ? "Edit Admin Profile" : "Edit Profile")}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Completeness / Admin Stats */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {isAdmin ? "Platform Overview" : "Profile Completeness"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">1,247</div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">156</div>
                    <div className="text-sm text-muted-foreground">Active Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">$2.4M</div>
                    <div className="text-sm text-muted-foreground">Donations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">89</div>
                    <div className="text-sm text-muted-foreground">New This Month</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${profileCompleteness}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{profileCompleteness}%</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">85%</div>
                      <div className="text-sm text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">12</div>
                      <div className="text-sm text-muted-foreground">Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">5</div>
                      <div className="text-sm text-muted-foreground">Events</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">3</div>
                      <div className="text-sm text-muted-foreground">Mentorships</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name</label>
                    {isEditing ? (
                      <Input
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profileData.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    {isEditing ? (
                      <Input
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profileData.lastName}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{profileData.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  {isEditing ? (
                    <Input
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{profileData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md text-sm"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{profileData.bio}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Academic & Professional */}
            <div className="space-y-8">
              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Graduation Year</label>
                    {isEditing ? (
                      <Input
                        name="graduationYear"
                        value={profileData.graduationYear}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profileData.graduationYear}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Program</label>
                    {isEditing ? (
                      <Input
                        name="program"
                        value={profileData.program}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profileData.program}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <p className="text-sm text-muted-foreground">{profileData.department}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Current Employer</label>
                    {isEditing ? (
                      <Input
                        name="currentEmployer"
                        value={profileData.currentEmployer}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profileData.currentEmployer}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Job Title</label>
                    {isEditing ? (
                      <Input
                        name="jobTitle"
                        value={profileData.jobTitle}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profileData.jobTitle}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">City</label>
                      {isEditing ? (
                        <Input
                          name="city"
                          value={profileData.city}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profileData.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">State</label>
                      {isEditing ? (
                        <Input
                          name="state"
                          value={profileData.state}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{profileData.state}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Country</label>
                    {isEditing ? (
                      <Input
                        name="country"
                        value={profileData.country}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profileData.country}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave} size="lg">
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
}
