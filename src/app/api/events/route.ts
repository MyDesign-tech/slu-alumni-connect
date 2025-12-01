import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { EventsDataService, AlumniDataService } from "@/lib/data-service";
import { emailService } from "@/lib/email-service";
import fs from "fs";
import path from "path";

const EVENTS_PATH = path.join(process.cwd(), "src", "data", "session_events.json");
const RSVP_PATH = path.join(process.cwd(), "src", "data", "session_rsvps.json");
const DELETED_PATH = path.join(process.cwd(), "src", "data", "deleted_events.json");

function loadPersistedEvents(): any[] {
  try { if (fs.existsSync(EVENTS_PATH)) return JSON.parse(fs.readFileSync(EVENTS_PATH, "utf-8")) || []; } catch(e) {}
  return [];
}

function saveEventsToFile(events: any[]) {
  try { fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2), "utf-8"); } catch(e) {}
}

function loadPersistedRSVPs(): any[] {
  try { if (fs.existsSync(RSVP_PATH)) return JSON.parse(fs.readFileSync(RSVP_PATH, "utf-8")) || []; } catch(e) {}
  return [];
}

function loadDeletedEventIds(): string[] {
  try { if (fs.existsSync(DELETED_PATH)) return JSON.parse(fs.readFileSync(DELETED_PATH, "utf-8")) || []; } catch(e) {}
  return [];
}

function saveDeletedEventIds(ids: string[]) {
  try { fs.writeFileSync(DELETED_PATH, JSON.stringify(ids, null, 2), "utf-8"); } catch(e) {}
}

function getDynamicRegisteredCount(eventId: string, baseRegistered: number): number {
  const rsvps = loadPersistedRSVPs().filter((r: any) => r.eventId === eventId && r.status === "Confirmed");
  return baseRegistered + rsvps.reduce((total: number, r: any) => total + 1 + (parseInt(r.guestCount) || 0), 0);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const csvEvents = EventsDataService.getAll();
    const persistedEvents = loadPersistedEvents();
    const deletedIds = loadDeletedEventIds();
    
    // Combine CSV and persisted events, removing duplicates by ID
    const eventMap = new Map();
    [...csvEvents, ...persistedEvents].forEach(e => {
      if (!deletedIds.includes(e.id)) {
        eventMap.set(e.id, e);
      }
    });
    
    const allEventsRaw = Array.from(eventMap.values());
    const allEvents = allEventsRaw.map(event => ({
      ...event,
      registered: getDynamicRegisteredCount(event.id, event.registered || 0)
    }));

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcomingEvents = allEvents.filter(e => { const d = new Date(e.date); d.setHours(0,0,0,0); return d >= now; }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastEvents = allEvents.filter(e => { const d = new Date(e.date); d.setHours(0,0,0,0); return d < now; }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json({ events: [...upcomingEvents, ...pastEvents] });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendEventAnnouncementEmail(event: any) {
  const alumni = AlumniDataService.getAll();
  const recipients = alumni.filter((a) => a.email && a.verificationStatus === "Verified");
  if (!recipients.length) return;
  const limitedRecipients = recipients.slice(0, 100);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const templates = limitedRecipients.map((a) => ({ to: a.email, subject: "New SLU Alumni Event: " + event.title, html: "<div><h1>" + event.title + "</h1><p>Date: " + event.date + "</p><p>Location: " + event.location + "</p></div>" }));
  await emailService.sendBulkEmails(templates);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    const body = await request.json();
    const { title, type, date, time, location, capacity, description, department, isVirtual, allowGuests } = body;
    if (!title || !type || !date || !location) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    
    const newEvent = { 
      id: "EVT" + String(Date.now()).slice(-5), 
      title, 
      type, 
      date, 
      time: time || "TBD", 
      location, 
      capacity: parseInt(capacity) || 100, 
      registered: 0, 
      status: "Planned", 
      description: description || "", 
      department: department || "General", 
      isVirtual: isVirtual || false,
      allowGuests: allowGuests !== false,
      budget: 0, 
      createdDate: new Date().toISOString().split("T")[0] 
    };
    
    // Only persist to file, not in-memory (to avoid duplicates)
    const persistedEvents = loadPersistedEvents();
    persistedEvents.push(newEvent);
    saveEventsToFile(persistedEvents);
    
    sendEventAnnouncementEmail(newEvent).catch(console.error);
    return NextResponse.json({ message: "Event created successfully", event: newEvent }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
