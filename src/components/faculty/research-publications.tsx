'use client'

import { useState } from 'react'
import { FacultyProfile, ResearchPublication } from '@/types/faculty'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'
import { Edit2, Trash2, Plus, FileText, Calendar, Building2, ExternalLink } from 'lucide-react'

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
    const publications = profile.researchPublications || []
    const publication = publications[index]
    if (publication) {
      setFormData(publication)
    }
    setIsOpen(true)
  }

  const handleDelete = async (index: number) => {
    try {
      const publications = profile.researchPublications || []
      const publication = publications[index]
      if (!publication) return

      const updatedPublications = [...publications]
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
        description: 'The research publication has been deleted successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete research publication.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  const handleAddResearchPublication = async () => {
    try {
      if (!formData.title || !formData.journal || !formData.year || !formData.link) {
        toast({
          title: 'Missing Fields',
          description: 'Please fill in all required fields.',
          className: 'bg-red-500 text-white'
        })
        return
      }

      const newPublication: ResearchPublication = {
        ...formData
      }

      const currentPublications = profile.researchPublications || []
      const updatedPublications = [...currentPublications]
      
      if (editIndex !== null) {
        updatedPublications[editIndex] = newPublication
      } else {
        updatedPublications.push(newPublication)
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
          ? 'Research publication has been updated successfully.'
          : 'Research publication has been added successfully.',
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Research Publications</CardTitle>
        <Button 
          onClick={() => {
            setFormData({
              title: '',
              journal: '',
              year: '',
              link: '',
            })
            setEditIndex(null)
            setIsOpen(true)
          }}
          className="bg-spup-green hover:bg-spup-green-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </CardHeader>
      <CardContent>
        {!profile.researchPublications || profile.researchPublications.length === 0 ? (
          <p className="text-muted-foreground">No research publications added yet.</p>
        ) : (
          <div className="grid gap-4">
            {profile.researchPublications.map((publication, index) => (
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
                <h3 className="font-semibold text-lg text-spup-green pr-20">{publication.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {publication.journal}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {publication.year}
                  </div>
                  {publication.link && (
                    <a
                      href={publication.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-spup-green hover:text-spup-green-dark"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Publication
                    </a>
                  )}
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
            <Button onClick={handleAddResearchPublication} className="bg-spup-green hover:bg-spup-green-dark">
              {editIndex !== null ? 'Save Changes' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 