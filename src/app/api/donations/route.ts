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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'campaigns') {
      // Get campaigns by grouping donations by purpose
      const donationsByPurpose = DonationsDataService.getDonationsByPurpose();
      
      const donationBasedCampaigns = Object.entries(donationsByPurpose).map(([purpose, amount], index) => ({
        id: `CMP${String(index + 1).padStart(5, '0')}`,
        title: purpose,
        description: `Support ${purpose.toLowerCase()} initiatives`,
        goal: Math.ceil(amount / 0.6) * 100, // Estimate goal as 60% funded
        raised: amount,
        donors: Math.floor(amount / 250), // Estimate donors
        category: purpose,
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      // Load custom campaigns created by admin
      const customCampaigns = loadCustomCampaigns();
      
      // Combine both sets of campaigns
      const allCampaigns = [...donationBasedCampaigns, ...customCampaigns];
      
      console.log(`📋 [DONATIONS API] Returning ${allCampaigns.length} campaigns (${donationBasedCampaigns.length} from donations, ${customCampaigns.length} custom)`);

      return NextResponse.json({ campaigns: allCampaigns });
    }

    if (type === 'top-donors') {
      // Get top donors - admin only
      if (!isAdmin(user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      const topDonors = DonationsDataService.getTopDonors(10);
      return NextResponse.json({ topDonors });
    }

    if (type === 'analytics') {
      // Return aggregated analytics data for all users (anonymized for non-admins)
      const allDonations = DonationsDataService.getAll();
      
      // Format for analytics display (no personal identifiers for non-admins)
      const formattedDonations = allDonations.map(d => ({
        id: d.id,
        amount: d.amount,
        campaign: d.purpose,
        purpose: d.purpose,
        date: d.date,
        status: d.status,
        method: d.method
      }));

      return NextResponse.json({ donations: formattedDonations, isAnalytics: true });
    }

    if (type === 'stats') {
      // Return real donation statistics from actual data
      const stats = DonationsDataService.getStats();
      
      // Get donation-based campaigns count
      const donationsByPurpose = DonationsDataService.getDonationsByPurpose();
      const donationBasedCampaignsCount = Object.keys(donationsByPurpose).length;
      
      // Get custom campaigns count
      const customCampaigns = loadCustomCampaigns();
      const customCampaignsCount = customCampaigns.length;
      
      // Update active campaigns count to include both
      const updatedStats = {
        ...stats,
        activeCampaigns: donationBasedCampaignsCount + customCampaignsCount
      };
      
      return NextResponse.json({ stats: updatedStats });
    }

    // Get all donations or user-specific donations
    let donations = DonationsDataService.getAll();
    
    if (!isAdmin(user)) {
      // Filter to user's donations only for "My Donations" tab
      donations = DonationsDataService.getByAlumni(user.id);
    }

    // Format for display
    const formattedDonations = donations.map(d => ({
      id: d.id,
      amount: d.amount,
      campaign: d.purpose,
      date: d.date,
      status: d.status,
      method: d.method,
      purpose: d.purpose
    }));

    return NextResponse.json({ donations: formattedDonations });
  } catch (error) {
    console.error("Donations API error:", error);
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
    const { amount, campaignId, paymentMethod, donorName } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid donation amount" }, { status: 400 });
    }

    // Create the new donation record
    const newDonation = {
      id: `DON${String(Date.now()).slice(-6)}`,
      alumniId: user.id,
      amount: parseFloat(amount),
      type: "One-Time Gift",
      method: paymentMethod || "Credit Card",
      date: new Date().toISOString().split('T')[0],
      purpose: campaignId || "General Fund",
      isAnonymous: false,
      taxDeductible: true,
      recurringFrequency: "",
      status: "Completed"
    };

    // Save the donation to the data service (in-memory for demo)
    DonationsDataService.create(newDonation);

    return NextResponse.json({ 
      message: "Donation processed successfully", 
      donation: {
        id: newDonation.id,
        campaign: newDonation.purpose,
        amount: newDonation.amount,
        date: newDonation.date,
        status: newDonation.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Process donation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
