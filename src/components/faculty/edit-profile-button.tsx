'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Save, X } from 'lucide-react'

interface EditProfileButtonProps {
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  className?: string
}

export function EditProfileButton({ 
  isEditing,
  onEdit,
  onSave,
  onCancel,
  className 
}: EditProfileButtonProps) {
  if (isEditing) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Button
          variant="outline"
          className="bg-white hover:bg-gray-100"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          className="bg-spup-yellow text-spup-green-dark"
          onClick={onSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      className={cn("bg-white hover:bg-gray-100", className)}
      onClick={onEdit}
    >
      Edit Profile
    </Button>
  )
} 