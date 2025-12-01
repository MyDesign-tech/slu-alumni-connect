import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { AlumniDataService, MentorshipDataService } from "@/lib/data-service";
import fs from "fs";
import path from "path";

// Type definitions
interface Mentor {
  id: string;
  oddsId?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  company?: string;
  graduationYear?: number;
  areas?: string[];
  expertise?: string[];
  mentorshipAreas?: string[];
  bio?: string;
  maxMentees?: number;
  activeMentees?: number;
  totalMentees?: number;
  status?: string;
  approvedDate?: string;
  approvedAt?: string;
  availability?: string;
  rating?: number;
  applicationId?: string;
  source?: string;
}

interface MentorApplication {
  id?: string;
  oddsId?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  jobTitle?: string;
  company?: string;
  graduationYear?: number;
  areas?: string[];
  bio?: string;
  maxMentees?: number;
  status?: string;
  availability?: string;
  reviewedAt?: string;
}

interface MentorshipRequest {
  mentorId?: string;
  mentorEmail?: string;
  status?: string;
}

const APPROVED_MENTORS_FILE = path.join(process.cwd(), "src/data", "approved_mentors.json");
const APPLICATIONS_FILE = path.join(process.cwd(), "src/data", "mentor_applications.json");
const MENTORSHIP_REQUESTS_FILE = path.join(process.cwd(), "src/data", "mentorship_requests.json");

const loadApprovedMentors = (): Mentor[] => {
  try {
    if (fs.existsSync(APPROVED_MENTORS_FILE)) {
      const content = fs.readFileSync(APPROVED_MENTORS_FILE, "utf-8");
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("Error loading approved mentors:", error);
    return [];
  }
};

const saveApprovedMentors = (mentors: Mentor[]) => {
  try {
    fs.writeFileSync(APPROVED_MENTORS_FILE, JSON.stringify(mentors, null, 2), "utf-8");
    console.log(`✅ Saved ${mentors.length} approved mentors`);
  } catch (error) {
    console.error("Error saving approved mentors:", error);
  }
};

const loadApplications = (): MentorApplication[] => {
  try {
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const content = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("Error loading applications:", error);
    return [];
  }
};

// Load mentorship requests to calculate active mentees count
const loadMentorshipRequests = (): MentorshipRequest[] => {
  try {
    if (fs.existsSync(MENTORSHIP_REQUESTS_FILE)) {
      const content = fs.readFileSync(MENTORSHIP_REQUESTS_FILE, "utf-8");
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("Error loading mentorship requests:", error);
    return [];
  }
};

// Calculate mentee count for a mentor based on active/completed mentorship requests
const getMenteeCount = (mentorId: string, mentorEmail: string, requests: MentorshipRequest[]): number => {
  return requests.filter(req => 
    (req.mentorId === mentorId || req.mentorEmail === mentorEmail) &&
    (req.status === "ACTIVE" || req.status === "COMPLETED")
  ).length;
};

// GET - Fetch all approved mentors for "Find Mentors" tab
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get("area");

    // Load approved mentors from JSON (dynamically approved)
    const approvedMentors = loadApprovedMentors();

    // Also check applications for approved ones that might not be synced
    const applications = loadApplications();
    const approvedApps = applications.filter(app => app.status === "approved");

    // Merge approved applications into mentors list if not already present
    for (const app of approvedApps) {
      const exists = approvedMentors.some(m => m.userId === app.userId || m.id === app.userId);
      if (!exists) {
        const alumni = AlumniDataService.getAll();
        const alumniProfile = alumni.find(a => a.id === app.userId || a.email === app.email);
        
        const newMentor = {
          id: app.userId || `MENTOR-${Date.now()}`,
          oddsId: app.userId,
          firstName: app.firstName || alumniProfile?.firstName || app.email?.split("@")[0] || "Mentor",
          lastName: app.lastName || alumniProfile?.lastName || "",
          email: app.email,
          jobTitle: app.jobTitle || alumniProfile?.jobTitle || "Professional",
          company: app.company || alumniProfile?.currentEmployer || "SLU Alumni",
          graduationYear: app.graduationYear || alumniProfile?.graduationYear || 2020,
          expertise: app.areas || ["Career Development"],
          mentorshipAreas: app.areas || ["CAREER_DEVELOPMENT"],
          availability: app.availability || "2-3 hours/week",
          bio: app.bio || `Experienced professional ready to mentor.`,
          rating: 0,
          totalMentees: 0,
          status: "available",
          approvedAt: app.reviewedAt || new Date().toISOString(),
          applicationId: app.id
        };
        
        approvedMentors.push(newMentor);
      }
    }

    // Save updated list if we added any from applications
    if (approvedApps.length > 0 && approvedMentors.length > 0) {
      saveApprovedMentors(approvedMentors);
    }

    // ALWAYS include mentors from CSV data (existing mentors from seeded data)
    // This ensures the Find Mentors tab shows all mentors - both approved and CSV
    const csvMentors = MentorshipDataService.getMentorsByArea(undefined); // Get all CSV mentors
    if (csvMentors && csvMentors.length > 0) {
      // Transform CSV mentors to match expected format and add if not already in approved list
      for (const m of csvMentors) {
        const exists = approvedMentors.some(am => am.id === m.id || am.oddsId === m.id);
        if (!exists) {
          approvedMentors.push({
            id: m.id,
            oddsId: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            jobTitle: m.jobTitle || "Professional",
            company: m.company || "SLU Alumni",
            graduationYear: m.graduationYear || 2020,
            expertise: m.expertise || m.mentorshipAreas || ["Career Development"],
            mentorshipAreas: m.mentorshipAreas || m.expertise || ["CAREER_DEVELOPMENT"],
            availability: m.availability || "2-3 hours/week",
            bio: m.bio || "Experienced professional ready to mentor.",
            rating: m.rating || 4.5,
            totalMentees: m.totalMentees || 0,
            status: "available",
            source: "csv"
          });
        }
      }
    }

    console.log(`📋 [MENTORS API] Total mentors: ${approvedMentors.length} (approved + CSV)`);

    // Load mentorship requests to calculate dynamic mentee counts
    const mentorshipRequests = loadMentorshipRequests();

    // Filter by area if specified
    let filteredMentors = approvedMentors;
    if (area) {
      filteredMentors = approvedMentors.filter(m => 
        m.mentorshipAreas?.includes(area) || m.expertise?.includes(area)
      );
    }

    // Calculate dynamic mentee count for each mentor
    const mentorsWithDynamicCounts = filteredMentors.map(mentor => ({
      ...mentor,
      totalMentees: getMenteeCount(mentor.id || mentor.oddsId || '', mentor.email, mentorshipRequests)
    }));

    console.log(`📋 [MENTORS API] Returning ${mentorsWithDynamicCounts.length} mentors${area ? ` for area: ${area}` : ''}`);

    return NextResponse.json({ 
      mentors: mentorsWithDynamicCounts,
      total: mentorsWithDynamicCounts.length,
      source: "combined"
    });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add a new approved mentor (called when application is approved)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mentor } = body;

    if (!mentor) {
      return NextResponse.json({ error: "Mentor data required" }, { status: 400 });
    }

    const approvedMentors = loadApprovedMentors();
    
    // Check if already exists by email only (more reliable check)
    // Skip ID check for admin-added mentors since they have unique timestamp-based IDs
    if (mentor.email) {
      const existsByEmail = approvedMentors.some(m => m.email === mentor.email);
      if (existsByEmail) {
        return NextResponse.json({ error: "A mentor with this email already exists" }, { status: 400 });
      }
    }

    // Generate a unique ID with random suffix to avoid collisions
    const uniqueId = mentor.id || `MENTOR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newMentor = {
      id: uniqueId,
      oddsId: uniqueId,
      userId: mentor.userId || uniqueId,
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      email: mentor.email || `${mentor.firstName?.toLowerCase()}.${mentor.lastName?.toLowerCase()}${Date.now()}@slu.edu`,
      jobTitle: mentor.jobTitle || "Professional",
      company: mentor.company || "SLU Alumni",
      graduationYear: mentor.graduationYear || 2020,
      expertise: mentor.areas || mentor.expertise || ["Career Development"],
      mentorshipAreas: mentor.areas || mentor.mentorshipAreas || ["CAREER_DEVELOPMENT"],
      availability: mentor.availability || "2-3 hours/week",
      bio: mentor.bio || "Ready to mentor.",
      rating: 0,
      totalMentees: 0,
      status: "available",
      approvedAt: new Date().toISOString(),
      source: "admin-added"
    };

    approvedMentors.push(newMentor);
    saveApprovedMentors(approvedMentors);

    console.log(`✅ [MENTORS API] Added new mentor: ${newMentor.firstName} ${newMentor.lastName}`);

    return NextResponse.json({ 
      message: "Mentor added successfully",
      mentor: newMentor 
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding mentor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a mentor
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get("id");

    if (!mentorId) {
      return NextResponse.json({ error: "Mentor ID required" }, { status: 400 });
    }

    let approvedMentors = loadApprovedMentors();
    const initialCount = approvedMentors.length;
    
    approvedMentors = approvedMentors.filter(m => m.id !== mentorId && m.userId !== mentorId);
    
    if (approvedMentors.length === initialCount) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    saveApprovedMentors(approvedMentors);

    console.log(`🗑️ [MENTORS API] Removed mentor: ${mentorId}`);

    return NextResponse.json({ message: "Mentor removed successfully" });
  } catch (error) {
    console.error("Error removing mentor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
