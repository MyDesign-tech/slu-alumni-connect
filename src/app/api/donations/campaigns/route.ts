import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";

// Sample campaigns data
let campaigns = [
  {
    id: "1",
    title: "Student Scholarship Fund",
    description: "Support deserving students with financial assistance for their education at SLU.",
    goal: 100000,
    raised: 67500,
    donors: 234,
    endDate: "2024-12-31",
    category: "Education",
    status: "active"
  },
  {
    id: "2",
    title: "Alumni Center Renovation",
    description: "Help us modernize the alumni center to create better spaces for networking and events.",
    goal: 250000,
    raised: 180000,
    donors: 156,
    endDate: "2025-06-30",
    category: "Infrastructure",
    status: "active"
  },
  {
    id: "3",
    title: "Research Innovation Grant",
    description: "Fund cutting-edge research projects that will benefit society and advance knowledge.",
    goal: 75000,
    raised: 45000,
    donors: 89,
    endDate: "2024-12-20",
    category: "Research",
    status: "active"
  },
  {
    id: "4",
    title: "Emergency Student Support",
    description: "Provide immediate financial assistance to students facing unexpected hardships.",
    goal: 50000,
    raised: 32000,
    donors: 67,
    endDate: "2024-12-15",
    category: "Student Support",
    status: "active"
  }
];

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Campaigns API error:", error);
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
    const { title, description, goal, endDate, category } = body;

    if (!title || !description || !goal || !endDate || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCampaign = {
      id: (campaigns.length + 1).toString(),
      title,
      description,
      goal: parseFloat(goal),
      raised: 0,
      donors: 0,
      endDate,
      category,
      status: "active"
    };

    campaigns.push(newCampaign);

    return NextResponse.json({ 
      message: "Campaign created successfully", 
      campaign: newCampaign 
    }, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
