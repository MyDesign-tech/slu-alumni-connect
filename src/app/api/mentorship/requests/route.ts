import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { MentorshipDataService, AlumniDataService } from "@/lib/data-service";
import fs from "fs";
import path from "path";

const MENTORSHIP_REQUESTS_FILE = path.join(process.cwd(), "src/data", "mentorship_requests.json");

const loadMentorshipRequests = (): any[] => {
  try {
    if (fs.existsSync(MENTORSHIP_REQUESTS_FILE)) {
      const content = fs.readFileSync(MENTORSHIP_REQUESTS_FILE, "utf-8");
      return JSON.parse(content);
    }
    return [];
  } catch (error) {
    console.error("Error loading mentorship requests:", error);
    return [];
  }
};

const saveMentorshipRequests = (requests: any[]) => {
  try {
    fs.writeFileSync(MENTORSHIP_REQUESTS_FILE, JSON.stringify(requests, null, 2), "utf-8");
    console.log(`✅ Saved ${requests.length} mentorship requests`);
  } catch (error) {
    console.error("Error saving mentorship requests:", error);
  }
};

// GET - Get all mentorship requests with optional status filter
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Get requests from JSON file (dynamic requests)
        let dynamicRequests = loadMentorshipRequests();
        
        // Get requests from CSV data (static/seeded data)
        let csvRequests;
        if (status) {
            csvRequests = MentorshipDataService.getByStatus(status);
        } else {
            csvRequests = MentorshipDataService.getAll();
        }

        // Merge and deduplicate
        const allRequests = [...dynamicRequests, ...csvRequests];
        
        // Filter by status if provided
        let filteredRequests = allRequests;
        if (status) {
            filteredRequests = allRequests.filter(r => 
                r.status?.toUpperCase() === status.toUpperCase()
            );
        }

        // Get all alumni for name lookup
        const alumni = AlumniDataService.getAll();
        const alumniMap = new Map(alumni.map(a => [a.id, a]));

        // Enrich requests with mentor and mentee names
        const enrichedRequests = filteredRequests.map((r: any) => {
            // Use existing names if available
            let mentorName = r.mentorName;
            let menteeName = r.menteeName;
            
            // Otherwise lookup from alumni data
            if (!mentorName || mentorName.includes('Mentor ')) {
                const mentor = alumniMap.get(r.mentorId);
                if (mentor) {
                    mentorName = `${mentor.firstName} ${mentor.lastName}`;
                }
            }
            if (!menteeName || menteeName.includes('Mentee ')) {
                const mentee = alumniMap.get(r.menteeId);
                if (mentee) {
                    menteeName = `${mentee.firstName} ${mentee.lastName}`;
                }
            }
            
            return {
                ...r,
                mentorName: mentorName || `Mentor ${r.mentorId}`,
                menteeName: menteeName || `Mentee ${r.menteeId}`
            };
        });

        console.log(`📋 [API] Retrieved ${enrichedRequests.length} mentorship requests (enriched with names)`);

        return NextResponse.json({ requests: enrichedRequests });
    } catch (error) {
        console.error("❌ [API] Error fetching mentor requests:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Approve mentorship request
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { action, requestId, rating } = body;

        if (!requestId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // First try to find in JSON file (dynamic requests)
        const dynamicRequests = loadMentorshipRequests();
        const dynamicIndex = dynamicRequests.findIndex(r => r.id === requestId);

        if (dynamicIndex !== -1) {
            // Handle dynamic request
            switch (action) {
                case 'approve':
                    dynamicRequests[dynamicIndex].status = 'ACTIVE';
                    dynamicRequests[dynamicIndex].startDate = new Date().toISOString();
                    saveMentorshipRequests(dynamicRequests);
                    console.log(`✅ [API] Approved mentorship request: ${requestId}`);
                    return NextResponse.json({
                        message: "Mentorship request approved",
                        request: dynamicRequests[dynamicIndex]
                    });

                case 'reject':
                    dynamicRequests.splice(dynamicIndex, 1);
                    saveMentorshipRequests(dynamicRequests);
                    console.log(`❌ [API] Rejected mentorship request: ${requestId}`);
                    return NextResponse.json({ message: "Mentorship request rejected and removed" });

                case 'complete':
                    dynamicRequests[dynamicIndex].status = 'COMPLETED';
                    dynamicRequests[dynamicIndex].endDate = new Date().toISOString();
                    if (rating) dynamicRequests[dynamicIndex].rating = rating;
                    saveMentorshipRequests(dynamicRequests);
                    console.log(`🎓 [API] Completed mentorship: ${requestId}`);
                    return NextResponse.json({
                        message: "Mentorship completed",
                        request: dynamicRequests[dynamicIndex]
                    });

                default:
                    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
            }
        }

        // Fallback to CSV-based data service
        let updatedRequest;

        switch (action) {
            case 'approve':
                updatedRequest = MentorshipDataService.approveRequest(requestId);
                console.log(`✅ [API] Approved mentorship request: ${requestId}`);
                break;

            case 'reject':
                const deleted = MentorshipDataService.rejectRequest(requestId);
                console.log(`❌ [API] Rejected mentorship request: ${requestId}`);
                return NextResponse.json({ message: "Mentorship request rejected and removed" });

            case 'complete':
                updatedRequest = MentorshipDataService.completeMentorship(requestId, rating);
                console.log(`🎓 [API] Completed mentorship: ${requestId}`);
                break;

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({
            message: `Mentorship request ${action}d successfully`,
            request: updatedRequest
        });
    } catch (error) {
        console.error("❌ [API] Error managing mentorship request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT - Update mentorship request status
export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { requestId, status, rating } = body;

        if (!requestId || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // First try to find in JSON file
        const dynamicRequests = loadMentorshipRequests();
        const dynamicIndex = dynamicRequests.findIndex(r => r.id === requestId);

        if (dynamicIndex !== -1) {
            dynamicRequests[dynamicIndex].status = status;
            if (rating) dynamicRequests[dynamicIndex].rating = rating;
            if (status === 'COMPLETED') dynamicRequests[dynamicIndex].endDate = new Date().toISOString();
            saveMentorshipRequests(dynamicRequests);

            console.log(`🔄 [API] Updated mentorship request ${requestId} to status: ${status}`);
            return NextResponse.json({
                message: "Mentorship request updated successfully",
                request: dynamicRequests[dynamicIndex]
            });
        }

        // Fallback to data service
        const updates: any = { status };
        if (rating) updates.rating = rating;
        if (status === 'Completed') updates.endDate = new Date().toISOString().split('T')[0];

        const updatedRequest = MentorshipDataService.update(requestId, updates);

        if (!updatedRequest) {
            return NextResponse.json({ error: "Mentorship request not found" }, { status: 404 });
        }

        console.log(`🔄 [API] Updated mentorship request ${requestId} to status: ${status}`);

        return NextResponse.json({
            message: "Mentorship request updated successfully",
            request: updatedRequest
        });
    } catch (error) {
        console.error("❌ [API] Error updating mentorship request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete mentorship request
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('requestId');

        if (!requestId) {
            return NextResponse.json({ error: "Request ID required" }, { status: 400 });
        }

        // First try to delete from JSON file
        const dynamicRequests = loadMentorshipRequests();
        const dynamicIndex = dynamicRequests.findIndex(r => r.id === requestId);

        if (dynamicIndex !== -1) {
            dynamicRequests.splice(dynamicIndex, 1);
            saveMentorshipRequests(dynamicRequests);
            console.log(`🗑️ [API] Deleted mentorship request: ${requestId}`);
            return NextResponse.json({ message: "Mentorship request deleted successfully" });
        }

        // Fallback to data service
        const deleted = MentorshipDataService.delete(requestId);

        if (!deleted) {
            return NextResponse.json({ error: "Mentorship request not found" }, { status: 404 });
        }

        console.log(`🗑️ [API] Deleted mentorship request: ${requestId}`);

        return NextResponse.json({ message: "Mentorship request deleted successfully" });
    } catch (error) {
        console.error("❌ [API] Error deleting mentorship request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
