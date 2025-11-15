import { NextRequest, NextResponse } from 'next/server'

// Demo-only registration endpoint.
// This does NOT write to a real database so it can run safely on Vercel
// without any Prisma migrations or external DB setup.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, graduationYear, program, department } = body

    if (!email || !password || !firstName || !lastName || !graduationYear || !program || !department) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const parsedGraduationYear = parseInt(graduationYear, 10)

    const user = {
      id: `DEMO-${Date.now()}`,
      email,
      role: 'ALUMNI',
      profile: {
        firstName,
        lastName,
        graduationYear: isNaN(parsedGraduationYear) ? undefined : parsedGraduationYear,
        program,
        department,
      },
    }

    return NextResponse.json({
      message: 'User registered successfully (demo only). Login is limited to admin and pre-loaded alumni accounts.',
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
