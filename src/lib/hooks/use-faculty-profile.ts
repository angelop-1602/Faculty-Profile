import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { FacultyProfile } from '@/types/faculty'
import { useAuth } from '@/components/providers/auth-provider'
import { useFirestoreConnection } from './use-firestore-connection'

export function useFacultyProfile(email?: string) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<FacultyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { isOnline } = useFirestoreConnection()

  useEffect(() => {
    const targetEmail = email || user?.email
    if (!targetEmail) {
      setLoading(false)
      setError(new Error('No email provided'))
      return
    }

    setLoading(true)
    const docRef = doc(db, 'faculty_profiles', targetEmail)
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError(new Error('Profile not found'))
          setProfile(null)
        } else {
          const data = snapshot.data()
          setProfile({
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastLogin: data.lastLogin?.toDate(),
            researchEngagements: data.researchEngagements || [],
            researchPublications: data.researchPublications || [],
            researchTitles: data.researchTitles || [],
          } as FacultyProfile)
          setError(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching profile:', err)
        setError(err as Error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [email, user?.email, isOnline])

  return { profile, loading, error }
} 