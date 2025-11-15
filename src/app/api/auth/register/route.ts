import { NextRequest, NextResponse } from 'next/server'

// Demo-only registration endpoint.
// This does NOT write to a real database so it can run safely on Vercel
// without any Prisma migrations or external DB setup.
export async function POST(request: NextRequest) {
  let body: any = {}

  // Be defensive when reading the request body so we never throw.
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const {
    email,
    firstName,
    lastName,
    graduationYear,
    program,
    department,
  } = body ?? {}

  const parsedGraduationYear =
    typeof graduationYear === 'number'
      ? graduationYear
      : typeof graduationYear === 'string'
      ? parseInt(graduationYear, 10)
      : undefined

  const user = {
    id: `DEMO-${Date.now()}`,
    email: email || 'demo@slu.edu',
    role: 'ALUMNI',
    profile: {
      firstName: firstName || 'Demo',
      lastName: lastName || 'User',
      graduationYear: isNaN(Number(parsedGraduationYear))
        ? undefined
        : Number(parsedGraduationYear),
      program: program || 'Demo Program',
      department: department || 'DEMO',
    },
  }

  return NextResponse.json({
    message:
      'User registered successfully (demo only). Please use admin or pre-loaded alumni credentials to log in.',
    user,
  })
}
