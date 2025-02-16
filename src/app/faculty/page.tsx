'use client'

import { useRef, useCallback } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { FacultyProfile } from '@/types/faculty'
import { Skeleton } from '@/components/ui/skeleton'
import { EducationSection } from '@/components/faculty/education'
import { ResearchEngagementsSection } from '@/components/faculty/research-engagements'
import { ResearchPublicationsSection } from '@/components/faculty/research-publications'
import { ResearchTitlesSection } from '@/components/faculty/research-titles'
import { useToast } from '@/components/ui/use-toast'
import { useFacultyProfile } from '@/lib/hooks/use-faculty-profile'
import { ProfileView } from '@/components/faculty/profile-view'

export default function FacultyPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const updateTimeoutRef = useRef<NodeJS.Timeout>()
  const { profile, loading, error } = useFacultyProfile()

  // Debounced update function
  const debouncedUpdate = useCallback(async (updates: Partial<FacultyProfile>) => {
    const email = user?.email
    if (!email || !profile) return

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const docRef = doc(db, 'faculty_profiles', email)
        await updateDoc(docRef, {
          ...updates,
          updatedAt: new Date()
        })
      } catch (error) {
        console.error('Error updating profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        })
      }
    }, 1000) // 1 second debounce
  }, [user?.email, profile, toast])

  // Handler for research section updates
  const handleSectionUpdate = useCallback((section: keyof FacultyProfile, data: any) => {
    if (!profile) return

    const updates = {
      [section]: data
    }

    debouncedUpdate(updates)
  }, [profile, debouncedUpdate])

  if (loading) {
    return <Skeleton className="w-full h-screen" />
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">Error Loading Profile</h1>
        <p className="text-gray-600">{error?.message || 'Profile not found'}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileView
        profile={profile}
        userEmail={user?.email}
        onProfileUpdate={debouncedUpdate}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <EducationSection
            profile={profile}
            setProfile={(updatedProfile) => handleSectionUpdate('education', updatedProfile.education)}
          />
          <ResearchEngagementsSection
            profile={profile}
            setProfile={(updatedProfile) => handleSectionUpdate('researchEngagements', updatedProfile.researchEngagements)}
          />
          <ResearchPublicationsSection
            profile={profile}
            setProfile={(updatedProfile) => handleSectionUpdate('researchPublications', updatedProfile.researchPublications)}
          />
          <ResearchTitlesSection
            profile={profile}
            setProfile={(updatedProfile) => handleSectionUpdate('researchTitles', updatedProfile.researchTitles)}
          />
        </div>
      </div>
    </div>
  )
} 
