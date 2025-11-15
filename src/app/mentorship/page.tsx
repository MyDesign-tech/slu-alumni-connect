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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydratedAuthStore } from "@/hooks/use-auth-store";
import { Users, Star, Clock, MessageCircle, Calendar, Award, Target, TrendingUp, Settings, Edit, Trash2, Plus, Shield, RefreshCw } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
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
  area: string;
  status: "REQUESTED" | "ACTIVE" | "COMPLETED";
  startDate: string;
  lastInteraction: string;
  rating?: number;
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

const mentorshipGrowthData = [
  { month: "Jan", activeMentorships: 60, approvedMentors: 25 },
  { month: "Feb", activeMentorships: 72, approvedMentors: 30 },
  { month: "Mar", activeMentorships: 81, approvedMentors: 36 },
  { month: "Apr", activeMentorships: 95, approvedMentors: 42 },
  { month: "May", activeMentorships: 110, approvedMentors: 48 },
  { month: "Jun", activeMentorships: 125, approvedMentors: 54 },
  { month: "Jul", activeMentorships: 138, approvedMentors: 60 },
];

export default function MentorshipPage() {
  const { user, isHydrated } = useHydratedAuthStore();
  const isAdmin = user?.role === "ADMIN";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
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
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isProgramSettingsOpen, setIsProgramSettingsOpen] = useState(false);
  const [newMentorForm, setNewMentorForm] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    company: "",
    primaryArea: "",
    bio: "",
  });
  const [addMentorError, setAddMentorError] = useState<string | null>(null);
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

  // Sample mentors data
  const initialMentors: Mentor[] = [
    {
      id: "1",
      firstName: "Sarah",
      lastName: "Johnson",
      jobTitle: "Senior Software Engineer",
      company: "Google",
      graduationYear: 2018,
      expertise: ["Software Development", "Career Growth", "Technical Leadership"],
      rating: 4.9,
      totalMentees: 12,
      availability: "2-3 hours/week",
      bio: "Passionate about helping new graduates navigate their tech careers. Specialized in full-stack development and team leadership.",
      mentorshipAreas: ["CAREER_DEVELOPMENT", "TECHNICAL_SKILLS", "LEADERSHIP"]
    },
    {
      id: "2",
      firstName: "Michael",
      lastName: "Chen",
      jobTitle: "Management Consultant",
      company: "McKinsey & Company",
      graduationYear: 2017,
      expertise: ["Strategy Consulting", "Business Analysis", "Client Management"],
      rating: 4.8,
      totalMentees: 8,
      availability: "1-2 hours/week",
      bio: "Helping business students and young professionals break into consulting and develop strategic thinking skills.",
      mentorshipAreas: ["CAREER_DEVELOPMENT", "PROFESSIONAL_DEVELOPMENT", "NETWORKING"]
    },
    {
      id: "3",
      firstName: "Dr. Emily",
      lastName: "Rodriguez",
      jobTitle: "Chief Medical Officer",
      company: "Mayo Clinic",
      graduationYear: 2015,
      expertise: ["Healthcare Leadership", "Medical Research", "Healthcare Innovation"],
      rating: 5.0,
      totalMentees: 15,
      availability: "3-4 hours/week",
      bio: "Dedicated to mentoring the next generation of healthcare professionals and researchers.",
      mentorshipAreas: ["CAREER_DEVELOPMENT", "LEADERSHIP", "ACADEMIC_GUIDANCE"]
    },
    {
      id: "4",
      firstName: "Robert",
      lastName: "Martinez",
      jobTitle: "Startup Founder & CEO",
      company: "TechStart Inc.",
      graduationYear: 2016,
      expertise: ["Entrepreneurship", "Product Development", "Fundraising"],
      rating: 4.7,
      totalMentees: 6,
      availability: "2-3 hours/week",
      bio: "Serial entrepreneur passionate about helping others build successful startups and innovative products.",
      mentorshipAreas: ["ENTREPRENEURSHIP", "LEADERSHIP", "NETWORKING"]
    }
  ];

  const [mentors, setMentors] = useState<Mentor[]>(initialMentors);

  // Sample mentorship requests
  const initialMentorshipRequests: MentorshipRequest[] = [
    {
      id: "1",
      mentorName: "Sarah Johnson",
      area: "Technical Skills",
      status: "ACTIVE",
      startDate: "2024-10-15",
      lastInteraction: "2 days ago"
    },
    {
      id: "2",
      mentorName: "Michael Chen",
      area: "Career Development",
      status: "REQUESTED",
      startDate: "",
      lastInteraction: "Pending response"
    }
  ];

  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>(initialMentorshipRequests);

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = 
      mentor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesArea = !selectedArea || mentor.mentorshipAreas.includes(selectedArea);
    
    return matchesSearch && matchesArea;
  });

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

        // For students/alumni, take them straight to their requests
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
  const [pendingMentorIds, setPendingMentorIds] = useState<string[]>(
    initialMentors.slice(0, 3).map((m) => m.id)
  );
  const [approvalsHydrated, setApprovalsHydrated] = useState(false);

  // Ensure the correct default tab once auth state is hydrated
  useEffect(() => {
    if (!isHydrated) return;
    setActiveTab(prev => {
      if (isAdmin) {
        // If we were on a student-facing tab, switch to manage-mentorships
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
    const colors = {
      REQUESTED: "bg-yellow-100 text-yellow-800",
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleSaveNewMentor = () => {
    const { firstName, lastName, jobTitle, company, primaryArea, bio } = newMentorForm;

    if (!firstName.trim() || !lastName.trim() || !jobTitle.trim() || !company.trim() || !primaryArea) {
      setAddMentorError("Please fill in all required fields.");
      return;
    }

    const areaLabelMap: Record<string, string> = {
      CAREER_DEVELOPMENT: "Career Development",
      TECHNICAL_SKILLS: "Technical Skills",
      LEADERSHIP: "Leadership",
      ENTREPRENEURSHIP: "Entrepreneurship",
      NETWORKING: "Networking",
      ACADEMIC_GUIDANCE: "Academic Guidance",
    };

    const newMentor: Mentor = {
      id: `M-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      graduationYear: new Date().getFullYear(),
      expertise: [areaLabelMap[primaryArea] || "Mentorship"],
      rating: 0,
      totalMentees: 0,
      availability: "1-2 hours/week",
      bio: bio.trim(),
      mentorshipAreas: [primaryArea],
    };

    setMentors((prev) => [...prev, newMentor]);
    setPendingMentorIds((prev) => [...prev, newMentor.id]);
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

  const handleSubmitMentorApplication = () => {
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

    const newMentor: Mentor = {
      id: `APP-${Date.now()}`,
      firstName,
      lastName: lastName || "Mentor",
      jobTitle,
      company,
      graduationYear,
      expertise: mentorApplicationAreas,
      rating: 0,
      totalMentees: 0,
      availability: mentorApplicationAvailability,
      bio: mentorApplicationBio.trim(),
      mentorshipAreas,
    };

    setMentors((prev) => [...prev, newMentor]);
    setPendingMentorIds((prev) => [...prev, newMentor.id]);

    setMentorApplicationSubmitted(true);
    setMentorApplicationError(null);
    setMentorApplicationBio("");
  };

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
              <TabsTrigger value="find-mentors">Find Mentors</TabsTrigger>
              <TabsTrigger value="my-mentorships">My Mentorships</TabsTrigger>
              {!isAdmin && (
                <TabsTrigger value="become-mentor">Become a Mentor</TabsTrigger>
              )}
              {isAdmin && (
                <>
                  <TabsTrigger value="manage-mentorships">Manage Program</TabsTrigger>
                  <TabsTrigger value="mentor-approval">Mentor Approval</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="find-mentors" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search mentors by name, role, company, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 border border-input rounded-md bg-background"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                  >
                    <option value="">All mentorship areas</option>
                    <option value="CAREER_DEVELOPMENT">Career Development</option>
                    <option value="TECHNICAL_SKILLS">Technical Skills</option>
                    <option value="LEADERSHIP">Leadership</option>
                    <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                    <option value="NETWORKING">Networking</option>
                    <option value="ACADEMIC_GUIDANCE">Academic Guidance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
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
                        <span>{mentor.totalMentees} mentees</span>
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
            </TabsContent>

            <TabsContent value="my-mentorships" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mentorshipRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{request.mentorName}</CardTitle>
                          <CardDescription>{request.area}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {request.startDate
                          ? `Started ${new Date(request.startDate).toLocaleDateString()}`
                          : "Start date TBD"}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Last interaction: {request.lastInteraction || "Not yet"}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs font-medium uppercase tracking-wide">
                            Your rating
                          </span>
                          {typeof request.rating === "number" ? (
                            <div className="flex items-center gap-1">
                              {renderStars(request.rating)}
                              <span className="text-xs">{request.rating.toFixed(1)}/5</span>
                            </div>
                          ) : (
                            <span className="text-xs">Not rated yet</span>
                          )}
                        </div>
                        {request.status === "COMPLETED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRatingDialogRequest(request);
                              setRatingValue(request.rating || 0);
                            }}
                          >
                            {typeof request.rating === "number" ? "Update Rating" : "Rate Mentor"}
                          </Button>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMessageDialogMentor(request.mentorName)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setScheduleDialogMentor(request.mentorName)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </div>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRequest(request);
                              setEditingStatus(request.status);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {mentorshipRequests.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    You don't have any mentorship requests yet.
                  </p>
                )}
              </div>
            </TabsContent>

            {!isAdmin && (
              <TabsContent value="become-mentor" className="space-y-6 max-w-2xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Become a Mentor</CardTitle>
                    <CardDescription>
                      Share a bit about your experience and availability to apply as a mentor.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Mentorship areas you can support
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        {["Career Development", "Technical Skills", "Leadership", "Entrepreneurship", "Networking", "Academic Guidance"].map(
                          (label) => (
                            <label key={label} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={mentorApplicationAreas.includes(label)}
                                onChange={(e) => {
                                  setMentorApplicationAreas((prev) =>
                                    e.target.checked
                                      ? [...prev, label]
                                      : prev.filter((l) => l !== label)
                                  );
                                }}
                              />
                              <span>{label}</span>
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Short bio</label>
                      <textarea
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background resize-none"
                        rows={4}
                        placeholder="Describe your background and how you’d like to support mentees."
                        value={mentorApplicationBio}
                        onChange={(e) => setMentorApplicationBio(e.target.value)}
                      />
                    </div>

                    {mentorApplicationError && (
                      <p className="text-sm text-destructive">{mentorApplicationError}</p>
                    )}
                    {mentorApplicationSubmitted && (
                      <p className="text-sm text-green-600">
                        Your mentor application has been submitted and is pending admin review.
                      </p>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={handleSubmitMentorApplication}>
                        Submit Mentor Application
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {isAdmin && (
              <>
                <TabsContent value="manage-mentorships" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle>All Mentorship Requests</CardTitle>
                        <CardDescription>
                          View and update the status of mentorships in this demo environment.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {mentorshipRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                          >
                            <div>
                              <div className="font-medium">{request.mentorName}</div>
                              <div className="text-muted-foreground">
                                {request.area} • Last interaction: {request.lastInteraction}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingRequest(request);
                                  setEditingStatus(request.status);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                        {mentorshipRequests.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No mentorship requests in this demo yet.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Program Snapshot</CardTitle>
                        <CardDescription>
                          High-level metrics for the mentorship program.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Active mentors
                          </span>
                          <span>{mentors.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Active mentorships
                          </span>
                          <span>
                            {mentorshipRequests.filter((r) => r.status === "ACTIVE").length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Pending mentor applications
                          </span>
                          <span>{pendingMentorIds.length}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="mentor-approval" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Mentor Applications</CardTitle>
                      <CardDescription>
                        Approve or reject mentor profiles for this demo session.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mentors
                        .filter((m) => pendingMentorIds.includes(m.id))
                        .map((mentor) => (
                          <div
                            key={mentor.id}
                            className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                          >
                            <div>
                              <div className="font-medium">
                                {mentor.firstName} {mentor.lastName}
                              </div>
                              <div className="text-muted-foreground">
                                {mentor.jobTitle}
                                {mentor.company && ` at ${mentor.company}`}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {mentor.mentorshipAreas.map((area) => (
                                  <Badge key={area} variant="outline">
                                    {area.replace(/_/g, " ")}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewMentor(mentor)}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveMentor(mentor.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectMentor(mentor.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      {mentors.filter((m) => pendingMentorIds.includes(m.id)).length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          There are no pending mentor applications right now.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mentorship Growth</CardTitle>
                      <CardDescription>
                        Demo view of mentorships and approved mentors over time.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mentorshipGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="activeMentorships"
                            stroke="#2563eb"
                            name="Active Mentorships"
                          />
                          <Line
                            type="monotone"
                            dataKey="approvedMentors"
                            stroke="#16a34a"
                            name="Approved Mentors"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Program Settings</CardTitle>
                      <CardDescription>
                        Review the current mentorship program defaults for this demo session.
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
                    program.
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
                            className={`h-5 w-5 ${
                              i < ratingValue ? "text-yellow-400 fill-current" : "text-gray-300"
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
                      onClick={() => {
                        if (!ratingDialogRequest || ratingValue <= 0) return;
                        setMentorshipRequests((prev) =>
                          prev.map((r) =>
                            r.id === ratingDialogRequest.id ? { ...r, rating: ratingValue } : r
                          )
                        );
                        setRatingDialogRequest(null);
                        setRatingValue(0);
                      }}
                    >
                      Save Rating
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Request Mentorship Dialog */}
          {selectedMentor && (
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
                      <option value="CAREER_DEVELOPMENT">Career Development</option>
                      <option value="TECHNICAL_SKILLS">Technical Skills</option>
                      <option value="LEADERSHIP">Leadership</option>
                      <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                      <option value="NETWORKING">Networking</option>
                      <option value="ACADEMIC_GUIDANCE">Academic Guidance</option>
                    </select>
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
          )}

          {isAdmin && (
            <>
              <Dialog open={isAddMentorOpen} onOpenChange={setIsAddMentorOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Mentor</DialogTitle>
                    <DialogDescription>
                      Capture basic mentor details for this session. This demo form does not yet persist to the CSV.
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
                        <option value="CAREER_DEVELOPMENT">Career Development</option>
                        <option value="TECHNICAL_SKILLS">Technical Skills</option>
                        <option value="LEADERSHIP">Leadership</option>
                        <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                        <option value="NETWORKING">Networking</option>
                        <option value="ACADEMIC_GUIDANCE">Academic Guidance</option>
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
                      <Button variant="outline" onClick={() => setIsAddMentorOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveNewMentor}>
                        Save Mentor
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
                      Preview key details from the mentor's profile before approval.
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
          )}

          {/* My Mentorships Message Dialog */}
          {messageDialogMentor && (
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
                      Send (Demo)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* My Mentorships Schedule Dialog */}
          {scheduleDialogMentor && (
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
                      Send Request (Demo)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
