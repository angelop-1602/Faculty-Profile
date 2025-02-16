'use client'

import { useState, useRef, useCallback } from 'react'
import { FacultyProfile, ResearchEngagement } from '@/types/faculty'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { doc, updateDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase/config'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { useToast } from '@/components/ui/use-toast'
import { Edit2, Trash2, Plus, Calendar, UserCircle2, ExternalLink } from 'lucide-react'

interface ResearchEngagementsSectionProps {
  profile: FacultyProfile
  setProfile: (profile: FacultyProfile) => void
  onUpdate?: (engagements: ResearchEngagement[]) => void
}

export function ResearchEngagementsSection({ 
  profile, 
  setProfile,
  onUpdate 
}: ResearchEngagementsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<ResearchEngagement>({
    title: '',
    role: '',
    year: '',
    certificate: '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpdate = useCallback(async (updatedEngagements: ResearchEngagement[]) => {
    if (onUpdate) {
      onUpdate(updatedEngagements)
    } else {
      setProfile({
        ...profile,
        researchEngagements: updatedEngagements
      })
    }
  }, [profile, setProfile, onUpdate])

  const handleEdit = (index: number) => {
    setEditIndex(index)
    const engagements = profile.researchEngagements || []
    const engagement = engagements[index]
    if (engagement) {
      setFormData(engagement)
    }
    setIsOpen(true)
  }

  const handleDelete = async (index: number) => {
    try {
      const engagements = profile.researchEngagements || []
      const engagement = engagements[index]
      if (!engagement) return

      const updatedEngagements = [...engagements]
      updatedEngagements.splice(index, 1)
      
      await handleUpdate(updatedEngagements)
    } catch (error) {
      console.error('Error deleting research engagement:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete research engagement.',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (file: File): Promise<string | undefined> => {
    if (!file) return undefined

    try {
      setIsUploading(true)
      const fileRef = ref(storage, `research-engagements/${profile.email}/${Date.now()}_${file.name}`)
      await uploadBytes(fileRef, file)
      const downloadURL = await getDownloadURL(fileRef)
      return downloadURL
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddResearchEngagement = async () => {
    try {
      if (!formData.title || !formData.role || !formData.year) {
        toast({
          title: 'Missing Fields',
          description: 'Please fill in all required fields.',
          className: 'bg-red-500 text-white'
        })
        return
      }

      let certificateUrl: string | undefined = formData.certificate
      const fileInput = fileInputRef.current

      if (fileInput?.files?.length) {
        try {
          const uploadedUrl = await handleFileUpload(fileInput.files[0])
          if (uploadedUrl) {
            certificateUrl = uploadedUrl
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to upload file. Please try again.',
            className: 'bg-red-500 text-white'
          })
          return
        }
      }

      const newEngagement: ResearchEngagement = {
        ...formData,
        certificate: certificateUrl
      }

      const currentEngagements = profile.researchEngagements || []
      const updatedEngagements = [...currentEngagements]
      
      if (editIndex !== null) {
        updatedEngagements[editIndex] = newEngagement
      } else {
        updatedEngagements.push(newEngagement)
      }

      await handleUpdate(updatedEngagements)

      setIsOpen(false)
      setEditIndex(null)
      setFormData({
        title: '',
        role: '',
        year: '',
        certificate: '',
      })

      toast({
        title: editIndex !== null ? 'Research Engagement Updated' : 'Research Engagement Added',
        description: editIndex !== null 
          ? 'The research engagement has been updated successfully.'
          : 'The research engagement has been added successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save research engagement.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Research Engagements</CardTitle>
        <Button 
          onClick={() => {
            setFormData({
              title: '',
              role: '',
              year: '',
              certificate: '',
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
        {(!profile.researchEngagements || profile.researchEngagements.length === 0) ? (
          <p className="text-muted-foreground">No research engagements added yet.</p>
        ) : (
          <div className="grid gap-4">
            {profile.researchEngagements.map((engagement, index) => (
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
                <h3 className="font-semibold text-lg text-spup-green pr-20">{engagement.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <UserCircle2 className="h-4 w-4 text-gray-400" />
                    {engagement.role}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {engagement.year}
                  </div>
                  {engagement.certificate && (
                    <a
                      href={engagement.certificate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-spup-green hover:text-spup-green-dark"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Certificate
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
            <DialogTitle>{editIndex !== null ? 'Edit Research Engagement' : 'Add Research Engagement'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter research engagement title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Enter your role"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="Enter year"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="certificate">Certificate</Label>
              <Input
                id="certificate"
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="cursor-pointer"
                disabled={isUploading}
              />
              {isUploading && <p className="text-sm text-muted-foreground">Uploading file...</p>}
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
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddResearchEngagement} 
              className="bg-spup-green hover:bg-spup-green-dark"
              disabled={isUploading}
            >
              {editIndex !== null ? 'Save Changes' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 