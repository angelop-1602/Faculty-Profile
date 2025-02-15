import { FacultyProfile } from '@/types/faculty'

export const exportToExcel = (profiles: FacultyProfile[]) => {
  // Create CSV content
  const headers = [
    'Name',
    'Email',
    'Department',
    'Status',
    'Specialization',
    'Research Publications',
    'Research Engagements',
    'Research Titles',
    'Total Research Count'
  ]

  const rows = profiles.map(profile => [
    profile.name,
    profile.email,
    profile.department || 'Not set',
    profile.status || 'Not set',
    profile.specialization || 'Not set',
    profile.researchPublications?.length || 0,
    profile.researchEngagements?.length || 0,
    profile.researchTitles?.length || 0,
    (profile.researchPublications?.length || 0) +
    (profile.researchEngagements?.length || 0) +
    (profile.researchTitles?.length || 0)
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'faculty_research_data.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
} 