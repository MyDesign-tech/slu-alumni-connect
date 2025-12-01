import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { RSVPDataService, EventsDataService, AlumniDataService } from "@/lib/data-service";
import fs from "fs";
import path from "path";

const RSVP_PATH = path.join(process.cwd(), "src", "data", "session_rsvps.json");
const EVENTS_PATH = path.join(process.cwd(), "src", "data", "session_events.json");

function loadPersistedRSVPs(): any[] {
  try { 
    if (fs.existsSync(RSVP_PATH)) {
      return JSON.parse(fs.readFileSync(RSVP_PATH, "utf-8")) || []; 
    }
  } catch(e) {
    console.error("Failed to load RSVPs:", e);
  }
  return [];
}

function saveRSVPsToFile(rsvps: any[]) {
  try { 
    fs.writeFileSync(RSVP_PATH, JSON.stringify(rsvps, null, 2), "utf-8"); 
  } catch(e) { 
    console.error("Failed to save RSVPs:", e); 
  }
}

function loadPersistedEvents(): any[] {
  try { 
    if (fs.existsSync(EVENTS_PATH)) {
      return JSON.parse(fs.readFileSync(EVENTS_PATH, "utf-8")) || []; 
    }
  } catch(e) {}
  return [];
}

function getEventById(eventId: string): any {
  const csvEvent = EventsDataService.getById(eventId);
  if (csvEvent) return csvEvent;
  const persistedEvents = loadPersistedEvents();
  return persistedEvents.find((e: any) => e.id === eventId) || null;
}

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
    let { guestCount, specialRequirements } = body;

    const event = getEventById(eventId);
    if (!event) {
      console.warn(`Event ${eventId} not found; allowing RSVP in demo mode.`);
    }

    const persistedRSVPs = loadPersistedRSVPs();
    
    const existingCSVRsvp = RSVPDataService.getByEvent(eventId).find(rsvp => rsvp.alumniId === user.id);
    const existingPersistedRsvp = persistedRSVPs.find(r => r.eventId === eventId && r.alumniId === user.id);
    
    if (existingCSVRsvp || existingPersistedRsvp) {
      return NextResponse.json({ error: "You have already RSVP'd to this event" }, { status: 400 });
    }

    if (event && event.allowGuests === false) {
      guestCount = 0;
    }

    const safeGuestCount = typeof guestCount === "number" ? guestCount : parseInt(guestCount) || 0;

    const profile: any = (user as any).profile || {};
    const alumniName = profile.firstName
      ? `${profile.firstName} ${profile.lastName || ""}`.trim()
      : user.email;

    const rsvp = {
      id: `RSV${String(Date.now()).slice(-6)}`,
      eventId: eventId,
      alumniId: user.id,
      alumniEmail: user.email,
      alumniName,
      rsvpDate: new Date().toISOString().split('T')[0],
      status: "Confirmed",
      guestCount: safeGuestCount,
      attended: false,
      checkInTime: "",
      specialRequirements: specialRequirements || "",
      eventTitle: event?.title ?? ""
    };

    persistedRSVPs.push(rsvp);
    saveRSVPsToFile(persistedRSVPs);

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

    const csvRsvps = RSVPDataService.getByEvent(eventId);
    const csvWithAlumni = csvRsvps.map((rsvp) => {
      const alumni = AlumniDataService.getById(rsvp.alumniId);
      return {
        ...rsvp,
        alumniEmail: alumni?.email || null,
        alumniName: alumni ? `${alumni.firstName} ${alumni.lastName}` : null,
      };
    });

    const persistedRSVPs = loadPersistedRSVPs().filter((r) => r.eventId === eventId);

    return NextResponse.json({
      rsvps: [...csvWithAlumni, ...persistedRSVPs],
    });
  } catch (error) {
    console.error("Get RSVPs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}