import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";

// Sample events data (in production, this would come from database)
let events = [
  {
    id: "1",
    title: "Annual Alumni Networking Gala",
    description: "Join us for an elegant evening celebrating SLU alumni achievements and building lasting connections.",
    date: "2024-11-25",
    time: "7:00 PM",
    location: "Chaifetz Arena, St. Louis",
    type: "Networking",
    capacity: 500,
    registered: 234,
    isVirtual: false,
    department: "Alumni Relations",
    status: "active"
  },
  {
    id: "2",
    title: "Tech Career Workshop",
    description: "Learn about the latest opportunities in tech careers with industry experts and successful alumni.",
    date: "2024-12-05",
    time: "2:00 PM",
    location: "Online",
    type: "Workshop",
    capacity: 100,
    registered: 67,
    isVirtual: true,
    department: "STEM",
    status: "active"
  },
  {
    id: "3",
    title: "Young Alumni Social Mixer",
    description: "Casual networking event for recent graduates (2018-2023). Food, drinks, and great conversations!",
    date: "2024-12-15",
    time: "6:30 PM",
    location: "The Pint, St. Louis",
    type: "Social",
    capacity: 80,
    registered: 45,
    isVirtual: false,
    department: "Alumni Relations",
    status: "active"
  },
  {
    id: "4",
    title: "Healthcare Leadership Summit",
    description: "Explore leadership opportunities in healthcare with executive panels and networking sessions.",
    date: "2024-12-20",
    time: "9:00 AM",
    location: "SLU Medical Center",
    type: "Conference",
    capacity: 250,
    registered: 156,
    isVirtual: false,
    department: "Healthcare",
    status: "active"
  }
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = events.find((e) => e.id === id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Get event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const eventIndex = events.findIndex((e) => e.id === id);
    if (eventIndex === -1) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const updatedEvent = { ...events[eventIndex], ...body };
    events[eventIndex] = updatedEvent;

    return NextResponse.json({ 
      message: "Event updated successfully", 
      event: updatedEvent 
    });
  } catch (error) {
    console.error("Update event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const eventIndex = events.findIndex((e) => e.id === id);
    if (eventIndex === -1) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    events.splice(eventIndex, 1);

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
