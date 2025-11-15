import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { AlumniDataService } from "@/lib/data-service";
import { emailService } from "@/lib/email-service";

async function sendCampaignAnnouncementEmail(campaign: any) {
  const alumni = AlumniDataService.getAll();
  const recipients = alumni.filter((a) => a.email && a.verificationStatus === "Verified");

  if (!recipients.length) {
    return;
  }

  const maxRecipients = 100;
  const limitedRecipients = recipients.slice(0, maxRecipients);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const campaignUrl = `${baseUrl}/donate`;

  const subject = `New SLU Giving Opportunity: ${campaign.title}`;

  const templates = limitedRecipients.map((alumni) => ({
    to: alumni.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003366;">New Giving Campaign: ${campaign.title}</h1>
        <p>Hi ${alumni.firstName},</p>
        <p>A new fundraising campaign has been launched through SLU Alumni Connect.</p>
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Campaign:</strong> ${campaign.title}</p>
          <p style="margin: 4px 0;"><strong>Goal:</strong> $${campaign.goal.toLocaleString()}</p>
          <p style="margin: 4px 0;"><strong>Category:</strong> ${campaign.category}</p>
          <p style="margin: 8px 0 0 0;">${campaign.description || "Visit the donations page for full details and to make a gift."}</p>
        </div>
        <a href="${campaignUrl}" style="background-color: #003366; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 12px;">
          View Campaigns & Give Now
        </a>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">You are receiving this message because you are part of the SLU Alumni Connect community.</p>
      </div>
    `,
  }));

  const result = await emailService.sendBulkEmails(templates);
  console.log(`Campaign announcement emails sent: ${result.success} successful, ${result.failed} failed`);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, description, goal, endDate, category } = body;

    if (!id || !title || !goal) {
      return NextResponse.json({ error: "Missing required campaign fields" }, { status: 400 });
    }

    const campaign = {
      id,
      title,
      description: description || "",
      goal: typeof goal === "string" ? parseInt(goal) || 0 : goal,
      endDate,
      category: category || "General",
    };

    sendCampaignAnnouncementEmail(campaign).catch((error) => {
      console.error("Bulk campaign email error:", error);
    });

    return NextResponse.json({
      message: "Campaign announcement scheduled",
      campaign,
    }, { status: 201 });
  } catch (error) {
    console.error("Create campaign announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
