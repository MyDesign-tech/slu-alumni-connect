import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { AlumniDataService } from "@/lib/data-service";
import { registeredUsers } from "@/lib/registered-users";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
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

    // Find existing alumni record by email or user ID
    const existingAlumni = AlumniDataService.getAll().find(
      a => a.email.toLowerCase() === email.toLowerCase() || a.id === user.id
    );

    const profileData = {
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || user.email,
      phone: phone || "",
      graduationYear: parseInt(graduationYear) || new Date().getFullYear(),
      program: program || "",
      department: department || "",
      currentEmployer: currentEmployer || "",
      jobTitle: jobTitle || "",
      city: city || "",
      state: state || "",
      country: country || "USA",
      bio: bio || "",
      lastActive: new Date().toISOString().split('T')[0],
      verificationStatus: "Verified",
      profileCompleteness: calculateProfileCompleteness(body)
    };

    let updatedAlumni;

    if (existingAlumni) {
      // Update existing record in data service
      updatedAlumni = AlumniDataService.update(existingAlumni.id, profileData);
    } else {
      // Create new alumni record for the user
      updatedAlumni = AlumniDataService.create({
        ...profileData,
        id: user.id || `ALUM-${Date.now()}`
      });
    }

    // Also update registered users if this user was newly registered
    const emailLower = email.toLowerCase();
    if (registeredUsers.has(emailLower)) {
      const existingUserData = registeredUsers.get(emailLower);
      if (existingUserData) {
        registeredUsers.set(emailLower, {
          ...existingUserData,
          user: {
            ...existingUserData.user,
            profile: {
              ...existingUserData.user.profile,
              firstName,
              lastName,
              phone,
              graduationYear: parseInt(graduationYear) || existingUserData.user.profile?.graduationYear,
              program: program || existingUserData.user.profile?.program,
              department: department || existingUserData.user.profile?.department,
              currentEmployer,
              jobTitle,
              city,
              state,
              country: country || "USA",
              bio,
              profileCompleteness: calculateProfileCompleteness(body)
            }
          }
        });
      }
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      alumni: updatedAlumni,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface ProfileFields {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  graduationYear?: string | number;
  program?: string;
  department?: string;
  currentEmployer?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  country?: string;
}

function calculateProfileCompleteness(profile: ProfileFields): number {
  const fields = {
    firstName: profile.firstName ? 5 : 0,
    lastName: profile.lastName ? 5 : 0,
    email: profile.email ? 5 : 0,
    phone: profile.phone ? 5 : 0,
    bio: profile.bio ? 5 : 0,
    graduationYear: profile.graduationYear ? 7 : 0,
    program: profile.program ? 7 : 0,
    department: profile.department ? 6 : 0,
    currentEmployer: profile.currentEmployer ? 10 : 0,
    jobTitle: profile.jobTitle ? 10 : 0,
    city: profile.city ? 5 : 0,
    state: profile.state ? 5 : 0,
    country: profile.country ? 5 : 0,
  };

  const totalScore = Object.values(fields).reduce((sum, value) => sum + value, 0);
  const maxScore = 80;
  return Math.min(100, Math.max(0, Math.round((totalScore / maxScore) * 100)));
}
