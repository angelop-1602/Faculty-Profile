'use client'

import { useState } from 'react'
import { FacultyProfile, ResearchEngagement } from '@/types/faculty'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'
import { FileUp } from 'lucide-react'

interface ResearchEngagementsSectionProps {
  profile: FacultyProfile
  setProfile: (profile: FacultyProfile) => void
}

export function ResearchEngagementsSection({ profile, setProfile }: ResearchEngagementsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<ResearchEngagement>({
    title: '',
    role: '',
    year: '',
    certificate: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setFormData(profile.researchEngagements[index])
    setIsOpen(true)
  }

  const handleDelete = async (index: number) => {
    try {
      const updatedEngagements = [...profile.researchEngagements]
      updatedEngagements.splice(index, 1)

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchEngagements: updatedEngagements,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchEngagements: updatedEngagements,
        updatedAt: new Date()
      })

      toast({
        title: 'Research Engagement Deleted',
        description: 'Your research engagement has been deleted successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error) {
      console.error('Error deleting research engagement:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete research engagement. Please try again.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  const handleAddResearchEngagement = async () => {
    try {
      let certificateUrl = formData.certificate
      if (file) {
        const storageRef = ref(storage, `certificates/${profile.email}/${file.name}`)
        const snapshot = await uploadBytes(storageRef, file)
        certificateUrl = await getDownloadURL(snapshot.ref)
      }

      const newEngagement = {
        ...formData,
        certificate: certificateUrl
      }

      const updatedEngagements = [...profile.researchEngagements]
      if (editIndex !== null) {
        updatedEngagements[editIndex] = newEngagement
      } else {
        updatedEngagements.push(newEngagement)
      }

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchEngagements: updatedEngagements,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchEngagements: updatedEngagements,
        updatedAt: new Date()
      })

      toast({
        title: editIndex !== null ? 'Research Engagement Updated' : 'Research Engagement Added',
        description: editIndex !== null 
          ? 'Your research engagement has been updated successfully.'
          : 'Your research engagement has been added successfully.',
        className: 'bg-green-500 text-white'
      })
      setIsOpen(false)
      setFormData({
        title: '',
        role: '',
        year: '',
        certificate: '',
      })
      setFile(null)
      setEditIndex(null)
    } catch (error) {
      console.error('Error saving research engagement:', error)
      toast({
        title: 'Error',
        description: 'Failed to save research engagement. Please try again.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Research Engagements</CardTitle>
          <CardDescription>Your participation in research activities</CardDescription>
        </div>
        <Button onClick={() => {
          setFormData({
            title: '',
            role: '',
            year: '',
            certificate: '',
          })
          setFile(null)
          setEditIndex(null)
          setIsOpen(true)
        }}>Add</Button>
      </CardHeader>
      <CardContent>
        {profile.researchEngagements.length === 0 ? (
          <p className="text-muted-foreground">No research engagements added yet.</p>
        ) : (
          <div className="space-y-6">
            {profile.researchEngagements.map((engagement, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{engagement.title}</h3>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Role: {engagement.role}</span>
                        <span>Year: {engagement.year}</span>
                      </div>
                      {engagement.certificate && (
                        <div className="mt-2">
                          <a
                            href={engagement.certificate}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2"
                          >
                            <FileUp className="h-4 w-4" />
                            View Certificate
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
              {editIndex !== null ? 'Edit Research Engagement' : 'Add Research Engagement'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter engagement title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Presenter, Participant"
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
              <Label htmlFor="certificate">Certificate</Label>
              <Input
                id="certificate"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {formData.certificate && !file && (
                <div className="text-sm text-muted-foreground">
                  Current certificate: 
                  <a
                    href={formData.certificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    View
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => {
              setIsOpen(false)
              setEditIndex(null)
              setFormData({
                title: '',
                role: '',
                year: '',
                certificate: '',
              })
              setFile(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddResearchEngagement}>
              {editIndex !== null ? 'Save Changes' : 'Add Engagement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 