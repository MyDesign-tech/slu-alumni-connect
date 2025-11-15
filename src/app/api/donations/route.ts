import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { DonationsDataService } from "@/lib/data-service";

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
      
      const campaigns = Object.entries(donationsByPurpose).map(([purpose, amount], index) => ({
        id: `CMP${String(index + 1).padStart(5, '0')}`,
        title: purpose,
        description: `Support ${purpose.toLowerCase()} initiatives`,
        goal: Math.ceil(amount / 0.6) * 100, // Estimate goal as 60% funded
        raised: amount,
        donors: Math.floor(amount / 250), // Estimate donors
        category: purpose,
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      return NextResponse.json({ campaigns });
    }

    // Get all donations or user-specific donations
    let donations = DonationsDataService.getAll();
    
    if (!isAdmin(user)) {
      // Filter to user's donations only
      donations = DonationsDataService.getByAlumni(user.id);
    }

    // Format for display
    const formattedDonations = donations.map(d => ({
      id: d.id,
      amount: d.amount,
      campaign: d.purpose,
      date: d.date,
      status: d.status,
      method: d.method
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

    // In production, this would process the payment and save to database/CSV
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

    return NextResponse.json({ 
      message: "Donation processed successfully", 
      donation: newDonation 
    }, { status: 201 });
  } catch (error) {
    console.error("Process donation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
