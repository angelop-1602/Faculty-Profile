'use client'

import { useState } from 'react'
import { FacultyProfile, ResearchTitle, ResearchType, ResearchStatus } from '@/types/faculty'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase/config'
import { useToast } from '@/components/ui/use-toast'
import { FileUp, X } from 'lucide-react'
import { handleUploadError } from '@/lib/firebase/config'

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
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive'
        })
        return
      }
      setFile(file)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    // Reset the file input
    const fileInput = document.getElementById('paper') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleEdit = (index: number) => {
    setEditIndex(index)
    setFormData(profile.researchTitles?.[index] || {
      title: '',
      year: '',
      type: 'self-funded',
      fundingAgency: '',
      status: 'on-going',
      paper: '',
    })
    setIsOpen(true)
  }

  const handleDelete = async (index: number) => {
    try {
      const updatedTitles = [...(profile.researchTitles || [])]
      updatedTitles.splice(index, 1)

      // Update the research count
      const updatedResearchCount = {
        total: (profile.researchCount?.publications || 0) + 
               (profile.researchCount?.engagements || 0) + 
               updatedTitles.length,
        publications: profile.researchCount?.publications || 0,
        engagements: profile.researchCount?.engagements || 0,
        titles: updatedTitles.length
      }

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchTitles: updatedTitles,
        researchCount: updatedResearchCount,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchTitles: updatedTitles,
        researchCount: updatedResearchCount,
        updatedAt: new Date()
      })

      toast({
        title: 'Research Title Deleted',
        description: 'Your research title has been deleted successfully.',
        className: 'bg-green-500 text-white'
      })
    } catch (error) {
      console.error('Error deleting research title:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete research title. Please try again.',
        className: 'bg-red-500 text-white'
      })
    }
  }

  const handleAddResearchTitle = async () => {
    try {
      let paperUrl = formData.paper
      if (file && formData.status === 'completed') {
        try {
          // Create a unique filename to prevent overwriting
          const timestamp = Date.now()
          const uniqueFileName = `${timestamp}_${file.name}`
          const storageRef = ref(storage, `faculty_profiles/${profile.email}/research_titles/${uniqueFileName}`)
          
          // Show upload progress
          toast({
            title: 'Uploading File',
            description: 'Please wait while we upload your file...',
          })
          
          const snapshot = await uploadBytes(storageRef, file)
          paperUrl = await getDownloadURL(snapshot.ref)
          
          toast({
            title: 'File Uploaded',
            description: 'Your file has been uploaded successfully.',
            className: 'bg-green-500 text-white'
          })
        } catch (error) {
          const errorMessage = handleUploadError(error)
          toast({
            title: 'Upload Error',
            description: errorMessage,
            variant: 'destructive'
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
        updatedTitles[editIndex] = newTitle
      } else {
        updatedTitles.push(newTitle)
      }

      // Update the research count
      const updatedResearchCount = {
        total: (profile.researchCount?.publications || 0) + 
               (profile.researchCount?.engagements || 0) + 
               updatedTitles.length,
        publications: profile.researchCount?.publications || 0,
        engagements: profile.researchCount?.engagements || 0,
        titles: updatedTitles.length
      }

      await updateDoc(doc(db, 'faculty_profiles', profile.email), {
        researchTitles: updatedTitles,
        researchCount: updatedResearchCount,
        updatedAt: new Date()
      })

      setProfile({
        ...profile,
        researchTitles: updatedTitles,
        researchCount: updatedResearchCount,
        updatedAt: new Date()
      })

      toast({
        title: editIndex !== null ? 'Research Title Updated' : 'Research Title Added',
        description: editIndex !== null 
          ? 'Your research title has been updated successfully.'
          : 'Your research title has been added successfully.',
        className: 'bg-green-500 text-white'
      })
      setIsOpen(false)
      setFormData({
        title: '',
        year: '',
        type: 'self-funded',
        fundingAgency: '',
        status: 'on-going',
        paper: '',
      })
      setFile(null)
      setEditIndex(null)
    } catch (error) {
      console.error('Error saving research title:', error)
      toast({
        title: 'Error',
        description: 'Failed to save research title. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Research Titles</CardTitle>
          <CardDescription>Your research projects and their status</CardDescription>
        </div>
        <Button onClick={() => {
          setFormData({
            title: '',
            year: '',
            type: 'self-funded',
            fundingAgency: '',
            status: 'on-going',
            paper: '',
          })
          setFile(null)
          setEditIndex(null)
          setIsOpen(true)
        }}>Add</Button>
      </CardHeader>
      <CardContent>
        {(!profile.researchTitles || profile.researchTitles.length === 0) ? (
          <p className="text-muted-foreground">No research titles added yet.</p>
        ) : (
          <div className="space-y-6">
            {profile.researchTitles.map((title, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{title.title}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={title.type === 'funded' ? 'default' : 'secondary'}>
                        {title.type}
                      </Badge>
                      <Badge variant={title.status === 'completed' ? 'default' : 'outline'}>
                        {title.status}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Year: {title.year}</span>
                        {title.fundingAgency && (
                          <span>Funding Agency: {title.fundingAgency}</span>
                        )}
                      </div>
                      {title.paper && (
                        <div className="mt-2">
                          <a
                            href={title.paper}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2"
                          >
                            <FileUp className="h-4 w-4" />
                            View Paper
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
              {editIndex !== null ? 'Edit Research Title' : 'Add Research Title'}
            </DialogTitle>
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
                placeholder="e.g., 2023"
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="paper"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="flex-1"
                    />
                    {file && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                    </p>
                  )}
                  {formData.paper && !file && (
                    <div className="text-sm text-muted-foreground">
                      Current paper: 
                      <a
                        href={formData.paper}
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
              setFile(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddResearchTitle}>
              {editIndex !== null ? 'Save Changes' : 'Add Research Title'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 