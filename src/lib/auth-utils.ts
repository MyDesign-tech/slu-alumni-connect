import { NextRequest } from 'next/server'
import { AlumniDataService } from './data-service'
import { registeredUsers } from './registered-users'

export interface AuthUser {
  id: string
  email: string
  role: string
  profile?: any
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // In a real app, you'd get this from cookies or Authorization header
    // For demo, we'll simulate getting user from a header
    const userEmail = request.headers.get('x-user-email')
    
    if (!userEmail) {
      return null
    }

    const emailLower = userEmail.toLowerCase()

    // Check admin user first
    if (emailLower === 'admin@slu.edu') {
      return {
        id: 'ADMIN001',
        email: 'admin@slu.edu',
        role: 'ADMIN',
        profile: { firstName: 'Admin', lastName: 'User', department: 'ADMIN' }
      }
    }

    // Check newly registered users
    if (registeredUsers.has(emailLower)) {
      const userData = registeredUsers.get(emailLower)
      return userData!.user
    }

    // Function to get user from real CSV data
    function getUserFromCSV(email: string) {
      try {
        const alumni = AlumniDataService.getAll()
        const alumniProfile = alumni.find(a => a.email.toLowerCase() === email.toLowerCase())
        
        if (alumniProfile) {
          return {
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
              verificationStatus: alumniProfile.verificationStatus
            }
          }
        }
        return null
      } catch (error) {
        console.error('Error loading user from CSV:', error)
        return null
      }
    }

    const user = getUserFromCSV(emailLower)
    
    if (!user) {
      // Default to alumni role for unknown users (new registrations)
      return {
        id: 'USER_' + Date.now(),
        email: userEmail,
        role: 'ALUMNI',
        profile: { firstName: 'User', lastName: '', department: 'STEM' }
      }
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export function requireAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN'
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'ADMIN'
}

// Simplified getCurrentUser for client-side usage (without request parameter)
export async function getCurrentUserSimple(): Promise<AuthUser | null> {
  try {
    // For demo purposes, return a mock admin user
    // In production, this would check actual authentication state
    return {
      id: "1",
      email: "admin@slu.edu",
      role: "ADMIN",
      profile: null
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export function createAuthResponse(message: string, status: number = 403) {
  return Response.json({ error: message }, { status })
}
