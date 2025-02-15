import { FacultyProfile, Education, ResearchEngagement, ResearchPublication, ResearchTitle } from '@/types/faculty'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface StructuredRow {
  // Faculty Details
  email: string
  name: string
  department: string
  specialization: string
  status: string
  
  // Education Details
  educationDegree: string
  educationField: string
  educationInstitution: string
  educationYear: string
  
  // Research Engagement Details
  engagementTitle: string
  engagementRole: string
  engagementYear: string
  engagementCertificate: string
  
  // Research Publication Details
  publicationTitle: string
  publicationJournal: string
  publicationYear: string
  publicationLink: string
  
  // Research Title Details
  researchTitle: string
  researchType: string
  researchStatus: string
  researchYear: string
  researchFundingAgency: string
  researchPaper: string
}

// Helper function to format date
const formatDate = (timestamp: any): string => {
  if (!timestamp) return ''
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return ''
  }
}

// Helper function to format arrays of objects into string
const formatArrayData = (array: any[] | undefined, fields: string[]): string => {
  if (!array || array.length === 0) return ''
  return array.map(item => 
    fields.map(field => `${field}: ${item[field] || ''}`).join('; ')
  ).join(' | ')
}

export const exportFacultyProfiles = async () => {
  try {
    // Fetch all faculty profiles
    const querySnapshot = await getDocs(collection(db, 'faculty_profiles'))
    const profiles = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as FacultyProfile[]

    // Define headers with grouping
    const headers = [
      // Faculty Details Group
      'Email',
      'Name',
      'Department',
      'Specialization',
      'Status',
      
      // Education Group
      'Degree',
      'Field',
      'Institution',
      'Year',
      
      // Research Engagements Group
      'Engagement Title',
      'Role',
      'Engagement Year',
      'Certificate',
      
      // Research Publications Group
      'Publication Title',
      'Journal',
      'Publication Year',
      'Link',
      
      // Research Titles Group
      'Research Title',
      'Type',
      'Status',
      'Research Year',
      'Funding Agency',
      'Paper'
    ]

    // Transform profiles into structured rows
    const rows: StructuredRow[] = []

    profiles.forEach(profile => {
      // Get the maximum number of entries across all arrays
      const maxEntries = Math.max(
        profile.education?.length || 0,
        profile.researchEngagements?.length || 0,
        profile.researchPublications?.length || 0,
        profile.researchTitles?.length || 0
      )

      // If there are no entries at all, create at least one row for the faculty
      if (maxEntries === 0) {
        rows.push({
          email: profile.email,
          name: profile.name,
          department: profile.department || '',
          specialization: profile.specialization || '',
          status: profile.status || '',
          educationDegree: '',
          educationField: '',
          educationInstitution: '',
          educationYear: '',
          engagementTitle: '',
          engagementRole: '',
          engagementYear: '',
          engagementCertificate: '',
          publicationTitle: '',
          publicationJournal: '',
          publicationYear: '',
          publicationLink: '',
          researchTitle: '',
          researchType: '',
          researchStatus: '',
          researchYear: '',
          researchFundingAgency: '',
          researchPaper: ''
        })
      }

      // Create rows for each entry
      for (let i = 0; i < maxEntries; i++) {
        const row: StructuredRow = {
          // Faculty details only appear in the first row
          email: i === 0 ? profile.email : '',
          name: i === 0 ? profile.name : '',
          department: i === 0 ? profile.department || '' : '',
          specialization: i === 0 ? profile.specialization || '' : '',
          status: i === 0 ? profile.status || '' : '',
          
          // Education details
          educationDegree: profile.education?.[i]?.degree || '',
          educationField: profile.education?.[i]?.field || '',
          educationInstitution: profile.education?.[i]?.institution || '',
          educationYear: profile.education?.[i]?.year || '',
          
          // Research Engagement details
          engagementTitle: profile.researchEngagements?.[i]?.title || '',
          engagementRole: profile.researchEngagements?.[i]?.role || '',
          engagementYear: profile.researchEngagements?.[i]?.year || '',
          engagementCertificate: profile.researchEngagements?.[i]?.certificate || '',
          
          // Research Publication details
          publicationTitle: profile.researchPublications?.[i]?.title || '',
          publicationJournal: profile.researchPublications?.[i]?.journal || '',
          publicationYear: profile.researchPublications?.[i]?.year || '',
          publicationLink: profile.researchPublications?.[i]?.link || '',
          
          // Research Title details
          researchTitle: profile.researchTitles?.[i]?.title || '',
          researchType: profile.researchTitles?.[i]?.type || '',
          researchStatus: profile.researchTitles?.[i]?.status || '',
          researchYear: profile.researchTitles?.[i]?.year || '',
          researchFundingAgency: profile.researchTitles?.[i]?.fundingAgency || '',
          researchPaper: profile.researchTitles?.[i]?.paper || ''
        }
        rows.push(row)
      }
    })

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        Object.values(row).map(cell => {
          // Escape special characters and wrap in quotes
          const escaped = (cell || '').toString().replace(/"/g, '""')
          return `"${escaped}"`
        }).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const date = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `faculty_research_data_${date}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return {
      success: true,
      message: 'Faculty profiles exported successfully'
    }
  } catch (error) {
    console.error('Error exporting faculty profiles:', error)
    return {
      success: false,
      message: 'Failed to export faculty profiles'
    }
  }
} 