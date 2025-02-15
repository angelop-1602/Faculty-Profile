'use client'

import { useState } from 'react'
import { FacultyProfile, ResearchPublication } from '@/types/faculty'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'
import { ExternalLink } from 'lucide-react'

interface ResearchPublicationsSectionProps {
  profile: FacultyProfile
  setProfile: (profile: FacultyProfile) => void
}

export function ResearchPublicationsSection({ profile, setProfile }: ResearchPublicationsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<ResearchPublication>({
    title: '',
    journal: '',
    year: '',
    link: '',
  })
  const { toast } = useToast()

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setFormData(profile.researchPublications[index])
    setIsOpen(true)
  }

  const handleDelete = async (index: number) => {
    try {
      const updatedPublications = [...profile.researchPublications]
      updatedPublications.splice(index, 1)

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchPublications: updatedPublications,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchPublications: updatedPublications,
        updatedAt: new Date()
      })

      toast({
        title: 'Research Publication Deleted',
        description: 'Your research publication has been deleted successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error) {
      console.error('Error deleting research publication:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete research publication. Please try again.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  const handleAddResearchPublication = async () => {
    try {
      const updatedPublications = [...profile.researchPublications]
      if (editIndex !== null) {
        updatedPublications[editIndex] = formData
      } else {
        updatedPublications.push(formData)
      }

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchPublications: updatedPublications,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchPublications: updatedPublications,
        updatedAt: new Date()
      })

      toast({
        title: editIndex !== null ? 'Research Publication Updated' : 'Research Publication Added',
        description: editIndex !== null 
          ? 'Your research publication has been updated successfully.'
          : 'Your research publication has been added successfully.',
        className: 'bg-green-500 text-white'
      })
      setIsOpen(false)
      setFormData({
        title: '',
        journal: '',
        year: '',
        link: '',
      })
      setEditIndex(null)
    } catch (error) {
      console.error('Error saving research publication:', error)
      toast({
        title: 'Error',
        description: 'Failed to save research publication. Please try again.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Research Publications</CardTitle>
          <CardDescription>Your published research papers</CardDescription>
        </div>
        <Button onClick={() => {
          setFormData({
            title: '',
            journal: '',
            year: '',
            link: '',
          })
          setEditIndex(null)
          setIsOpen(true)
        }}>Add</Button>
      </CardHeader>
      <CardContent>
        {profile.researchPublications.length === 0 ? (
          <p className="text-muted-foreground">No research publications added yet.</p>
        ) : (
          <div className="space-y-6">
            {profile.researchPublications.map((publication, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{publication.title}</h3>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Journal/Conference: {publication.journal}</span>
                        <span>Year: {publication.year}</span>
                      </div>
                      {publication.link && (
                        <div className="mt-2">
                          <a
                            href={publication.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Publication
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(index)}
                    >
                      Delete
                    </Button>
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
              {editIndex !== null ? 'Edit Research Publication' : 'Add Research Publication'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter publication title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="journal">Journal/Conference</Label>
              <Input
                id="journal"
                value={formData.journal}
                onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                placeholder="Enter journal or conference name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="e.g., 2023"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">URL/DOI</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="Enter URL or DOI (e.g., https://doi.org/...)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => {
              setIsOpen(false)
              setEditIndex(null)
              setFormData({
                title: '',
                journal: '',
                year: '',
                link: '',
              })
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddResearchPublication}>
              {editIndex !== null ? 'Save Changes' : 'Add Publication'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 