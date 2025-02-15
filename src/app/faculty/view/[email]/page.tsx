'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { FacultyProfile } from '@/types/faculty'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EducationSection } from '@/components/faculty/education'
import { ResearchEngagementsSection } from '@/components/faculty/research-engagements'
import { ResearchPublicationsSection } from '@/components/faculty/research-publications'
import { ResearchTitlesSection } from '@/components/faculty/research-titles'
import { Building2, GraduationCap, Mail, UserRound, ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function ViewFacultyPage({ params }: { params: { email: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<FacultyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const email = decodeURIComponent(params.email)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'faculty_profiles', email)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfile({
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastLogin: data.lastLogin?.toDate(),
          } as FacultyProfile)
        } else {
          toast({
            title: 'Profile Not Found',
            description: 'The requested faculty profile does not exist.',
            variant: 'destructive',
          })
          router.push('/admin')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch faculty profile',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [email, router, toast])

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold">Profile Not Found</h2>
          <p className="mt-2 text-muted-foreground">Could not find the requested faculty profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-spup-green text-white shadow">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin')}
            className="text-white hover:bg-spup-green-dark mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-2xl font-bold">View Faculty Profile</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="relative h-48 bg-gradient-to-r from-spup-green to-spup-green-dark">
            {profile.bannerURL && (
              <img
                src={profile.bannerURL}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="relative px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-start -mt-20 gap-6">
              {/* Profile Photo */}
              <div className="relative mx-auto md:mx-0">
                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-spup-green to-spup-green-dark flex items-center justify-center">
                      <UserRound className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-gray-600 flex items-center justify-center md:justify-start mt-1">
                    <Mail className="h-4 w-4 mr-2" />
                    {profile.email}
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-center md:justify-start text-gray-600">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>{profile.department || 'No department set'}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start text-gray-600">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <span>{profile.specialization || 'No specialization set'}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start text-gray-600">
                    <UserRound className="h-4 w-4 mr-2" />
                    <span>{profile.status || 'No status set'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Research Sections */}
        <div className="space-y-8">
          <EducationSection profile={profile} setProfile={setProfile} />
          <ResearchEngagementsSection profile={profile} setProfile={setProfile} />
          <ResearchPublicationsSection profile={profile} setProfile={setProfile} />
          <ResearchTitlesSection profile={profile} setProfile={setProfile} />
        </div>
      </main>
    </div>
  )
} 