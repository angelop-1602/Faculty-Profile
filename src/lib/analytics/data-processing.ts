import type { FacultyProfile, Department, EmploymentStatus } from '@/types/faculty'

// Data cleaning and normalization
export const cleanAndNormalizeData = (profiles: FacultyProfile[]) => {
  return profiles.map(profile => ({
    ...profile,
    department: normalizeDepartment(profile.department),
    status: normalizeStatus(profile.status),
    researchCount: {
      titles: profile.researchTitles?.filter(title => title.status === 'completed')?.length || 0,
      publications: profile.researchPublications?.length || 0,
      engagements: profile.researchEngagements?.length || 0,
      total: profile.researchTitles?.filter(title => title.status === 'completed')?.length || 0
    },
    activityScore: calculateActivityScore(profile),
    topics: extractResearchTopics(profile)
  }))
}

// Department normalization
const normalizeDepartment = (dept: Department | undefined): Department => {
  if (!dept) return '' as Department
  return dept.trim().toUpperCase() as Department
}

// Status normalization
const normalizeStatus = (status: EmploymentStatus | undefined): EmploymentStatus => {
  if (!status) return '' as EmploymentStatus
  return status.trim() as EmploymentStatus
}

// Calculate research activity score
const calculateActivityScore = (profile: FacultyProfile): number => {
  const publicationWeight = 3
  const engagementWeight = 2
  const titleWeight = 1

  return (profile.researchPublications?.length || 0) * publicationWeight +
         (profile.researchEngagements?.length || 0) * engagementWeight +
         (profile.researchTitles?.length || 0) * titleWeight
}

// Extract research topics from titles and publications
const extractResearchTopics = (profile: FacultyProfile): { topic: string; count: number }[] => {
  const topics = new Map<string, number>()
  
  // Extract topics from research titles
  profile.researchTitles?.forEach(title => {
    const words = title.title.toLowerCase().split(/\s+/)
    words.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        topics.set(word, (topics.get(word) || 0) + 1)
      }
    })
  })

  // Extract topics from publications
  profile.researchPublications?.forEach(pub => {
    const words = pub.title.toLowerCase().split(/\s+/)
    words.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        topics.set(word, (topics.get(word) || 0) + 1)
      }
    })
  })

  return Array.from(topics.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// Common words to exclude from topic extraction
const commonWords = [
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'research',
  'study', 'analysis', 'based', 'using', 'development', 'approach'
]

// Department-wise research summary
export const getDepartmentSummary = (profiles: FacultyProfile[]) => {
  const summary = profiles.reduce((acc, profile) => {
    const dept = profile.department || 'Unassigned'
    if (!acc[dept]) {
      acc[dept] = {
        totalFaculty: 0,
        publications: 0,
        engagements: 0,
        titles: 0,
        activeResearchers: 0,
        ongoingResearch: 0
      }
    }

    acc[dept].totalFaculty++
    
    const completedResearch = profile.researchTitles?.filter(
      title => title.status === 'completed'
    ).length || 0
    acc[dept].titles += completedResearch

    acc[dept].publications += profile.researchPublications?.length || 0
    acc[dept].engagements += profile.researchEngagements?.length || 0
    
    const hasOngoingResearch = profile.researchTitles?.some(
      title => title.status === 'on-going'
    ) || false
    if (hasOngoingResearch) {
      acc[dept].activeResearchers++
    }

    const ongoingResearch = profile.researchTitles?.filter(
      title => title.status === 'on-going'
    ).length || 0
    acc[dept].ongoingResearch += ongoingResearch

    return acc
  }, {} as Record<string, {
    totalFaculty: number
    publications: number
    engagements: number
    titles: number
    activeResearchers: number
    ongoingResearch: number
  }>)

  return summary
}

// Time-based analysis
export const getResearchTrends = (profiles: FacultyProfile[]) => {
  const trends = profiles.reduce((acc, profile) => {
    // Track publications by year
    profile.researchPublications?.forEach(pub => {
      const year = pub.year
      if (!acc.publications[year]) acc.publications[year] = 0
      acc.publications[year]++
    })

    // Track engagements by year
    profile.researchEngagements?.forEach(eng => {
      const year = eng.year
      if (!acc.engagements[year]) acc.engagements[year] = 0
      acc.engagements[year]++
    })

    // Track research titles by year and status
    profile.researchTitles?.forEach(title => {
      const year = title.year
      if (!acc.titles[year]) acc.titles[year] = 0
      acc.titles[year]++

      // Track ongoing vs completed research
      if (!acc.status[year]) {
        acc.status[year] = { ongoing: 0, completed: 0 }
      }
      acc.status[year][title.status === 'on-going' ? 'ongoing' : 'completed']++
    })

    return acc
  }, {
    publications: {} as Record<string, number>,
    engagements: {} as Record<string, number>,
    titles: {} as Record<string, number>,
    status: {} as Record<string, { ongoing: number; completed: number }>
  })

  return trends
}

// K-means clustering for faculty segmentation
export const clusterFaculty = (profiles: FacultyProfile[]) => {
  const features = profiles.map(profile => ([
    profile.researchPublications?.length || 0,
    profile.researchEngagements?.length || 0,
    profile.researchTitles?.length || 0,
    calculateActivityScore(profile)
  ]))

  // Simple k-means implementation (in practice, use a proper ML library)
  const clusters = simpleKMeans(features, 3) // 3 clusters: High, Medium, Low activity

  return profiles.map((profile, index) => ({
    ...profile,
    cluster: clusters[index],
    clusterLabel: ['Low', 'Medium', 'High'][clusters[index]]
  }))
}

// Simple k-means implementation
const simpleKMeans = (data: number[][], k: number): number[] => {
  // This is a simplified version. In production, use a proper ML library
  const clusters = data.map(point => {
    const sum = point.reduce((a, b) => a + b, 0)
    if (sum > 10) return 2 // High activity
    if (sum > 5) return 1 // Medium activity
    return 0 // Low activity
  })

  return clusters
}

// Association rule mining
export const findResearchPatterns = (profiles: FacultyProfile[]) => {
  const patterns: Record<string, number> = {}

  profiles.forEach(profile => {
    // Look for patterns between publications and engagements
    profile.researchPublications?.forEach(pub => {
      profile.researchEngagements?.forEach(eng => {
        if (pub.year === eng.year) {
          const pattern = `Publication-Engagement-${pub.year}`
          patterns[pattern] = (patterns[pattern] || 0) + 1
        }
      })
    })

    // Look for patterns in research titles
    profile.researchTitles?.forEach(title => {
      const pattern = `Research-${title.type}-${title.status}`
      patterns[pattern] = (patterns[pattern] || 0) + 1

      // Track funding patterns
      if (title.type === 'funded' && title.fundingAgency) {
        const fundingPattern = `Funding-${title.fundingAgency}`
        patterns[fundingPattern] = (patterns[fundingPattern] || 0) + 1
      }
    })

    // Look for specialization patterns
    if (profile.specialization) {
      const specPattern = `Specialization-${profile.specialization}`
      patterns[specPattern] = (patterns[specPattern] || 0) + 1
    }
  })

  return patterns
}

// Predictive analysis
export const predictResearchActivity = (profiles: FacultyProfile[]) => {
  return profiles.map(profile => {
    const activityScore = calculateActivityScore(profile)
    const recentActivity = profile.researchTitles?.filter(title => 
      parseInt(title.year) >= new Date().getFullYear() - 2
    ).length || 0

    // Calculate growth rate
    const pastActivity = profile.researchTitles?.filter(title =>
      parseInt(title.year) < new Date().getFullYear() - 2
    ).length || 0
    
    const growthRate = pastActivity === 0 ? 
      (recentActivity > 0 ? 1 : 0) : 
      (recentActivity - pastActivity) / pastActivity

    return {
      email: profile.email,
      predictedActivity: {
        score: activityScore,
        level: activityScore > 10 ? 'High' : activityScore > 5 ? 'Medium' : 'Low',
        trend: growthRate > 0.1 ? 'Increasing' : 
              growthRate < -0.1 ? 'Decreasing' : 'Stable',
        growthRate: growthRate
      }
    }
  })
}

// Get research gaps and opportunities
export const getResearchGaps = (profiles: FacultyProfile[]) => {
  const departmentTopics = new Map<Department, Map<string, number>>()
  
  // Collect topics by department
  profiles.forEach(profile => {
    const department = profile.department
    if (!department) return
    
    if (!departmentTopics.has(department)) {
      departmentTopics.set(department, new Map())
    }
    
    const topics = extractResearchTopics(profile)
    topics.forEach(({ topic, count }) => {
      const deptTopics = departmentTopics.get(department)!
      deptTopics.set(topic, (deptTopics.get(topic) || 0) + count)
    })
  })

  // Identify gaps
  const gaps = Array.from(departmentTopics.entries()).map(([dept, topics]) => {
    const sortedTopics = Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))

    return {
      department: dept,
      topTopics: sortedTopics,
      gapAreas: identifyGapAreas(dept, sortedTopics)
    }
  })

  return gaps
}

// Helper function to identify gap areas based on department
const identifyGapAreas = (
  department: Department | undefined, 
  currentTopics: { topic: string; count: number }[]
) => {
  if (!department) return []
  
  // Define expected research areas per department
  const expectedAreas: Partial<Record<Department, string[]>> = {
    'SASTE': ['education', 'teaching', 'curriculum', 'pedagogy', 'assessment'],
    'SITE': ['technology', 'engineering', 'innovation', 'computing', 'systems'],
    'SBHAM': ['business', 'management', 'economics', 'finance', 'marketing'],
    'SNAHS': ['health', 'nursing', 'medicine', 'care', 'clinical'],
    'SOM': ['medicine', 'health', 'clinical', 'patient', 'treatment'],
    'BEU': ['education', 'teaching', 'learning', 'assessment', 'development']
  }

  const currentTopicSet = new Set(currentTopics.map(t => t.topic))
  const gaps = (expectedAreas[department] || []).filter(
    area => !currentTopicSet.has(area)
  )

  return gaps
} 