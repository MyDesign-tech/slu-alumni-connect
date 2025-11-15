import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";

// Sample alumni data (shared with main directory route)
let alumni = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@email.com",
    graduationYear: 2015,
    program: "Computer Science",
    department: "STEM",
    currentEmployer: "Microsoft",
    jobTitle: "Senior Software Engineer",
    city: "Seattle",
    state: "WA",
    country: "USA",
    bio: "Passionate software engineer with expertise in cloud computing and distributed systems.",
    verificationStatus: "verified",
    lastActive: "2 days ago"
  },
  {
    id: "2",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@email.com",
    graduationYear: 2012,
    program: "Business Administration",
    department: "BUSINESS",
    currentEmployer: "Procter & Gamble",
    jobTitle: "Marketing Director",
    city: "Cincinnati",
    state: "OH",
    country: "USA",
    bio: "Marketing professional focused on digital transformation and brand strategy.",
    verificationStatus: "verified",
    lastActive: "1 week ago"
  },
  {
    id: "3",
    firstName: "Dr. Emily",
    lastName: "Rodriguez",
    email: "emily.rodriguez@email.com",
    graduationYear: 2008,
    program: "Medicine",
    department: "HEALTHCARE",
    currentEmployer: "BJC HealthCare",
    jobTitle: "Chief Medical Officer",
    city: "St. Louis",
    state: "MO",
    country: "USA",
    bio: "Healthcare leader committed to improving patient outcomes and medical education.",
    verificationStatus: "verified",
    lastActive: "3 days ago"
  }
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alumniProfile = alumni.find((a) => a.id === id);
    if (!alumniProfile) {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    return NextResponse.json({ alumni: alumniProfile });
  } catch (error) {
    console.error("Get alumni error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const alumniIndex = alumni.findIndex((a) => a.id === id);
    if (alumniIndex === -1) {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    const body = await request.json();
    const updatedAlumni = { ...alumni[alumniIndex], ...body };
    alumni[alumniIndex] = updatedAlumni;

    return NextResponse.json({ 
      message: "Alumni updated successfully", 
      alumni: updatedAlumni 
    });
  } catch (error) {
    console.error("Update alumni error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const alumniIndex = alumni.findIndex((a) => a.id === id);
    if (alumniIndex === -1) {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    const deletedAlumni = alumni[alumniIndex];
    alumni.splice(alumniIndex, 1);

    return NextResponse.json({ 
      message: "Alumni removed successfully",
      alumni: deletedAlumni
    });
  } catch (error) {
    console.error("Delete alumni error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
