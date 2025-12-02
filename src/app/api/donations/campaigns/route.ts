import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { DonationsDataService } from "@/lib/data-service";
import fs from "fs";
import path from "path";

const CAMPAIGNS_FILE = path.join(process.cwd(), "src/data", "campaigns.json");

// Load custom campaigns from file
const loadCustomCampaigns = (): any[] => {
  try {
    if (fs.existsSync(CAMPAIGNS_FILE)) {
      const content = fs.readFileSync(CAMPAIGNS_FILE, "utf-8");
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("Error loading campaigns:", error);
    return [];
  }
};

// Save custom campaigns to file
const saveCustomCampaigns = (campaigns: any[]) => {
  try {
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), "utf-8");
    console.log(`✅ Saved ${campaigns.length} campaigns`);
  } catch (error) {
    console.error("Error saving campaigns:", error);
  }
};

// Campaign definitions based on real donation purposes
const campaignDefinitions: { [key: string]: { title: string; description: string; goalMultiplier: number } } = {
  "Scholarship": {
    title: "Student Scholarship Fund",
    description: "Support deserving students with financial assistance for their education at SLU.",
    goalMultiplier: 1.5
  },
  "Infrastructure": {
    title: "Campus Infrastructure Enhancement",
    description: "Help us modernize campus facilities to create better spaces for learning and networking.",
    goalMultiplier: 2
  },
  "Research": {
    title: "Research Innovation Grant",
    description: "Fund cutting-edge research projects that will benefit society and advance knowledge.",
    goalMultiplier: 1.5
  },
  "Athletics": {
    title: "Athletics Excellence Program",
    description: "Support our student athletes with equipment, facilities, and scholarship funding.",
    goalMultiplier: 1.5
  },
  "General Fund": {
    title: "Annual Fund Campaign",
    description: "Unrestricted giving that allows the university to respond to its most pressing needs.",
    goalMultiplier: 1.3
  },
  "Library": {
    title: "Library Resources Expansion",
    description: "Enhance our library collections, digital resources, and study spaces.",
    goalMultiplier: 1.4
  },
  "Student Services": {
    title: "Student Services Support",
    description: "Provide essential resources for student wellness, counseling, and career services.",
    goalMultiplier: 1.4
  },
  "Faculty Development": {
    title: "Faculty Excellence Initiative",
    description: "Invest in faculty development, research opportunities, and academic excellence.",
    goalMultiplier: 1.5
  }
};

function generateCampaignsFromData(): any[] {
  const donations = DonationsDataService.getAll();

  // Group donations by purpose and calculate stats
  const purposeStats: { [key: string]: { raised: number; donors: Set<string> } } = {};

  donations.forEach(donation => {
    const purpose = donation.purpose || 'General Fund';
    if (!purposeStats[purpose]) {
      purposeStats[purpose] = { raised: 0, donors: new Set() };
    }
    purposeStats[purpose].raised += donation.amount || 0;
    purposeStats[purpose].donors.add(donation.alumniId);
  });

  // Generate campaigns from purpose stats
  const campaigns = Object.entries(purposeStats).map(([purpose, stats], index) => {
    const config = campaignDefinitions[purpose] || {
      title: `${purpose} Fund`,
      description: `Support ${purpose.toLowerCase()} initiatives at SLU.`,
      goalMultiplier: 1.5
    };

    const raised = Math.round(stats.raised);
    const goal = Math.round(raised * config.goalMultiplier / 1000) * 1000; // Round to nearest 1000

    return {
      id: String(index + 1),
      title: config.title,
      description: config.description,
      goal: Math.max(goal, raised + 10000), // Ensure goal is always higher than raised
      raised,
      donors: stats.donors.size,
      endDate: new Date(Date.now() + (30 + index * 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Staggered end dates
      category: purpose,
      status: "active"
    };
  });

  // Sort by raised amount (most successful first)
  return campaigns.sort((a, b) => b.raised - a.raised);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get campaigns from donation data
    const donationBasedCampaigns = generateCampaignsFromData();
    
    // Load custom campaigns created by admin
    const customCampaigns = loadCustomCampaigns();
    
    // Merge both, with custom campaigns having higher IDs to avoid conflicts
    const maxDonationId = donationBasedCampaigns.length;
    const adjustedCustomCampaigns = customCampaigns.map((c, idx) => ({
      ...c,
      id: c.id || `custom-${maxDonationId + idx + 1}`
    }));
    
    // Combine and return all campaigns
    const allCampaigns = [...donationBasedCampaigns, ...adjustedCustomCampaigns];
    
    console.log(`📋 [CAMPAIGNS API] Returning ${allCampaigns.length} campaigns (${donationBasedCampaigns.length} from donations, ${customCampaigns.length} custom)`);
    
    return NextResponse.json({ campaigns: allCampaigns });
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

    // Load existing custom campaigns
    const customCampaigns = loadCustomCampaigns();

    const newCampaign = {
      id: `custom-${Date.now()}`,
      title,
      description,
      goal: parseFloat(goal),
      raised: 0,
      donors: 0,
      endDate,
      category,
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: user.email
    };

    customCampaigns.push(newCampaign);
    
    // Save to file
    saveCustomCampaigns(customCampaigns);

    console.log(`✅ [CAMPAIGNS API] Created new campaign: ${newCampaign.title}`);

    return NextResponse.json({
      message: "Campaign created successfully",
      campaign: newCampaign
    }, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
