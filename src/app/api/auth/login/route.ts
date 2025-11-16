import { NextRequest, NextResponse } from 'next/server'
import { AlumniDataService } from '@/lib/data-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Check for admin user first
    if (email === 'admin@slu.edu' && password === 'admin123') {
      return NextResponse.json({
        message: 'Login successful',
        user: {
          id: 'ADMIN001',
          email: 'admin@slu.edu',
          role: 'ADMIN',
          profile: {
            firstName: 'Admin',
            lastName: 'User',
            department: 'ADMIN'
          }
        }
      })
    }

    // Find user in real CSV data
    const alumni = AlumniDataService.getAll()
    const alumniProfile = alumni.find(a => a.email === email)

    if (!alumniProfile) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password (all alumni use 'password123')
    if (password !== 'password123') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Return user data from CSV
    const user = {
      id: alumniProfile.id,
      email: alumniProfile.email,
      role: 'ALUMNI',
      profile: {
        firstName: alumniProfile.firstName,
        lastName: alumniProfile.lastName,
        department: alumniProfile.department,
        graduationYear: alumniProfile.graduationYear,
        currentEmployer: alumniProfile.currentEmployer,
        jobTitle: alumniProfile.jobTitle,
        verificationStatus: alumniProfile.verificationStatus,
        city: alumniProfile.city,
        state: alumniProfile.state,
        country: alumniProfile.country
      }
    }

    return NextResponse.json({
      message: 'Login successful',
      user
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
