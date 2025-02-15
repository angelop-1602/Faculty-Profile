import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app, process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)

// Configure storage with custom settings
const storageRef = getStorage(app, undefined)

export { auth, db, storage, storageRef }

// Helper function to handle file upload errors
export const handleUploadError = (error: any) => {
  console.error('Upload error:', error)
  if (error.code === 'storage/unauthorized') {
    return 'User is not authorized to upload files.'
  } else if (error.code === 'storage/canceled') {
    return 'Upload was cancelled.'
  } else if (error.code === 'storage/unknown') {
    return 'An unknown error occurred.'
  }
  return 'Failed to upload file. Please try again.'
} 