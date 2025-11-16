import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { AlumniDataService } from '@/lib/data-service'

const VALID_DEPARTMENTS = ['STEM', 'BUSINESS', 'HUMANITIES', 'HEALTHCARE', 'SOCIAL_SCIENCES'] as const

function mapDepartment(rawDepartment?: string, program?: string) {
  if (rawDepartment) {
    const normalized = rawDepartment.toUpperCase().replace(/\s+/g, '_')
    if (VALID_DEPARTMENTS.includes(normalized as (typeof VALID_DEPARTMENTS)[number])) {
      return normalized
    }
  }

  if (program) {
    const p = program.toLowerCase()
    if (p.includes('computer') || p.includes('engineering')) return 'STEM'
    if (p.includes('business')) return 'BUSINESS'
    if (p.includes('medicine') || p.includes('nursing') || p.includes('health')) return 'HEALTHCARE'
    if (p.includes('social')) return 'SOCIAL_SCIENCES'
  }

  return 'HUMANITIES'
}

function mapEmploymentStatus(rawStatus?: string) {
  if (!rawStatus) return 'NOT_AVAILABLE'
  const s = rawStatus.toLowerCase()
  if (s === 'employed') return 'EMPLOYED'
  if (s === 'self-employed' || s === 'self employed') return 'SELF_EMPLOYED'
  if (s === 'retired') return 'RETIRED'
  if (s === 'seeking') return 'SEEKING'
  return 'NOT_AVAILABLE'
}

function mapVerificationStatus(rawStatus?: string) {
  if (!rawStatus) return 'PENDING'
  const s = rawStatus.toLowerCase()
  if (s === 'verified') return 'VERIFIED'
  if (s === 'unverified') return 'UNVERIFIED'
  return 'PENDING'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body ?? {}

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // 1. Try to log in against the real DB first
    const existingUser = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (existingUser) {
      const passwordValid = await bcrypt.compare(password, existingUser.password)

      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      const { password: _password, ...userWithoutPassword } = existingUser

      return NextResponse.json({
        message: 'Login successful',
        user: userWithoutPassword,
      })
    }

    // 2. If not found in DB, try to auto-provision from CSV/JSON alumni data.
    const allAlumni = AlumniDataService.getAll()
    const alumniProfile = allAlumni.find(a => a.email.toLowerCase() === String(email).toLowerCase())

    if (!alumniProfile) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // For alumni imported from CSV, require the shared demo password.
    if (password !== 'password123') {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const createdUser = await db.user.create({
      data: {
        email: alumniProfile.email,
        password: hashedPassword,
        role: 'ALUMNI',
        profile: {
          create: {
            firstName: alumniProfile.firstName,
            lastName: alumniProfile.lastName,
            graduationYear: alumniProfile.graduationYear || 0,
            program: alumniProfile.program || 'Unknown',
            department: mapDepartment(alumniProfile.department, alumniProfile.program) as any,
            currentEmployer: alumniProfile.currentEmployer || null,
            jobTitle: alumniProfile.jobTitle || null,
            employmentStatus: mapEmploymentStatus(alumniProfile.employmentStatus) as any,
            city: alumniProfile.city || null,
            state: alumniProfile.state || null,
            country: alumniProfile.country || 'USA',
            verificationStatus: mapVerificationStatus(alumniProfile.verificationStatus) as any,
            profileCompleteness: alumniProfile.profileCompleteness || 0,
          },
        },
      },
      include: { profile: true },
    })

    const { password: _password, ...userWithoutPassword } = createdUser

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
