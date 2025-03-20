import { useState, useEffect, useRef } from 'react'
import { auth } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'

interface FetchOptions {
  maxRetries?: number
  retryDelay?: number
  requiresAuth?: boolean
  bypassTokenRefresh?: boolean
}

// Keep track of the last token refresh time
const lastTokenRefresh = {
  timestamp: 0,
  promise: null as Promise<string> | null
}

// Minimum time between token refreshes (5 minutes)
const MIN_REFRESH_INTERVAL = 5 * 60 * 1000

async function getAuthToken(force = false): Promise<string | null> {
  const now = Date.now()
  
  // If a refresh is already in progress, wait for it
  if (lastTokenRefresh.promise) {
    return lastTokenRefresh.promise
  }

  // Check if we need to refresh the token
  if (!force && now - lastTokenRefresh.timestamp < MIN_REFRESH_INTERVAL) {
    return auth.currentUser?.getIdToken(false) || null
  }

  // Start a new token refresh
  try {
    lastTokenRefresh.promise = auth.currentUser?.getIdToken(true) || null
    const token = await lastTokenRefresh.promise
    lastTokenRefresh.timestamp = now
    return token
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  } finally {
    lastTokenRefresh.promise = null
  }
}

export function useFetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: FetchOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    requiresAuth = true,
    bypassTokenRefresh = false
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const retryCount = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const fetchData = async () => {
      try {
        // Check if auth is required and user is logged in
        if (requiresAuth && !auth.currentUser) {
          throw new Error('Authentication required')
        }

        // Get fresh token if needed
        if (requiresAuth && !bypassTokenRefresh) {
          const token = await getAuthToken(retryCount.current > 0)
          if (!token) {
            throw new Error('Failed to get authentication token')
          }
        }

        const result = await fetchFn()
        if (mounted.current) {
          setData(result)
          setError(null)
          retryCount.current = 0
        }
      } catch (err: any) {
        console.error('Fetch error:', err)
        
        if (!mounted.current) return

        // Handle quota exceeded error
        if (err?.code === 'auth/quota-exceeded') {
          toast({
            title: 'Rate limit exceeded',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive',
          })
          // Don't retry immediately for quota errors
          timeoutId = setTimeout(fetchData, Math.max(retryDelay * 5, 30000))
          return
        }

        if (retryCount.current < maxRetries) {
          retryCount.current++
          const delay = retryDelay * Math.pow(2, retryCount.current - 1)
          timeoutId = setTimeout(fetchData, delay)
        } else {
          setError(err instanceof Error ? err : new Error('Failed to fetch data'))
          retryCount.current = 0
        }
      } finally {
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      clearTimeout(timeoutId)
    }
  }, [fetchFn, maxRetries, retryDelay, requiresAuth, bypassTokenRefresh, toast])

  return { data, loading, error }
} 