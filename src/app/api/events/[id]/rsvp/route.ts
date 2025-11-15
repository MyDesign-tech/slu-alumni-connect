import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { RSVPDataService, EventsDataService, AlumniDataService } from "@/lib/data-service";

// In-memory RSVPs created during the current server session
let sessionRSVPs: any[] = [];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { guestCount, specialRequirements } = body;

    // Check if event exists (from CSV). In this demo, some events may be
    // created in memory only, so we don't hard-fail if it's missing.
    const event = EventsDataService.getById(eventId);
    if (!event) {
      console.warn(`Event ${eventId} not found in CSV; allowing RSVP in demo without strict validation.`);
    }

    // Check if user already has RSVP
    const existingRSVPs = RSVPDataService.getByEvent(eventId);
    const userRSVP = existingRSVPs.find(rsvp => rsvp.alumniId === user.id);
    
    if (userRSVP) {
      console.warn(`Duplicate RSVP detected for user ${user.id} and event ${eventId}, allowing in demo.`);
    }

    // Check capacity using the event's current registered count from CSV when
    // available. If the event was created only in-memory, we fall back to a
    // very high capacity so RSVPs are not blocked in the demo.
    const safeGuestCount = typeof guestCount === "number" ? guestCount : parseInt(guestCount) || 0;
    const totalGuests = safeGuestCount + 1; // Include the user
    const currentAttendees = event?.registered || 0;
    const capacity = event?.capacity ?? currentAttendees + totalGuests + 1000;

    if (currentAttendees + totalGuests > capacity) {
      console.warn(`RSVP exceeds capacity for event ${eventId} in demo, allowing anyway.`);
    }

    // In production, this would save to database/CSV
    const rsvp = {
      id: `RSV${String(Date.now()).slice(-6)}`,
      eventId: eventId,
      alumniId: user.id,
      rsvpDate: new Date().toISOString().split('T')[0],
      status: "Confirmed",
      guestCount: safeGuestCount,
      attended: false,
      checkInTime: "",
      specialRequirements: specialRequirements || ""
    };

    // Store in-memory so admins can see new RSVPs during this server session
    const profile: any = (user as any).profile || {};
    const alumniName = profile.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`.trim()
      : user.email;

    sessionRSVPs.push({
      ...rsvp,
      alumniEmail: user.email,
      alumniName,
      eventTitle: event?.title ?? ""
    });

    return NextResponse.json({
      message: "RSVP confirmed successfully",
      rsvp,
    });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;

    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // RSVPs from CSV
    const csvRsvps = RSVPDataService.getByEvent(eventId);
    const csvWithAlumni = csvRsvps.map((rsvp) => {
      const alumni = AlumniDataService.getById(rsvp.alumniId);
      return {
        ...rsvp,
        alumniEmail: alumni?.email || null,
        alumniName: alumni ? `${alumni.firstName} ${alumni.lastName}` : null,
      };
    });

    // RSVPs created in this session via the POST handler
    const sessionForEvent = sessionRSVPs.filter((r) => r.eventId === eventId);

    return NextResponse.json({
      rsvps: [...csvWithAlumni, ...sessionForEvent],
    });
  } catch (error) {
    console.error("Get RSVPs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
