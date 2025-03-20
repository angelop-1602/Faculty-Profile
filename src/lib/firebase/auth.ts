'use client'

import { OAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth'
import { auth, db } from './config'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'

export type UserRole = 'admin' | 'faculty' | null

const microsoftProvider = new OAuthProvider('microsoft.com')
microsoftProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: 'common'
})

// Add Microsoft Graph photo scope
microsoftProvider.addScope('user.read')

const ADMIN_EMAILS = ['cprint@spup.edu.ph'] // Add admin emails here

// Cache profile image in localStorage
const cacheProfileImage = async (email: string, imageBlob: Blob): Promise<string> => {
  try {
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64data = reader.result as string
        localStorage.setItem(`profile_image_${email}`, base64data)
        const objectUrl = URL.createObjectURL(imageBlob)
        resolve(objectUrl)
      }
      reader.onerror = reject
      reader.readAsDataURL(imageBlob)
    })
  } catch (error) {
    console.error('Error caching profile image:', error)
    throw error
  }
}

// Get cached profile image
const getCachedProfileImage = (email: string): string | null => {
  const cachedImage = localStorage.getItem(`profile_image_${email}`)
  return cachedImage
}

export const signInWithMicrosoft = async (): Promise<{ user: User; role: UserRole }> => {
  try {
    const result = await signInWithPopup(auth, microsoftProvider)
    const user = result.user
    const credential = OAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken

    if (!user.email) {
      throw new Error('No email found in user account')
    }

    // Try to get cached image first
    let photoURL = getCachedProfileImage(user.email)

    // If no cached image, fetch from Microsoft Graph
    if (!photoURL && accessToken) {
      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        
        if (response.ok) {
          const blob = await response.blob()
          photoURL = await cacheProfileImage(user.email, blob)
        }
      } catch (error) {
        console.error('Error fetching Microsoft profile photo:', error)
        // Use cached image as fallback if available
        photoURL = getCachedProfileImage(user.email) || user.photoURL
      }
    }

    // Check if user is an admin
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      const adminRef = doc(db, 'admin_users', user.email)
      await setDoc(adminRef, {
        lastLogin: serverTimestamp(),
        email: user.email,
        name: user.displayName || '',
        photoURL,
      }, { merge: true })
      return { user, role: 'admin' }
    }

    // Check if user has a faculty profile
    const facultyRef = doc(db, 'faculty_profiles', user.email)
    const facultyDoc = await getDoc(facultyRef)
    
    if (facultyDoc.exists()) {
      // Update faculty's last login and photo
      await setDoc(facultyRef, {
        lastLogin: serverTimestamp(),
        photoURL,
      }, { merge: true })
      return { user, role: 'faculty' }
    }
    
    // Create a new faculty profile
    await setDoc(facultyRef, {
      email: user.email,
      name: user.displayName || '',
      photoURL,
      department: '',
      status: '',
      specialization: '',
      education: [],
      researchEngagements: [],
      researchPublications: [],
      researchTitles: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })
    
    return { user, role: 'faculty' }
  } catch (error: any) {
    console.error('Error signing in with Microsoft:', error)
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Please allow popups for this site to sign in with Microsoft')
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign in was cancelled. Please try again.')
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in window was closed. Please try again.')
    } else {
      throw error
    }
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
    // Force reload to clear any cached state
    window.location.href = '/'
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export const checkUserRole = async (email: string): Promise<UserRole> => {
  if (!email) return null
  
  try {
    // Check if user is an admin
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      return 'admin'
    }
    
    const facultyRef = doc(db, 'faculty_profiles', email)
    const facultyDoc = await getDoc(facultyRef)
    
    if (facultyDoc.exists()) {
      return 'faculty'
    }
    
    return null
  } catch (error) {
    console.error('Error checking user role:', error)
    return null
  }
} 