'use client'

import { useState } from 'react'
import { FacultyProfile, Education } from '@/types/faculty'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'

interface EducationSectionProps {
  profile: FacultyProfile
  setProfile: (profile: FacultyProfile) => void
}

export function EducationSection({ profile, setProfile }: EducationSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<Education>({
    degree: '',
    institution: '',
    year: '',
    field: '',
  })
  const { toast } = useToast()

  const handleAddEducation = async () => {
    try {
      const updatedEducation = [...(profile.education || []), formData]
      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        education: updatedEducation,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        education: updatedEducation,
        updatedAt: new Date()
      })

      toast({
        title: 'Education Added',
        description: 'Your education record has been added successfully.'
      })
      setIsOpen(false)
      setFormData({
        degree: '',
        institution: '',
        year: '',
        field: '',
      })
    } catch (error) {
      console.error('Error adding education:', error)
      toast({
        title: 'Error',
        description: 'Failed to add education record. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Education</CardTitle>
          <CardDescription>Your academic background and qualifications</CardDescription>
        </div>
        <Button onClick={() => setIsOpen(true)}>Add</Button>
      </CardHeader>
      <CardContent>
        {(!profile.education || profile.education.length === 0) ? (
          <p className="text-muted-foreground">No education records added yet.</p>
        ) : (
          <div className="space-y-6">
            {profile.education.map((edu, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">{edu.degree}</h3>
                <p className="text-muted-foreground">{edu.field}</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span>{edu.institution}</span>
                  <span>{edu.year}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder="e.g., Bachelor of Science"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="field">Field of Study</Label>
              <Input
                id="field"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g., University of Example"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g., 2020"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEducation}>
              Add Education
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 