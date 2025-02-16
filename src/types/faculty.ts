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
  email: string
  name: string
  department?: Department
  specialization?: string
  status?: EmploymentStatus
  photoURL?: string
  bannerURL?: string
  createdAt?: Date
  updatedAt?: Date
  lastLogin?: Date
  education?: Education[]
  researchEngagements?: ResearchEngagement[]
  researchPublications?: ResearchPublication[]
  researchTitles?: ResearchTitle[]
  researchCount?: {
    total: number
    publications: number
    engagements: number
    titles: number
  }
} 