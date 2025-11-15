import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth-utils';
import { AlumniDataService } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const department = searchParams.get('department') || undefined;

    // Get all users from real CSV data
    let allUsers = AlumniDataService.getAll();

    // Apply filters
    if (search || department) {
      allUsers = AlumniDataService.search({ search, department });
    }

    // Convert to user format expected by admin panel
    const users = allUsers.map(alumni => ({
      id: alumni.id,
      email: alumni.email,
      role: alumni.id === 'ALM00001' ? 'ADMIN' : 'ALUMNI', // First user is admin
      createdAt: alumni.createdAt,
      profile: {
        firstName: alumni.firstName,
        lastName: alumni.lastName,
        department: alumni.department,
        verificationStatus: alumni.verificationStatus.toUpperCase(),
        graduationYear: alumni.graduationYear,
        currentEmployer: alumni.currentEmployer,
        jobTitle: alumni.jobTitle,
        location: `${alumni.city}, ${alumni.state}`,
        profileCompleteness: alumni.profileCompleteness
      }
    }));

    // Apply pagination
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, profile } = body;

    // Check if user already exists
    const existingUsers = AlumniDataService.getAll();
    const existingUser = existingUsers.find(u => u.email === email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // In production, this would add to the database/CSV
    const newUser = {
      id: `ALM${String(Date.now()).slice(-5)}`,
      email,
      role: role || 'ALUMNI',
      createdAt: new Date().toISOString(),
      profile: {
        firstName: profile?.firstName || 'New',
        lastName: profile?.lastName || 'User',
        department: profile?.department || 'GENERAL',
        verificationStatus: 'PENDING',
        graduationYear: profile?.graduationYear || new Date().getFullYear(),
        currentEmployer: profile?.currentEmployer || '',
        jobTitle: profile?.jobTitle || '',
        location: profile?.location || '',
        profileCompleteness: 25
      }
    };

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
