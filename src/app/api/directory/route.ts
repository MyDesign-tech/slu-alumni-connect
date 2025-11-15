import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { AlumniDataService } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const department = searchParams.get('department') || undefined;
    const graduationYear = searchParams.get('graduationYear') || undefined;
    const location = searchParams.get('location') || undefined;

    // Use data service for searching with real CSV data
    const filteredAlumni = AlumniDataService.search({
      search,
      department,
      graduationYear,
      location
    });

    return NextResponse.json({ alumni: filteredAlumni });
  } catch (error) {
    console.error("Directory API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      graduationYear, 
      program, 
      department,
      currentEmployer,
      jobTitle,
      city,
      state,
      country,
      bio
    } = body;

    if (!firstName || !lastName || !email || !graduationYear || !program || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production, this would add to the database/CSV
    const newAlumni = {
      id: `ALM${String(Date.now()).slice(-5)}`,
      firstName,
      lastName,
      email,
      graduationYear: parseInt(graduationYear),
      program,
      department,
      currentEmployer: currentEmployer || "",
      jobTitle: jobTitle || "",
      city: city || "",
      state: state || "",
      country: country || "USA",
      bio: bio || "",
      verificationStatus: "Pending",
      lastActive: "just added"
    };

    return NextResponse.json({ 
      message: "Alumni added successfully", 
      alumni: newAlumni 
    }, { status: 201 });
  } catch (error) {
    console.error("Add alumni error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
