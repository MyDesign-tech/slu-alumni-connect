"use client";

import { useState, useEffect, useMemo } from "react";
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
  const { user, isHydrated, updateUser } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const [isEditing, setIsEditing] = useState(false);

  // Use actual user data or fallback to empty strings
  const [profileData, setProfileData] = useState({
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    email: user?.email || "",
    phone: user?.profile?.phone || "",
    graduationYear: user?.profile?.graduationYear?.toString() || "",
    program: user?.profile?.program || "",
    department: user?.profile?.department || "",
    currentEmployer: user?.profile?.currentEmployer || "",
    jobTitle: user?.profile?.jobTitle || "",
    city: user?.profile?.city || "",
    state: user?.profile?.state || "",
    country: user?.profile?.country || "",
    bio: user?.profile?.bio || "",
  });

  const [stats, setStats] = useState({
    events: 0,
    mentorships: 0,
    connections: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/profile/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Update profileData when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user?.profile?.firstName || "",
        lastName: user?.profile?.lastName || "",
        email: user?.email || "",
        phone: user?.profile?.phone || "",
        graduationYear: user?.profile?.graduationYear?.toString() || "",
        program: user?.profile?.program || "",
        department: user?.profile?.department || "",
        currentEmployer: user?.profile?.currentEmployer || "",
        jobTitle: user?.profile?.jobTitle || "",
        city: user?.profile?.city || "",
        state: user?.profile?.state || "",
        country: user?.profile?.country || "",
        bio: user?.profile?.bio || "",
      });

      // Auto-enable edit mode if profile is incomplete (newly registered users)
      // We check for fields that are typically empty for new users but required for completeness
      if (!user.profile?.currentEmployer || !user.profile?.jobTitle || !user.profile?.city) {
        setIsEditing(true);
      }
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Update the auth store with new data
      if (user) {
        const updatedUser = {
          ...user,
          email: profileData.email,
          profile: {
            ...user.profile,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone,
            graduationYear: parseInt(profileData.graduationYear) || 2020,
            program: profileData.program,
            department: profileData.department,
            currentEmployer: profileData.currentEmployer,
            jobTitle: profileData.jobTitle,
            city: profileData.city,
            state: profileData.state,
            country: profileData.country,
            bio: profileData.bio,
          }
        };

        // Update the global auth store
        updateUser(updatedUser);

        // TODO: Also save to API
        const response = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
        });

        if (response.ok) {
          console.log("Profile saved successfully");
        }
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  // Calculate profile completeness dynamically with useMemo
  const profileCompleteness = useMemo(() => {
    const fields = {
      // Personal Information (25 points)
      firstName: profileData.firstName ? 5 : 0,
      lastName: profileData.lastName ? 5 : 0,
      email: profileData.email ? 5 : 0,
      phone: profileData.phone ? 5 : 0,
      bio: profileData.bio ? 5 : 0,

      // Academic Information (20 points)
      graduationYear: profileData.graduationYear ? 7 : 0,
      program: profileData.program ? 7 : 0,
      department: profileData.department ? 6 : 0,

      // Professional Information (20 points)
      currentEmployer: profileData.currentEmployer ? 10 : 0,
      jobTitle: profileData.jobTitle ? 10 : 0,

      // Location Information (15 points)
      city: profileData.city ? 5 : 0,
      state: profileData.state ? 5 : 0,
      country: profileData.country ? 5 : 0,
    };

    const totalScore = Object.values(fields).reduce((sum, value) => sum + value, 0);
    const maxScore = 80; // Total possible points

    // Calculate percentage and ensure it's between 0 and 100
    const percentage = Math.round((totalScore / maxScore) * 100);
    return Math.min(100, Math.max(0, percentage));
  }, [profileData]);

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
                        <div className="text-2xl font-bold text-primary">{profileCompleteness}%</div>
                        <div className="text-sm text-muted-foreground">Complete</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary">{stats.connections}</div>
                        <div className="text-sm text-muted-foreground">Connections</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">{stats.events}</div>
                        <div className="text-sm text-muted-foreground">Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{stats.mentorships}</div>
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
