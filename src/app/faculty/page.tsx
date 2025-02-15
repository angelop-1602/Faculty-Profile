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
import { EditProfileButton } from '@/components/faculty/edit-profile-button'
import { signOutUser } from '@/lib/firebase/auth'
import { Building2, GraduationCap, LogOut, Mail, UserRound } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function FacultyPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<FacultyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<FacultyProfile | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) return

      try {
        const docRef = doc(db, 'faculty_profiles', user.email)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          // Store the Microsoft photo URL in the database if it's available and different
          if (user.photoURL && user.photoURL !== data.photoURL) {
            await updateDoc(docRef, {
              photoURL: user.photoURL
            })
          }

          const profileData = {
            ...data,
            photoURL: user.photoURL || data.photoURL,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastLogin: data.lastLogin?.toDate(),
            researchEngagements: data.researchEngagements || [],
            researchPublications: data.researchPublications || [],
            researchTitles: data.researchTitles || [],
          } as FacultyProfile

          setProfile(profileData)
          setEditedProfile(profileData)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

      fetchProfile()
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedProfile(profile) // Reset changes
  }

  const handleSave = async () => {
    if (!editedProfile || !user?.email) return

    try {
      await updateDoc(doc(db, 'faculty_profiles', user.email), {
        ...editedProfile,
        updatedAt: new Date()
      })

      setProfile(editedProfile)
      setIsEditing(false)
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
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
            Could not find your faculty profile. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header with Sign Out */}
      <header className="bg-spup-green text-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Faculty Profile</h1>
          <Button
            variant="ghost"
            onClick={signOutUser}
            className="text-white hover:bg-spup-green-dark"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden relative">
          {/* Banner */}
          <div className="relative h-48">
            <img
              src={profile.bannerURL || '/images/fur de lis.png'}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          </div>

          {/* White Section: Photo & Personal Info */}
          <div className="px-6 pb-6">
            {/* Use a negative margin to overlap the photo on the banner */}
            <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-start gap-4 px-6 pb-6">
              {/* Profile Photo */}
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden mx-auto sm:mx-0">
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

              {/* Name, Email, and Other Details */}
              <div className="flex-1 min-w-[200px] text-center sm:text-left">
                {/* Name and Email */}
                <h2 className="text-2xl font-bold text-black sm:text-white mt-8">
                  {profile.name}
                </h2>

                <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-3">
                  <Mail className="h-4 w-4 mr-1" />
                  {profile.email}
                </p>

                {isEditing ? (
                  // Editing Fields
                  <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Department */}
                    <div className="grid gap-1">
                      <Label htmlFor="department" className="text-xs">Department</Label>
                      <Select
                        value={editedProfile.department || "unset"}
                        onValueChange={(value: Department) =>
                          setEditedProfile({
                            ...editedProfile,
                            department: value === "unset" ? "" : value
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
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
                    <div className="grid gap-1">
                      <Label htmlFor="specialization" className="text-xs">Specialization</Label>
                      <Input
                        id="specialization"
                        value={editedProfile.specialization}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            specialization: e.target.value
                          })
                        }
                        placeholder="Enter specialization"
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Employment Status */}
                    <div className="grid gap-1">
                      <Label htmlFor="status" className="text-xs">Employment Status</Label>
                      <Select
                        value={editedProfile.status || "unset"}
                        onValueChange={(value: EmploymentStatus) =>
                          setEditedProfile({
                            ...editedProfile,
                            status: value === "unset" ? "" : value
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
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
                  // Non-Editing Fields
                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Building2 className="h-3 w-3 mr-1" />
                      {profile.department || 'No department set'}
                    </div>
                    <div className="flex items-center">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {profile.specialization || 'No specialization set'}
                    </div>
                    <div className="flex items-center">
                      <UserRound className="h-3 w-3 mr-1" />
                      {profile.status || 'No status set'}
                    </div>
                  </div>
                )}
                </div>
                </div>

                </div>

          {/* Edit Profile Button - Bottom Right */}
          <EditProfileButton
            isEditing={isEditing}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            className="absolute top-6 right-6"
          />
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
