import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'

export function useHydratedAuthStore() {
  const [isHydrated, setIsHydrated] = useState(false)
  const authStore = useAuthStore()

  useEffect(() => {
    // Manually trigger hydration
    useAuthStore.persist.rehydrate()
    setIsHydrated(true)
  }, [])

  return {
    ...authStore,
    isHydrated
  }
}
