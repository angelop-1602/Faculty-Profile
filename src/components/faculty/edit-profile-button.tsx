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
  // Shared glass-effect classes (no border, no focus outlines)
  const glassButtonClasses = `
    bg-white/20
    backdrop-blur-md
    text-white
    transition-colors
    hover:bg-white/30
    focus:outline-none
    focus:ring-0
    focus-visible:outline-none
    focus-visible:ring-0
    !outline-none
    !ring-0
    border-none
  `

  if (isEditing) {
    return (
      <div className={cn('flex gap-2', className)}>
        <Button
          className={glassButtonClasses}
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          className={glassButtonClasses}
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
      // If you want a glass effect even for the Edit button, use the same glassButtonClasses:
      className={cn(glassButtonClasses, className)}
      onClick={onEdit}
    >
      Edit Profile
    </Button>
  )
}
