'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithMicrosoft } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { toast } from '@/components/ui/use-toast'

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  const handleMicrosoftLogin = async () => {
    setError(null)
    try {
      setLoading(true)
      const { user, role } = await signInWithMicrosoft()
      
      try {
        // Immediately check role and redirect
        const adminRef = doc(db, 'admin_users', user.email!)
        const adminDoc = await getDoc(adminRef)

        if (adminDoc.exists()) {
          router.push('/admin')
        } else {
          router.push('/faculty')
        }
      } catch (error) {
        console.error('Error checking role:', error)
        toast({
          title: 'Error',
          description: 'Failed to check user role. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: 'Error signing in',
        description: error.message || 'An error occurred during sign in. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // If already logged in, show loading state
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Faculty Research Portfolio
          </CardTitle>
          <CardDescription className="text-center">
            Sign in with your SPUP Microsoft account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <Button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white"
            size="lg"
          >
            {loading ? (
              'Signing in...'
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                </svg>
                <span>Sign in with Microsoft</span>
              </div>
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            By signing in, you agree to use your institutional Microsoft account
          </p>
        </CardContent>
      </Card>
    </main>
  )
} 