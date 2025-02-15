'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { auth } from '@/lib/firebase/config'
import { checkUserRole } from '@/lib/firebase/auth'
import type { UserRole } from '@/lib/firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface AuthContextType {
  user: User | null
  loading: boolean
  role: UserRole
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
})

const publicPaths = ['/', '/login']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

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

      // Update user's photo URL in Firestore if it exists
      if (user.photoURL) {
        const docRef = doc(db, userRole === 'faculty' ? 'faculty_profiles' : 'admin_users', user.email)
        await updateDoc(docRef, {
          photoURL: user.photoURL,
          lastLogin: serverTimestamp()
        })
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
      setUser(user)

      if (user) {
        await checkRoleAndRedirect(user)
      } else {
        setRole(null)
        if (!publicPaths.includes(pathname)) {
          router.push('/')
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [pathname])

  // Protect routes based on role
  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin' && !pathname.startsWith('/admin') && !publicPaths.includes(pathname)) {
        router.push('/admin')
      } else if (role === 'faculty' && pathname.startsWith('/admin')) {
        router.push('/faculty')
      }
    }
  }, [loading, user, role, pathname])

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)