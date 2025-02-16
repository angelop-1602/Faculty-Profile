'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { auth, db } from '@/lib/firebase/config'
import { checkUserRole } from '@/lib/firebase/auth'
import type { UserRole } from '@/lib/firebase/auth'
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { useFirestoreConnection } from '@/lib/hooks/use-firestore-connection'
import { useToast } from '@/components/ui/use-toast'
import { Loading } from '@/components/ui/loading'

interface AuthContextType {
  user: User | null
  loading: boolean
  role: UserRole
  isOnline: boolean
  hasError: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  isOnline: true,
  hasError: false
})

const publicPaths = ['/', '/login']

// Profile image cache functions
const cacheProfileImage = async (email: string, imageUrl: string) => {
  try {
    // Try to fetch WebP version first
    const webpResponse = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/webp,*/*'
      }
    })
    
    if (!webpResponse.ok) {
      throw new Error('Failed to fetch WebP image')
    }

    const blob = await webpResponse.blob()
    const reader = new FileReader()
    
    return new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        try {
          const base64data = reader.result as string
          localStorage.setItem(`profile_image_${email}`, base64data)
          resolve(base64data)
        } catch (error) {
          console.error('Error storing profile image in localStorage:', error)
          reject(error)
        }
      }
      reader.onerror = (error) => {
        console.error('Error reading profile image:', error)
        reject(error)
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error caching profile image:', error)
    // Fallback to original image if WebP fails
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch original image')
      }
      const blob = await response.blob()
      const reader = new FileReader()
      
      return new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64data = reader.result as string
            localStorage.setItem(`profile_image_${email}`, base64data)
            resolve(base64data)
          } catch (error) {
            console.error('Error storing profile image in localStorage:', error)
            reject(error)
          }
        }
        reader.onerror = (error) => {
          console.error('Error reading profile image:', error)
          reject(error)
        }
        reader.readAsDataURL(blob)
      })
    } catch (fallbackError) {
      console.error('Error caching original profile image:', fallbackError)
      return null
    }
  }
}

const getCachedProfileImage = (email: string): string | null => {
  return localStorage.getItem(`profile_image_${email}`)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { isOnline, hasError } = useFirestoreConnection()
  const { toast } = useToast()

  // Handle role check and redirection
  const checkRoleAndRedirect = async (user: User) => {
    try {
      if (!user.email) {
        setRole(null)
        router.push('/')
        return
      }

      const userRole = await checkUserRole(user.email)
      setRole(userRole)

      // Handle profile image caching
      if (user.photoURL) {
        const cachedImage = getCachedProfileImage(user.email)
        if (!cachedImage) {
          const newCachedImage = await cacheProfileImage(user.email, user.photoURL)
          if (newCachedImage && isOnline && !hasError) {
            try {
              const docRef = doc(db, userRole === 'faculty' ? 'faculty_profiles' : 'admin_users', user.email)
              await updateDoc(docRef, {
                photoURL: newCachedImage,
                lastLogin: serverTimestamp()
              })
            } catch (error) {
              console.error('Error updating profile photo:', error)
            }
          }
        }
      }

      // Update user's last login in Firestore only when online and no errors
      if (isOnline && !hasError) {
        try {
          const docRef = doc(db, userRole === 'faculty' ? 'faculty_profiles' : 'admin_users', user.email)
          await updateDoc(docRef, {
            lastLogin: serverTimestamp()
          })
        } catch (error) {
          console.error('Error updating last login:', error)
        }
      }

      if (userRole === 'admin') {
        if (publicPaths.includes(pathname) || !pathname.startsWith('/admin')) {
          router.push('/admin')
        }
      } else if (userRole === 'faculty') {
        if (publicPaths.includes(pathname) || pathname.startsWith('/admin')) {
          router.push('/faculty')
        }
      } else {
        // New user or unauthorized
        router.push('/')
      }
    } catch (error) {
      console.error('Error checking role:', error)
      setRole(null)
      router.push('/')
    }
  }

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true)
      
      if (user) {
        // Try to get cached profile image
        if (user.email) {
          const cachedImage = getCachedProfileImage(user.email)
          if (cachedImage && (!user.photoURL || user.photoURL !== cachedImage)) {
            // Create a new user object with the cached image
            const userWithCachedImage = Object.assign({}, user, {
              photoURL: cachedImage
            })
            setUser(userWithCachedImage)
          } else {
            setUser(user)
          }
        } else {
          setUser(user)
        }
        await checkRoleAndRedirect(user)
      } else {
        setUser(null)
        setRole(null)
        if (!publicPaths.includes(pathname)) {
          router.push('/')
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [pathname, isOnline])

  // Show offline notification
  useEffect(() => {
    if (!isOnline) {
      toast({
        title: 'You are offline',
        description: 'Some features may be limited until connection is restored.',
        variant: 'default',
      })
    }
  }, [isOnline, toast])

  if (loading) {
    return <Loading message="Loading authentication..." />
  }

  if (hasError) {
    return <Loading error errorMessage="Please disable ad blockers or privacy extensions for this site to function properly." />
  }

  return (
    <AuthContext.Provider value={{ user, loading, role, isOnline, hasError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}