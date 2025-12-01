import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import { AlumniDataService } from "@/lib/data-service";

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

    const alumni = AlumniDataService.getAll();
    const alumniProfile = alumni.find((a) => a.id === id);
    if (!alumniProfile) {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    return NextResponse.json({ alumni: alumniProfile });
  } catch (error) {
    console.error("Get alumni error:", error);
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

    const alumni = AlumniDataService.getAll();
    const alumniIndex = alumni.findIndex((a) => a.id === id);
    if (alumniIndex === -1) {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    const body = await request.json();
    const updatedAlumni = AlumniDataService.update(id, body);

    return NextResponse.json({
      message: "Alumni updated successfully",
      alumni: updatedAlumni
    });
  } catch (error) {
    console.error("Update alumni error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log(`🌐 [API DELETE] Request to delete alumni: ${id}`);

    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      console.log(`❌ [API DELETE] Unauthorized: ${user?.email || 'no user'}, role: ${user?.role || 'none'}`);
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    console.log(`✅ [API DELETE] Admin authorized: ${user.email}`);

    const alumni = AlumniDataService.getAll();
    const alumniProfile = alumni.find((a) => a.id === id);
    if (!alumniProfile) {
      console.log(`❌ [API DELETE] Alumni not found in service: ${id}`);
      console.log(`📊 [API DELETE] Total alumni in service: ${alumni.length}`);
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 });
    }

    console.log(`✅ [API DELETE] Found alumni: ${alumniProfile.firstName} ${alumniProfile.lastName}`);

    const deleteResult = AlumniDataService.delete(id);
    console.log(`${deleteResult ? '✅' : '❌'} [API DELETE] Delete result: ${deleteResult}`);

    if (!deleteResult) {
      return NextResponse.json({ error: "Failed to delete alumni" }, { status: 500 });
    }

    // Verify deletion
    const afterDelete = AlumniDataService.getAll();
    console.log(`📊 [API DELETE] Alumni count after delete: ${afterDelete.length}`);
    const stillExists = afterDelete.find(a => a.id === id);
    if (stillExists) {
      console.error(`❌ [API DELETE] CRITICAL: Alumni still exists after deletion!`);
    } else {
      console.log(`✅ [API DELETE] Verified: Alumni successfully removed from memory`);
    }

    return NextResponse.json({
      message: "Alumni removed successfully",
      alumni: alumniProfile,
      newCount: afterDelete.length
    });
  } catch (error) {
    console.error("Delete alumni error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
