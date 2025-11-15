import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { EventsDataService, AlumniDataService } from "@/lib/data-service";
import { emailService } from "@/lib/email-service";

// In-memory events created during the current server session
let sessionEvents: any[] = [];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all events from real CSV data
    const csvEvents = EventsDataService.getAll();
    const events = [...csvEvents, ...sessionEvents];

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendEventAnnouncementEmail(event: any) {
  const alumni = AlumniDataService.getAll();
  const recipients = alumni.filter((a) => a.email && a.verificationStatus === "Verified");

  if (!recipients.length) {
    return;
  }

  const maxRecipients = 100;
  const limitedRecipients = recipients.slice(0, maxRecipients);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const eventUrl = `${baseUrl}/events`;

  const subject = `New SLU Alumni Event: ${event.title}`;

  const templates = limitedRecipients.map((alumni) => ({
    to: alumni.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003366;">New Alumni Event: ${event.title}</h1>
        <p>Hi ${alumni.firstName},</p>
        <p>A new alumni event has been scheduled and you are invited to join.</p>
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Date:</strong> ${event.date}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${event.time}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${event.location}</p>
          <p style="margin: 4px 0;"><strong>Type:</strong> ${event.type}</p>
        </div>
        <p>${event.description || "Visit the events page for full details and to RSVP."}</p>
        <a href="${eventUrl}" style="background-color: #003366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 12px;">
          View Events & RSVP
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">You are receiving this message because you are part of the SLU Alumni Connect community.</p>
      </div>
    `,
  }));

  const result = await emailService.sendBulkEmails(templates);
  console.log(`Event announcement emails sent: ${result.success} successful, ${result.failed} failed`);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { 
      title, 
      type, 
      date, 
      time, 
      location, 
      capacity, 
      description, 
      department,
      isVirtual
    } = body;

    if (!title || !type || !date || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In production, this would add to the database/CSV
    const newEvent = {
      id: `EVT${String(Date.now()).slice(-5)}`,
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
      budget: 0,
      createdDate: new Date().toISOString().split('T')[0]
    };

    // Store in-memory for the current server session so it appears in listings
    sessionEvents.push(newEvent);

    sendEventAnnouncementEmail(newEvent).catch((error) => {
      console.error("Bulk event email error:", error);
    });

    return NextResponse.json({ 
      message: "Event created successfully", 
      event: newEvent 
    }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
