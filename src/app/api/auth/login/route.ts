import { NextRequest, NextResponse } from 'next/server'
import { AlumniDataService } from '@/lib/data-service'

export async function POST(request: NextRequest) {
  let body: any = {}

  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const { email, password } = body ?? {}

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }

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
          department: 'ADMIN',
        },
      },
    })
  }

  // Try to find an existing alumni profile from JSON data
  let alumniProfile: any = null
  try {
    const alumni = AlumniDataService.getAll()
    alumniProfile = alumni.find((a: any) => a.email === email) || null
  } catch (error) {
    console.error('Error loading alumni data for login:', error)
    alumniProfile = null
  }

  if (alumniProfile) {
    // Demo-friendly: accept any non-empty password for known alumni
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
        country: alumniProfile.country,
      },
    }

    return NextResponse.json({
      message: 'Login successful',
      user,
    })
  }

  // If not found in alumni data, treat as a self-registered demo alumni.
  const nameFromEmail = (email as string).split('@')[0] || 'Alumni'
  const [firstNamePart, lastNamePart] = nameFromEmail
    .replace(/[._]/g, ' ')
    .split(' ')
    .filter(Boolean)

  const user = {
    id: `DEMO-${Date.now()}`,
    email,
    role: 'ALUMNI',
    profile: {
      firstName: firstNamePart || 'Alumni',
      lastName: lastNamePart || 'User',
      department: 'DEMO',
      graduationYear: undefined,
      currentEmployer: undefined,
      jobTitle: undefined,
      verificationStatus: 'Unverified',
      city: undefined,
      state: undefined,
      country: undefined,
    },
  }

  return NextResponse.json({
    message: 'Login successful (demo user)',
    user,
  })
}
