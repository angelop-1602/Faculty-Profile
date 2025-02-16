import { useEffect, useState } from 'react'
import { enableIndexedDbPersistence, disableNetwork, enableNetwork } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'

// Track if persistence has been initialized
let persistenceInitialized = false

export function useFirestoreConnection() {
  const [isOnline, setIsOnline] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true

    const initializeFirestore = async () => {
      try {
        // Only try to enable persistence once and only if not already initialized
        if (!persistenceInitialized) {
          persistenceInitialized = true
          try {
            await enableIndexedDbPersistence(db)
          } catch (err: any) {
            if (err.code === 'failed-precondition') {
              // Multiple tabs open, persistence can only be enabled in one tab at a time
              console.warn('Persistence already enabled in another tab')
            } else if (err.code === 'unimplemented') {
              // The current browser doesn't support persistence
              console.warn('Persistence not supported in this browser')
            } else if (err.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
              if (mounted) {
                toast({
                  title: 'Connection Issue',
                  description: 'Please disable ad blockers or privacy extensions for this site to function properly.',
                  variant: 'destructive',
                })
                setHasError(true)
              }
            }
          }
        }

        // Reset error state if successful
        if (mounted) {
          setHasError(false)
        }
      } catch (error: any) {
        console.error('Firestore initialization error:', error)
        if (mounted) {
          setHasError(true)
          
          if (error.code === 'permission-denied' || error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
            toast({
              title: 'Connection Issue',
              description: 'Please disable ad blockers or privacy extensions for this site to function properly.',
              variant: 'destructive',
            })
          }
        }
      }
    }

    // Handle online/offline status
    const handleOnline = async () => {
      setIsOnline(true)
      try {
        await enableNetwork(db)
      } catch (error) {
        console.error('Error enabling network:', error)
      }
    }

    const handleOffline = async () => {
      setIsOnline(false)
      try {
        await disableNetwork(db)
      } catch (error) {
        console.error('Error disabling network:', error)
      }
    }

    // Initialize Firestore
    initializeFirestore()

    // Add network status listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup function
    return () => {
      mounted = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  return { isOnline, hasError }
} 