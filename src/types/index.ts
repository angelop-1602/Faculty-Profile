export type Department = 'SASTE' | 'SITE' | 'SBHAM' | 'SNAHS' | 'SOM' | 'BEU' | ''
export type EmploymentStatus = 'Part time' | 'Full time' | ''
export type ResearchStatus = 'on-going' | 'completed'
export type ResearchType = 'self-funded' | 'funded'

export interface Education {
  degree: string
  institution: string
  year: number
}

export interface ResearchEngagement {
  title: string
  year: number
  document?: string
}

export interface ResearchPublication {
  title: string
  year: number
  link?: string
  doi?: string
}

export interface ResearchTitle {
  title: string
  year: number
  type: ResearchType
  fundingAgency?: string
  status: ResearchStatus
  paper?: string
}

export interface FacultyProfile {
  id: string
  createdAt: Date
  updatedAt: Date
  name: string
  email: string
  department: Department
  status: EmploymentStatus
  specialization: string
  education: Education[]
  researchEngagements: ResearchEngagement[]
  researchPublications: ResearchPublication[]
  researchTitles: ResearchTitle[]
}

export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'faculty' | 'admin'
  facultyProfileId?: string
} 