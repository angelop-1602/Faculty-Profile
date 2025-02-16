'use client'

import { FacultyProfile } from '@/types/faculty'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PersonalInfoSectionProps {
  profile: FacultyProfile
}

export function PersonalInfoSection({ profile }: PersonalInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Your basic information and contact details</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Name</dt>
            <dd className="text-lg">{profile.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="text-lg">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Department</dt>
            <dd className="text-lg">{profile.department || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Employment Status</dt>
            <dd className="text-lg">{profile.status || 'Not set'}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Specialization</dt>
            <dd className="text-lg">{profile.specialization || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
            <dd className="text-lg">{profile.createdAt?.toLocaleDateString() || 'Not available'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
            <dd className="text-lg">{profile.updatedAt?.toLocaleDateString() || 'Not available'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
} 