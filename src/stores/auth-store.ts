import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: string
  profile?: {
    id: string
    firstName: string
    lastName: string
    phone?: string
    profileImage?: string
    bio?: string
    graduationYear: number
    program: string
    department: string
    currentEmployer?: string
    jobTitle?: string
    employmentStatus?: string
    city?: string
    state?: string
    country: string
    verificationStatus?: string
    profileCompleteness: number
    lastUpdatedDate?: string
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateProfile: (profile: Partial<User['profile']>) => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      updateProfile: (profileUpdate: Partial<User['profile']>) => {
        const currentUser = get().user
        if (currentUser && currentUser.profile) {
          set({
            user: {
              ...currentUser,
              profile: {
                ...currentUser.profile,
                ...profileUpdate
              }
            }
          })
        }
      },

      updateUser: (user: User) => {
        set({ user })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      skipHydration: true,
    }
  )
)
