import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import fs from "fs";
import path from "path";

const APPLICATIONS_FILE = path.join(process.cwd(), "src/data", "mentor_applications.json");

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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = loadApplications();

    if (user.role === "ADMIN") {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      let filtered = applications;
      if (status) {
        filtered = applications.filter((app) => app.status === status);
      }
      return NextResponse.json({ applications: filtered });
    }

    const userApplication = applications.find((app) => app.userId === user.id);
    return NextResponse.json({ application: userApplication || null });
  } catch (error) {
    console.error("Error fetching mentor applications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { experience, availability, areas, bio, firstName, lastName, jobTitle, company, graduationYear } = body;

    if (!experience || !availability || !areas || areas.length === 0 || !bio) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const applications = loadApplications();

    const existingApplication = applications.find(
      (app) => app.userId === user.id && app.status === "pending"
    );
    if (existingApplication) {
      return NextResponse.json({ error: "You already have a pending application" }, { status: 400 });
    }

    const newApplication = {
      id: "APP-" + Date.now(),
      userId: user.id,
      email: user.email,
      firstName: firstName || user.email.split("@")[0],
      lastName: lastName || "",
      jobTitle: jobTitle || "Mentor",
      company: company || "SLU Alumni",
      graduationYear: graduationYear || new Date().getFullYear(),
      experience,
      availability,
      areas,
      bio,
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null
    };

    applications.push(newApplication);
    saveApplications(applications);

    console.log("[MENTOR APPLICATION] New application from " + user.email);

    return NextResponse.json({
      message: "Application submitted successfully",
      application: newApplication
    }, { status: 201 });
  } catch (error) {
    console.error("Error submitting mentor application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = loadApplications();
    const appIndex = applications.findIndex((app) => app.userId === user.id);

    if (appIndex === -1) {
      return NextResponse.json({ error: "No application found" }, { status: 404 });
    }

    const application = applications[appIndex];
    
    // If approved, also remove from approved_mentors.json
    if (application.status === "approved") {
      const APPROVED_MENTORS_FILE = path.join(process.cwd(), "src/data", "approved_mentors.json");
      if (fs.existsSync(APPROVED_MENTORS_FILE)) {
        try {
          const mentors = JSON.parse(fs.readFileSync(APPROVED_MENTORS_FILE, "utf-8"));
          const filteredMentors = mentors.filter((m: any) => m.email !== user.email && m.id !== user.id);
          fs.writeFileSync(APPROVED_MENTORS_FILE, JSON.stringify(filteredMentors, null, 2), "utf-8");
          console.log("[MENTOR] Removed from approved mentors: " + user.email);
        } catch (e) {
          console.error("Error removing from approved mentors:", e);
        }
      }
    }

    applications.splice(appIndex, 1);
    saveApplications(applications);

    console.log("[MENTOR APPLICATION] Application deleted for: " + user.email);

    return NextResponse.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
