'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { Department, EmploymentStatus, FacultyProfile } from '@/types/faculty'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EducationSection } from '@/components/faculty/education'
import { ResearchEngagementsSection } from '@/components/faculty/research-engagements'
import { ResearchPublicationsSection } from '@/components/faculty/research-publications'
import { ResearchTitlesSection } from '@/components/faculty/research-titles'
import { Building2, GraduationCap, Mail, UserRound, Pencil } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminViewFacultyProfile({ params }: { params: { email: string } }) {
  const router = useRouter()
  const { role } = useAuth()
  const [profile, setProfile] = useState<FacultyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<FacultyProfile | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is admin
    if (role !== 'admin') {
      toast({
        title: 'Unauthorized',
        description: 'Only administrators can view this page.',
        variant: 'destructive'
      })
      router.push('/')
      return
    }

    const fetchProfile = async () => {
      try {
        const email = decodeURIComponent(params.email)
        const docRef = doc(db, 'faculty_profiles', email)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          const profileData = {
            id: email,
            email: email,
            name: data.name || '',
            department: data.department || '',
            specialization: data.specialization || '',
            status: data.status || '',
            photoURL: data.photoURL || '',
            bannerURL: data.bannerURL || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate() || new Date(),
            education: data.education || [],
            researchEngagements: data.researchEngagements || [],
            researchPublications: data.researchPublications || [],
            researchTitles: data.researchTitles || [],
            researchCount: data.researchCount || {
              total: 0,
              publications: 0,
              engagements: 0,
              titles: 0
            }
          } as FacultyProfile

          setProfile(profileData)
          setEditedProfile(profileData)
        } else {
          toast({
            title: 'Profile Not Found',
            description: 'Could not find the faculty profile.',
            variant: 'destructive'
          })
          router.push('/admin')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch profile. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [params.email, router, toast, role])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedProfile(profile) // Reset changes
  }

  const handleSave = async () => {
    if (!editedProfile || !profile?.email) return

    try {
      const docRef = doc(db, 'faculty_profiles', profile.email)
      const updatedProfile = {
        ...editedProfile,
        updatedAt: new Date()
      }
      
      await updateDoc(docRef, updatedProfile)
      setProfile(editedProfile)
      setIsEditing(false)
      toast({
        title: 'Profile Updated',
        description: 'Faculty profile has been updated successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (!profile || !editedProfile) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold">Profile Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            Could not find the faculty profile.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push('/admin')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-spup-green text-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Faculty Profile</h1>
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="text-white"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
          {/* Banner */}
          <div className="relative h-36">
            <Image
              src={profile.bannerURL || '/images/hero-bg.png'}
              alt="Profile banner"
              fill
              sizes="100vw"
              priority
              className="object-cover"
            />
          </div>

          {/* Profile Content */}
          <div className="px-6 pb-6">
            <div className="relative -mt-12 flex flex-col items-center text-center">
              {/* Profile Photo with Edit Button */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-white shadow-md">
                  {profile.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt={profile.name || 'Profile photo'}
                      className="w-full h-full object-cover"
                      width={96}
                      height={96}
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-spup-green to-spup-green-dark flex items-center justify-center">
                      <UserRound className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isEditing ? handleSave : handleEdit}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white"
                >
                  <Pencil className="h-4 w-4 text-spup-green" />
                </Button>
              </div>

              {/* Profile Info */}
              <div className="mt-3 w-full max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.name}
                </h2>

                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {profile.email}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {/* Department */}
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Select
                          value={editedProfile.department || "unset"}
                          onValueChange={(value: Department) =>
                            setEditedProfile({
                              ...editedProfile,
                              department: value === "unset" ? "" : value
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unset">Select department</SelectItem>
                            <SelectItem value="SASTE">SASTE</SelectItem>
                            <SelectItem value="SITE">SITE</SelectItem>
                            <SelectItem value="SBHAM">SBHAM</SelectItem>
                            <SelectItem value="SNAHS">SNAHS</SelectItem>
                            <SelectItem value="SOM">SOM</SelectItem>
                            <SelectItem value="BEU">BEU</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Specialization */}
                      <div>
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          value={editedProfile.specialization || ''}
                          onChange={(e) =>
                            setEditedProfile({
                              ...editedProfile,
                              specialization: e.target.value
                            })
                          }
                          placeholder="Enter specialization"
                        />
                      </div>

                      {/* Employment Status */}
                      <div>
                        <Label htmlFor="status">Employment Status</Label>
                        <Select
                          value={editedProfile.status || "unset"}
                          onValueChange={(value: EmploymentStatus) =>
                            setEditedProfile({
                              ...editedProfile,
                              status: value === "unset" ? "" : value
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unset">Select status</SelectItem>
                            <SelectItem value="Full time">Full time</SelectItem>
                            <SelectItem value="Part time">Part time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-1">
                      <div className="flex items-center text-gray-600">
                        <Building2 className="h-4 w-4 mr-2" />
                        {profile.department || 'No department set'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        {profile.specialization || 'No specialization set'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <UserRound className="h-4 w-4 mr-2" />
                        {profile.status || 'No status set'}
                      </div>
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className="hover:bg-gray-100"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave}
                        className="bg-spup-green hover:bg-spup-green/90"
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Research Sections */}
        <div className="space-y-8">
          <EducationSection 
            profile={profile} 
            setProfile={(updatedProfile) => {
              setProfile(updatedProfile)
              setEditedProfile(updatedProfile)
            }} 
          />
          <ResearchEngagementsSection 
            profile={profile} 
            setProfile={(updatedProfile) => {
              setProfile(updatedProfile)
              setEditedProfile(updatedProfile)
            }} 
          />
          <ResearchPublicationsSection 
            profile={profile} 
            setProfile={(updatedProfile) => {
              setProfile(updatedProfile)
              setEditedProfile(updatedProfile)
            }} 
          />
          <ResearchTitlesSection 
            profile={profile} 
            setProfile={(updatedProfile) => {
              setProfile(updatedProfile)
              setEditedProfile(updatedProfile)
            }} 
          />
        </div>
      </main>
    </div>
  )
} 