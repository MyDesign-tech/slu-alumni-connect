import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import fs from "fs";
import path from "path";

const APPLICATIONS_FILE = path.join(process.cwd(), "src/data", "mentor_applications.json");
const APPROVED_MENTORS_FILE = path.join(process.cwd(), "src/data", "approved_mentors.json");

const loadApplications = (): any[] => {
  try {
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const content = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("Error loading mentor applications:", error);
    return [];
  }
};

const saveApplications = (applications: any[]) => {
  try {
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2), "utf-8");
    console.log("Saved " + applications.length + " mentor applications");
  } catch (error) {
    console.error("Error saving mentor applications:", error);
  }
};

const loadApprovedMentors = (): any[] => {
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

const saveApprovedMentors = (mentors: any[]) => {
  try {
    fs.writeFileSync(APPROVED_MENTORS_FILE, JSON.stringify(mentors, null, 2), "utf-8");
    console.log(`✅ Saved ${mentors.length} approved mentors`);
  } catch (error) {
    console.error("Error saving approved mentors:", error);
  }
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { applicationId, action, reason } = body;

    if (!applicationId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const applications = loadApplications();
    const appIndex = applications.findIndex((app) => app.id === applicationId);

    if (appIndex === -1) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = applications[appIndex];

    if (application.status !== "pending") {
      return NextResponse.json({ error: "Application already processed" }, { status: 400 });
    }

    if (action === "approve") {
      applications[appIndex] = {
        ...application,
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id
      };

      // Add to approved mentors list
      const approvedMentors = loadApprovedMentors();
      const newMentor = {
        id: application.userId || `MENTOR-${Date.now()}`,
        oddsId: application.userId,
        firstName: application.firstName || application.email?.split("@")[0] || "Mentor",
        lastName: application.lastName || "",
        email: application.email,
        jobTitle: application.jobTitle || "Professional",
        company: application.company || "SLU Alumni",
        graduationYear: application.graduationYear || 2020,
        expertise: application.areas || ["Career Development"],
        mentorshipAreas: application.areas || ["CAREER_DEVELOPMENT"],
        availability: application.availability || "2-3 hours/week",
        bio: application.bio || "Ready to mentor.",
        rating: 0,
        totalMentees: 0,
        status: "available",
        approvedAt: new Date().toISOString(),
        applicationId: application.id
      };
      
      // Check if already exists
      const exists = approvedMentors.some(m => m.id === newMentor.id || m.email === newMentor.email);
      if (!exists) {
        approvedMentors.push(newMentor);
        saveApprovedMentors(approvedMentors);
      }

      saveApplications(applications);

      console.log("[MENTOR APPROVE] Application " + applicationId + " approved - Added to mentors list");

      return NextResponse.json({
        message: "Mentor application approved",
        application: applications[appIndex],
        mentor: newMentor
      });
    } else {
      applications[appIndex] = {
        ...application,
        status: "rejected",
        rejectionReason: reason || "Application did not meet requirements",
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id
      };

      saveApplications(applications);

      console.log("[MENTOR REJECT] Application " + applicationId + " rejected");

      return NextResponse.json({
        message: "Mentor application rejected",
        application: applications[appIndex]
      });
    }
  } catch (error) {
    console.error("Error processing mentor application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const applications = loadApplications();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const filtered = status === "all"
      ? applications
      : applications.filter((app) => app.status === status);

    return NextResponse.json({
      applications: filtered,
      counts: {
        pending: applications.filter((a) => a.status === "pending").length,
        approved: applications.filter((a) => a.status === "approved").length,
        rejected: applications.filter((a) => a.status === "rejected").length
      }
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
