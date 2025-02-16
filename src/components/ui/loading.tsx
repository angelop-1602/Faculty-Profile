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
  blur?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-12 h-12'
}

export function Loading({
  message = 'Loading...',
  className,
  size = 'md',
  fullScreen = false,
  error = false,
  errorMessage,
  blur = false
}: LoadingProps) {
  const content = (
    <div className={cn(
      "w-full h-full flex flex-col items-center justify-center text-center gap-4",
      className
    )}>
      {error ? (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <AlertTitle className="text-red-600">Connection Error</AlertTitle>
          <AlertDescription>
            {errorMessage || 'Please check your connection and try again.'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Loader2 className={cn('animate-spin text-spup-green', sizeClasses[size])} />
          {message && <p className="text-sm text-gray-300 animate-pulse">{message}</p>}
        </>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 min-w-[200px] flex items-center justify-center">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[100px] flex items-center justify-center">
      {content}
    </div>
  )
}
