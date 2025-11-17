// Shared store for registered users across API routes
// In production, this would be replaced with database storage

interface RegisteredUser {
  password: string
  user: {
    id: string
    email: string
    role: string
    profile: any
  }
}

// In-memory store for new registrations
export const registeredUsers = new Map<string, RegisteredUser>()
