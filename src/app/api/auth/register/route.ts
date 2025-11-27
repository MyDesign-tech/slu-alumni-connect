import { NextRequest, NextResponse } from 'next/server'
import { AlumniDataService } from '@/lib/data-service'
import { registeredUsers } from '@/lib/registered-users'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, graduationYear, program, department, phone, city, state } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, and lastName are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists in CSV data
    const allAlumni = AlumniDataService.getAll()
    const existingInCSV = allAlumni.find(alumni => alumni.email.toLowerCase() === email.toLowerCase())

    if (existingInCSV) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 400 }
      )
    }

    // Check if already registered in memory
    if (registeredUsers.has(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 400 }
      )
    }

    // Create new user ID
    const newUserId = `NEW${Date.now()}`

    // Create user object
    const newUser = {
      id: newUserId,
      email: email.toLowerCase(),
      role: 'ALUMNI',
      profile: {
        id: `PROF${Date.now()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department || 'STEM',
        graduationYear: parseInt(graduationYear) || new Date().getFullYear(),
        program: program || 'Computer Science',
        phone: phone || '',
        city: city || '',
        state: state || '',
        country: 'USA',
        currentEmployer: '',
        jobTitle: '',
        employmentStatus: 'EMPLOYED',
        verificationStatus: 'PENDING',
        profileCompleteness: 40
      }
    }

    // Store user credentials in memory
    registeredUsers.set(email.toLowerCase(), {
      password: password, // In production, this would be hashed
      user: newUser
    })

    // Add to Alumni Directory Data Service so they appear in the directory immediately
    AlumniDataService.create({
      id: newUserId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase(),
      graduationYear: parseInt(graduationYear) || new Date().getFullYear(),
      program: program || 'Computer Science',
      department: department || 'STEM',
      phone: phone || '',
      city: city || '',
      state: state || '',
      country: 'USA',
      currentEmployer: '',
      jobTitle: '',
      employmentStatus: 'EMPLOYED',
      verificationStatus: 'Pending',
      profileCompleteness: 40
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now login with your credentials.',
      user: newUser
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
