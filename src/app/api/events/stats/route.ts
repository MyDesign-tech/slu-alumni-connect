import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { EventsDataService, RSVPDataService } from "@/lib/data-service";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const events = EventsDataService.getAll();
    const rsvps = RSVPDataService.getAll();

    const eventMap = new Map<string, any>();

    events.forEach((event: any) => {
      eventMap.set(event.id, {
        id: event.id,
        title: event.title,
        date: event.date,
        capacity: event.capacity,
        registered: event.registered,
        type: event.type,
        department: event.department,
        isVirtual: event.isVirtual,
        statusCounts: {} as Record<string, number>,
        totalRsvps: 0,
        totalGuests: 0,
        attendanceRate:
          event.capacity && event.capacity > 0
            ? Math.round((event.registered / event.capacity) * 100)
            : 0,
      });
    });

    rsvps.forEach((rsvp: any) => {
      const record = eventMap.get(rsvp.eventId);
      if (!record) return;

      const statusKey = (rsvp.status || "Unknown").toString();
      record.statusCounts[statusKey] = (record.statusCounts[statusKey] || 0) + 1;
      record.totalRsvps += 1;
      record.totalGuests += (rsvp.guestCount || 0) + 1; // include alumni
    });

    const perEvent = Array.from(eventMap.values());

    const statusDistribution: Record<string, number> = {};
    perEvent.forEach((ev) => {
      Object.entries(ev.statusCounts || {}).forEach(([status, count]) => {
        statusDistribution[status] = (statusDistribution[status] || 0) + (count as number);
      });
    });

    return NextResponse.json({
      events: perEvent,
      statusDistribution,
    });
  } catch (error) {
    console.error("Events stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
