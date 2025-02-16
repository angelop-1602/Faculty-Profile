import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Check if user is an admin
    const adminRef = doc(db, 'admin_users', email)
    const adminDoc = await getDoc(adminRef)

    if (adminDoc.exists()) {
      return NextResponse.json({ role: 'admin' })
    }

    // If not admin, check faculty profile
    const facultyRef = doc(db, 'faculty_profiles', email)
    const facultyDoc = await getDoc(facultyRef)

    if (facultyDoc.exists()) {
      return NextResponse.json({ role: 'faculty' })
    }

    // If no profile exists, default to faculty role
    return NextResponse.json({ role: 'faculty' })
  } catch (error) {
    console.error('Error checking user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 