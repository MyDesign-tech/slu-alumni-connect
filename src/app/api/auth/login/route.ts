import { NextRequest, NextResponse } from 'next/server'
import { AlumniDataService } from '@/lib/data-service'
import { registeredUsers } from '@/lib/registered-users'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const emailLower = email.toLowerCase()

    // Check for admin user first
    if (emailLower === 'admin@slu.edu' && password === 'admin123') {
      return NextResponse.json({
        message: 'Login successful',
        user: {
          id: 'ADMIN001',
          email: 'admin@slu.edu',
          role: 'ADMIN',
          profile: {
            id: 'ADMIN_PROF',
            firstName: 'Admin',
            lastName: 'User',
            department: 'STEM',
            graduationYear: 2020,
            program: 'Administration',
            country: 'USA',
            verificationStatus: 'VERIFIED',
            profileCompleteness: 100
          }
        }
      })
    }

    // Check if user is a newly registered user
    if (registeredUsers.has(emailLower)) {
      const userData = registeredUsers.get(emailLower)!
      if (userData.password === password) {
        return NextResponse.json({
          message: 'Login successful',
          user: userData.user
        })
      } else {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    }

    // Find user in real CSV data
    const alumni = AlumniDataService.getAll()
    const alumniProfile = alumni.find(a => a.email.toLowerCase() === emailLower)

    if (!alumniProfile) {
      return NextResponse.json(
        { error: 'Invalid email or password. If you just registered, make sure you\'re using the correct credentials.' },
        { status: 401 }
      )
    }

    // Check password (all CSV alumni use 'password123')
    if (password !== 'password123') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login timestamp for activity tracking
    const today = new Date().toISOString().split('T')[0];
    AlumniDataService.update(alumniProfile.id, {
      lastActive: today,
      lastLoginDate: today
    });
    console.log(`✅ [LOGIN] Updated last login for ${alumniProfile.email} to ${today}`);

    // Return user data from CSV
    const user = {
      id: alumniProfile.id,
      email: alumniProfile.email,
      role: 'ALUMNI',
      profile: {
        id: alumniProfile.id + '_PROF',
        firstName: alumniProfile.firstName,
        lastName: alumniProfile.lastName,
        department: alumniProfile.department,
        graduationYear: alumniProfile.graduationYear,
        program: alumniProfile.program || 'Computer Science',
        currentEmployer: alumniProfile.currentEmployer,
        jobTitle: alumniProfile.jobTitle,
        verificationStatus: alumniProfile.verificationStatus,
        city: alumniProfile.city,
        state: alumniProfile.state,
        country: alumniProfile.country || 'USA',
        profileCompleteness: alumniProfile.profileCompleteness || 75
      }
    }

    return NextResponse.json({
      message: 'Login successful',
      user
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
