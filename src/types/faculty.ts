export type Department = 'SASTE' | 'SITE' | 'SBHAM' | 'SNAHS' | 'SOM' | 'BEU' | '' | 'unset'
export type EmploymentStatus = 'Part time' | 'Full time' | '' | 'unset'
export type ResearchType = 'self-funded' | 'funded'
export type ResearchStatus = 'on-going' | 'completed'

export interface Education {
  degree: string
  institution: string
  year: string
  field: string
}

export interface ResearchEngagement {
  title: string
  role: string
  year: string
  certificate: string
}

export interface ResearchPublication {
  title: string
  journal: string
  year: string
  link: string
}

export interface ResearchTitle {
  title: string
  year: string
  type: ResearchType
  fundingAgency?: string
  status: ResearchStatus
  paper?: string
}

export interface FacultyProfile {
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  name: string
  email: string
  department: Department
  status: EmploymentStatus
  specialization: string
  photoURL?: string
  bannerURL?: string
  education: Education[]
  researchEngagements: ResearchEngagement[]
  researchPublications: ResearchPublication[]
  researchTitles: ResearchTitle[]
} 