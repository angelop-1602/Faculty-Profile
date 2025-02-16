import { AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface LoadingProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  error?: boolean
  errorMessage?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
}

export function Loading({
  message = 'Loading...',
  className,
  size = 'md',
  fullScreen = false,
  error = false,
  errorMessage
}: LoadingProps) {
  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      fullScreen && 'min-h-screen',
      className
    )}>
      {error ? (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {errorMessage || 'Please check your connection and try again.'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Loader2 className={cn('animate-spin text-spup-green', sizeClasses[size])} />
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
} 