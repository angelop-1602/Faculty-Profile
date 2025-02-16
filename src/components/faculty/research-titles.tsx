'use client'

import { useState, useRef } from 'react'
import { FacultyProfile, ResearchTitle, ResearchType, ResearchStatus } from '@/types/faculty'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { doc, updateDoc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase/config'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { useToast } from '@/components/ui/use-toast'
import { Edit2, Trash2, Plus, Calendar, FileText, Tag, Activity, ExternalLink, Upload } from 'lucide-react'

interface ResearchTitlesSectionProps {
  profile: FacultyProfile
  setProfile: (profile: FacultyProfile) => void
}

export function ResearchTitlesSection({ profile, setProfile }: ResearchTitlesSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<ResearchTitle>({
    title: '',
    year: '',
    type: 'self-funded',
    fundingAgency: '',
    status: 'on-going',
    paper: '',
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleEdit = (index: number) => {
    setEditIndex(index)
    if (profile.researchTitles && profile.researchTitles[index]) {
      setFormData(profile.researchTitles[index])
    }
    setIsOpen(true)
  }

  const handleDelete = async (index: number) => {
    try {
      const title = profile.researchTitles[index]
      const updatedTitles = [...(profile.researchTitles || [])]
      updatedTitles.splice(index, 1)

      // Delete the file from storage if it exists
      if (title.paper) {
        const fileRef = ref(storage, title.paper)
        await deleteObject(fileRef)
      }

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchTitles: updatedTitles,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchTitles: updatedTitles,
        updatedAt: new Date()
      })

      toast({
        title: 'Research Title Deleted',
        description: 'The research title has been deleted successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete research title.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return null

    try {
      setIsUploading(true)
      const fileRef = ref(storage, `research-titles/${profile.email}/${Date.now()}_${file.name}`)
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

  const handleAddResearchTitle = async () => {
    try {
      if (!formData.title || !formData.year || !formData.type || !formData.status) {
        toast({
          title: 'Missing Fields',
          description: 'Please fill in all required fields.',
          className: 'bg-red-500 text-white'
        })
        return
      }

      let paperUrl = formData.paper
      const fileInput = fileInputRef.current

      if (fileInput?.files?.length && formData.status === 'completed') {
        try {
          paperUrl = await handleFileUpload(fileInput.files[0])
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to upload file. Please try again.',
            className: 'bg-red-500 text-white'
          })
          return
        }
      }

      const newTitle = {
        ...formData,
        paper: paperUrl
      }

      const updatedTitles = [...(profile.researchTitles || [])]
      if (editIndex !== null) {
        // If editing and there's an existing paper URL that's different, delete the old file
        const oldTitle = profile.researchTitles[editIndex]
        if (oldTitle.paper && oldTitle.paper !== paperUrl) {
          const oldFileRef = ref(storage, oldTitle.paper)
          await deleteObject(oldFileRef)
        }
        updatedTitles[editIndex] = newTitle
      } else {
        updatedTitles.push(newTitle)
      }

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchTitles: updatedTitles,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchTitles: updatedTitles,
        updatedAt: new Date()
      })

      setIsOpen(false)
      setEditIndex(null)
      setFormData({
        title: '',
        year: '',
        type: 'self-funded',
        fundingAgency: '',
        status: 'on-going',
        paper: '',
      })

      toast({
        title: editIndex !== null ? 'Research Title Updated' : 'Research Title Added',
        description: editIndex !== null 
          ? 'The research title has been updated successfully.'
          : 'The research title has been added successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save research title.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Research Titles</CardTitle>
        <Button 
          onClick={() => {
            setFormData({
              title: '',
              year: '',
              type: 'self-funded',
              fundingAgency: '',
              status: 'on-going',
              paper: '',
            })
            setEditIndex(null)
            setIsOpen(true)
          }}
          className="bg-spup-green hover:bg-spup-green-dark"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Research Title
        </Button>
      </CardHeader>
      <CardContent>
        {(!profile.researchTitles || profile.researchTitles.length === 0) ? (
          <p className="text-muted-foreground">No research titles added yet.</p>
        ) : (
          <div className="grid gap-4">
            {profile.researchTitles.map((title, index) => (
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
                <h3 className="font-semibold text-lg text-spup-green pr-20">{title.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4 text-gray-400" />
                    {title.type === 'funded' ? `Funded by ${title.fundingAgency}` : 'Self-funded'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4 text-gray-400" />
                    {title.status}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {title.year}
                  </div>
                  {title.paper && (
                    <a
                      href={title.paper}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-spup-green hover:text-spup-green-dark"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Paper
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
            <DialogTitle>{editIndex !== null ? 'Edit Research Title' : 'Add Research Title'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter research title"
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
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ResearchType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self-funded">Self-funded</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === 'funded' && (
              <div className="grid gap-2">
                <Label htmlFor="fundingAgency">Funding Agency</Label>
                <Input
                  id="fundingAgency"
                  value={formData.fundingAgency}
                  onChange={(e) => setFormData({ ...formData, fundingAgency: e.target.value })}
                  placeholder="Enter funding agency"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ResearchStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-going">On-going</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'completed' && (
              <div className="grid gap-2">
                <Label htmlFor="paper">Research Paper</Label>
                <Input
                  id="paper"
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  className="cursor-pointer"
                  disabled={isUploading}
                />
                {isUploading && <p className="text-sm text-muted-foreground">Uploading file...</p>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => {
              setIsOpen(false)
              setEditIndex(null)
              setFormData({
                title: '',
                year: '',
                type: 'self-funded',
                fundingAgency: '',
                status: 'on-going',
                paper: '',
              })
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddResearchTitle} 
              className="bg-spup-green hover:bg-spup-green-dark"
              disabled={isUploading}
            >
              {editIndex !== null ? 'Save Changes' : 'Add Research Title'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 