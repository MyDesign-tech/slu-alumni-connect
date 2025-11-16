import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

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

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const parsedGraduationYear =
      typeof graduationYear === 'number'
        ? graduationYear
        : parseInt(String(graduationYear), 10)

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ALUMNI',
        profile: {
          create: {
            firstName,
            lastName,
            graduationYear: isNaN(parsedGraduationYear) ? 0 : parsedGraduationYear,
            program,
            department,
            profileCompleteness: 40,
          },
        },
      },
      include: {
        profile: true,
      },
    })

    const { password: _password, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
