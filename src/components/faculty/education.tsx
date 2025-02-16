'use client'

import { useState } from 'react'
import { FacultyProfile, Education } from '@/types/faculty'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'
import { Edit2, Trash2, Plus, GraduationCap, Building2, Calendar, BookOpen } from 'lucide-react'

interface EducationSectionProps {
  profile: FacultyProfile
  setProfile: (profile: FacultyProfile) => void
}

export function EducationSection({ profile, setProfile }: EducationSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<Education>({
    degree: '',
    institution: '',
    year: '',
    field: '',
  })
  const { toast } = useToast()

  const handleEdit = (index: number) => {
    setEditIndex(index)
    const educationList = profile.education || []
    const education = educationList[index]
    if (education) {
      setFormData(education)
    }
    setIsOpen(true)
  }

  const handleDelete = async (index: number) => {
    try {
      const educationList = profile.education || []
      const education = educationList[index]
      if (!education) return

      const updatedEducation = [...educationList]
      updatedEducation.splice(index, 1)

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
        title: 'Education Entry Deleted',
        description: 'The education entry has been deleted successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete education entry.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  const handleSave = async () => {
    try {
      const updatedEducation = [...(profile.education || [])]
      if (editIndex !== null) {
        updatedEducation[editIndex] = formData
      } else {
        updatedEducation.push(formData)
      }

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
        title: editIndex !== null ? 'Education Updated' : 'Education Added',
        description: editIndex !== null 
          ? 'Education record has been updated successfully.'
          : 'Education record has been added successfully.',
        className: 'bg-green-500 text-white'
      })
      setIsOpen(false)
      setFormData({
        degree: '',
        institution: '',
        year: '',
        field: '',
      })
      setEditIndex(null)
    } catch (error) {
      console.error('Error saving education:', error)
      toast({
        title: 'Error',
        description: 'Failed to save education record. Please try again.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Education</CardTitle>
        <Button onClick={() => {
          setFormData({
            degree: '',
            institution: '',
            year: '',
            field: '',
          })
          setEditIndex(null)
          setIsOpen(true)
        }} className="bg-spup-green hover:bg-spup-green-dark">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {(!profile.education || profile.education.length === 0) ? (
          <p className="text-muted-foreground">No education records added yet.</p>
        ) : (
          <div className="grid gap-4">
            {profile.education.map((edu, index) => (
              <div key={index} className="bg-white border rounded-lg p-4 relative group hover:shadow-md transition-shadow">
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4 text-gray-500 hover:text-spup-green" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                  </Button>
                </div>
                <h3 className="font-semibold text-lg text-spup-green pr-20">{edu.degree}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    {edu.field}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {edu.institution}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {edu.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editIndex !== null ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
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
            <Button variant="outline" onClick={() => {
              setIsOpen(false)
              setEditIndex(null)
              setFormData({
                degree: '',
                institution: '',
                year: '',
                field: '',
              })
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-spup-green hover:bg-spup-green-dark">
              {editIndex !== null ? 'Save Changes' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 