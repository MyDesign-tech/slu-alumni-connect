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

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Missing required fields: firstName, lastName, email" }, { status: 400 });
    }

    console.log(`➕ [API POST] Creating new alumni: ${firstName} ${lastName}`);

    // Create alumni using data service (will persist to file)
    const newAlumni = AlumniDataService.create({
      firstName,
      lastName,
      email,
      phone: '',
      graduationYear: parseInt(graduationYear) || new Date().getFullYear(),
      program: program || 'General',
      department: department || 'OTHER',
      currentEmployer: currentEmployer || '',
      jobTitle: jobTitle || '',
      employmentStatus: 'Unknown',
      city: city || '',
      state: state || '',
      country: country || 'USA',
      bio: bio || '',
      profileCompleteness: 40
    });

    console.log(`✅ [API POST] Alumni created: ${newAlumni.id}`);

    return NextResponse.json({
      message: "Alumni added successfully",
      alumni: newAlumni
    }, { status: 201 });
  } catch (error) {
    console.error("❌ [API POST] Add alumni error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
