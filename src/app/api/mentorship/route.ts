import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { MentorshipDataService } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') || undefined;

    // Get mentors from real CSV data
    const mentors = MentorshipDataService.getMentorsByArea(area);

    return NextResponse.json({ mentors });
  } catch (error) {
    console.error("Mentorship API error:", error);
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
    const { mentorId, area, message } = body;

    if (!mentorId || !area) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production, this would create a mentorship request in the database/CSV
    const newMentorshipRequest = {
      id: `MEN${String(Date.now()).slice(-6)}`,
      mentorId,
      menteeId: user.id,
      area,
      message: message || "",
      status: "Requested",
      requestDate: new Date().toISOString().split('T')[0],
      frequency: 0,
      lastInteraction: "",
      rating: 0
    };

    return NextResponse.json({ 
      message: "Mentorship request sent successfully", 
      request: newMentorshipRequest 
    }, { status: 201 });
  } catch (error) {
    console.error("Mentorship request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
