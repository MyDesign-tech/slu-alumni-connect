import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { MentorshipDataService, AlumniDataService } from "@/lib/data-service";
import fs from "fs";
import path from "path";

const MENTORSHIP_REQUESTS_FILE = path.join(process.cwd(), "src/data", "mentorship_requests.json");

const loadMentorshipRequests = (): any[] => {
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

const saveMentorshipRequests = (requests: any[]) => {
  try {
    fs.writeFileSync(MENTORSHIP_REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf-8");
    console.log(`✅ Saved ${requests.length} mentorship requests`);
  } catch (error) {
    console.error("Error saving mentorship requests:", error);
  }
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area') || undefined;
    const type = searchParams.get('type');

    // Return all unique mentorship areas
    if (type === 'areas') {
      const areas = MentorshipDataService.getAllAreas();
      return NextResponse.json({ areas });
    }

    // Return user's mentorship requests (both as mentee and mentor)
    if (type === 'my-requests') {
      const allRequests = loadMentorshipRequests();
      
      // Requests where user is the mentee (requests I made)
      const myRequests = allRequests.filter(r => 
        r.menteeId === user.id || r.menteeEmail === user.email
      );
      
      // Requests where user is the mentor (requests to mentor me)
      const incomingRequests = allRequests.filter(r => 
        r.mentorId === user.id || r.mentorEmail === user.email
      );
      
      return NextResponse.json({ 
        myRequests, 
        incomingRequests,
        total: myRequests.length + incomingRequests.length
      });
    }

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
    const { mentorId, area, message, mentorEmail: providedMentorEmail, mentorName: providedMentorName } = body;

    if (!mentorId || !area) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use provided mentor info if available, otherwise look it up
    let mentorName = providedMentorName || "Mentor";
    let mentorEmail = providedMentorEmail || "";
    
    // If mentor name/email wasn't provided, try to look it up
    if (mentorName === "Mentor" || !mentorEmail) {
      // Try approved mentors first
      const APPROVED_MENTORS_FILE = path.join(process.cwd(), "src/data", "approved_mentors.json");
      try {
        if (fs.existsSync(APPROVED_MENTORS_FILE)) {
          const approvedMentors = JSON.parse(fs.readFileSync(APPROVED_MENTORS_FILE, "utf-8"));
          const mentor = approvedMentors.find((m: any) => m.id === mentorId || m.oddsId === mentorId);
          if (mentor) {
            mentorName = mentorName === "Mentor" ? `${mentor.firstName} ${mentor.lastName}` : mentorName;
            mentorEmail = mentorEmail || mentor.email || "";
          }
        }
      } catch (e) {
        console.error("Error loading approved mentors:", e);
      }
      
      // If still not found, try alumni data (CSV)
      if (mentorName === "Mentor" || !mentorEmail) {
        const alumni = AlumniDataService.getAll();
        const alumniMentor = alumni.find(a => a.id === mentorId || a.oddsId === mentorId);
        if (alumniMentor) {
          mentorName = mentorName === "Mentor" ? `${alumniMentor.firstName} ${alumniMentor.lastName}` : mentorName;
          mentorEmail = mentorEmail || alumniMentor.email || "";
        }
      }
    }

    // Get mentee info
    const menteeName = user.email?.split("@")[0] || "Student";
    
    // Get mentee full name from alumni data
    const alumni = AlumniDataService.getAll();
    const menteeAlumni = alumni.find(a => a.id === user.id || a.email === user.email);
    const menteeFullName = menteeAlumni 
      ? `${menteeAlumni.firstName} ${menteeAlumni.lastName}` 
      : menteeName;

    const newMentorshipRequest = {
      id: `MEN-${Date.now()}`,
      mentorId,
      mentorEmail,
      menteeId: user.id,
      menteeEmail: user.email,
      mentorName,
      menteeName: menteeFullName,
      area,
      message: message || "",
      status: "REQUESTED",  // Pending mentor approval
      requestDate: new Date().toISOString(),
      frequency: 0,
      lastInteraction: "",
      rating: 0
    };

    // Load existing requests and add new one
    const requests = loadMentorshipRequests();
    requests.push(newMentorshipRequest);
    saveMentorshipRequests(requests);

    console.log(`📨 [MENTORSHIP REQUEST] ${menteeFullName} requested mentorship from ${mentorName} in ${area}`);

    return NextResponse.json({
      message: "Mentorship request sent successfully",
      request: newMentorshipRequest
    }, { status: 201 });
  } catch (error) {
    console.error("Mentorship request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Mentor responds to mentorship request (accept/decline) OR Mentee rates mentor
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action, rating } = body;

    if (!requestId) {
      return NextResponse.json({ error: "Missing request ID" }, { status: 400 });
    }

    const requests = loadMentorshipRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const mentorshipRequest = requests[requestIndex];

    // Verify the user's role in this request
    const isMentor = mentorshipRequest.mentorId === user.id || 
                     mentorshipRequest.mentorEmail === user.email;
    const isMentee = mentorshipRequest.menteeId === user.id || 
                     mentorshipRequest.menteeEmail === user.email;
    const userIsAdmin = isAdmin(user);

    // Handle rating submission (only by mentee after completion or during active mentorship)
    if (rating !== undefined) {
      if (!isMentee && !userIsAdmin) {
        return NextResponse.json({ error: "Only the mentee can rate the mentor" }, { status: 403 });
      }
      
      if (mentorshipRequest.status !== "COMPLETED" && mentorshipRequest.status !== "ACTIVE") {
        return NextResponse.json({ error: "Can only rate completed or active mentorships" }, { status: 400 });
      }

      const ratingValue = Math.min(5, Math.max(1, parseFloat(rating)));
      requests[requestIndex].rating = ratingValue;
      requests[requestIndex].ratedAt = new Date().toISOString();
      
      saveMentorshipRequests(requests);

      // Update mentor's average rating in approved_mentors.json
      await updateMentorRating(mentorshipRequest.mentorId, mentorshipRequest.mentorEmail);

      console.log(`⭐ [RATING] ${mentorshipRequest.menteeName} rated ${mentorshipRequest.mentorName}: ${ratingValue}/5`);

      return NextResponse.json({
        message: "Rating submitted successfully",
        request: requests[requestIndex]
      });
    }

    // Handle action (accept/decline/complete)
    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    if (!["accept", "decline", "complete"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Authorization checks for actions
    if (action === "accept" || action === "decline") {
      if (!isMentor && !userIsAdmin) {
        return NextResponse.json({ error: "Only the mentor can accept or decline requests" }, { status: 403 });
      }
    }
    
    if (action === "complete") {
      if (!isMentor && !isMentee && !userIsAdmin) {
        return NextResponse.json({ error: "Only participants can complete the mentorship" }, { status: 403 });
      }
    }

    switch (action) {
      case "accept":
        requests[requestIndex].status = "ACTIVE";
        requests[requestIndex].startDate = new Date().toISOString();
        requests[requestIndex].lastInteraction = new Date().toISOString();
        console.log(`✅ [MENTORSHIP] ${mentorshipRequest.mentorName} accepted request from ${mentorshipRequest.menteeName}`);
        break;
      
      case "decline":
        requests[requestIndex].status = "DECLINED";
        console.log(`❌ [MENTORSHIP] ${mentorshipRequest.mentorName} declined request from ${mentorshipRequest.menteeName}`);
        break;
      
      case "complete":
        requests[requestIndex].status = "COMPLETED";
        requests[requestIndex].endDate = new Date().toISOString();
        console.log(`🎓 [MENTORSHIP] Mentorship completed between ${mentorshipRequest.mentorName} and ${mentorshipRequest.menteeName}`);
        break;
    }

    saveMentorshipRequests(requests);

    return NextResponse.json({
      message: `Mentorship request ${action}ed successfully`,
      request: requests[requestIndex]
    });
  } catch (error) {
    console.error("Mentorship response error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to update mentor's average rating
async function updateMentorRating(mentorId: string, mentorEmail: string) {
  try {
    const requests = loadMentorshipRequests();
    
    // Get all rated mentorships for this mentor
    const mentorRatings = requests
      .filter(r => (r.mentorId === mentorId || r.mentorEmail === mentorEmail) && r.rating > 0)
      .map(r => r.rating);
    
    if (mentorRatings.length === 0) return;
    
    const avgRating = mentorRatings.reduce((sum, r) => sum + r, 0) / mentorRatings.length;
    
    // Update in approved_mentors.json
    const APPROVED_MENTORS_FILE = path.join(process.cwd(), "src/data", "approved_mentors.json");
    if (fs.existsSync(APPROVED_MENTORS_FILE)) {
      const mentors = JSON.parse(fs.readFileSync(APPROVED_MENTORS_FILE, "utf-8"));
      const mentorIndex = mentors.findIndex((m: any) => m.id === mentorId || m.email === mentorEmail);
      if (mentorIndex !== -1) {
        mentors[mentorIndex].rating = parseFloat(avgRating.toFixed(1));
        mentors[mentorIndex].totalRatings = mentorRatings.length;
        fs.writeFileSync(APPROVED_MENTORS_FILE, JSON.stringify(mentors, null, 2), "utf-8");
        console.log(`📊 Updated ${mentors[mentorIndex].firstName}'s rating to ${avgRating.toFixed(1)} (${mentorRatings.length} ratings)`);
      }
    }
  } catch (error) {
    console.error("Error updating mentor rating:", error);
  }
}
