'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { FacultyProfile, Department } from '@/types/faculty'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, Search, Eye, PenSquare, Download } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { signOutUser } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  cleanAndNormalizeData,
  getDepartmentSummary,
  getResearchTrends,
  clusterFaculty,
  findResearchPatterns,
  predictResearchActivity,
  getResearchGaps
} from '@/lib/analytics/data-processing'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js'
import { Line, Bar, Pie, Radar } from 'react-chartjs-2'
import { exportFacultyProfiles } from '@/lib/utils/excel'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
)

// Add a new card for Trending Topics
const TrendingTopicsCard = ({ processedData }: { processedData: any }) => {
  // Get all topics across departments
  const allTopics = Object.values(processedData.departmentSummary).reduce((acc: string[], dept: any) => {
    if (dept.topics) {
      acc.push(...dept.topics)
    }
    return acc
  }, [])

  // Count topic frequencies
  const topicCounts = allTopics.reduce((acc: { [key: string]: number }, topic: string) => {
    acc[topic] = (acc[topic] || 0) + 1
    return acc
  }, {})

  // Sort topics by frequency
  const sortedTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Research Topics</CardTitle>
        <CardDescription>Most frequent research areas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTopics.map(([topic, count], index) => (
            <div key={topic} className="flex items-center justify-between">
              <span className="text-sm font-medium">{topic}</span>
              <div className="w-2/3">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-spup-green rounded-full"
                    style={{
                      width: `${((count as number) / (sortedTopics[0][1] as number)) * 100}%`
                    }}
                  />
                </div>
              </div>
              <span className="text-sm text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Add a new card for Research Gaps
const ResearchGapsCard = ({ processedData }: { processedData: any }) => {
  const gaps = processedData.gaps || []
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Gaps</CardTitle>
        <CardDescription>Areas needing more focus</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gaps.map((gap: any) => (
            <div key={gap.department} className="border-b pb-4 last:border-0">
              <h4 className="font-semibold mb-2">{gap.department}</h4>
              <div className="space-y-2">
                {gap.gapAreas.map((area: string) => (
                  <div
                    key={area}
                    className="text-sm px-2 py-1 bg-red-50 text-red-700 rounded"
                  >
                    {area}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<FacultyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [processedData, setProcessedData] = useState<any>(null)
  const { toast } = useToast()
  const itemsPerPage = 10

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'faculty_profiles'))
        const profilesData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastLogin: doc.data().lastLogin?.toDate(),
        })) as FacultyProfile[]

        setProfiles(profilesData)

        // Process data for analytics
        const normalizedData = cleanAndNormalizeData(profilesData)
        const departmentSummary = getDepartmentSummary(profilesData)
        const trends = getResearchTrends(profilesData)
        const clusteredFaculty = clusterFaculty(profilesData)
        const patterns = findResearchPatterns(profilesData)
        const predictions = predictResearchActivity(profilesData)
        const gaps = getResearchGaps(profilesData)

        setProcessedData({
          normalizedData,
          departmentSummary,
          trends,
          clusteredFaculty,
          patterns,
          predictions,
          gaps
        })
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch and process data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAndProcessData()
  }, [toast])

  const filteredProfiles = profiles.filter(profile =>
    (profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedDepartment === 'all' || profile.department === selectedDepartment)
  )

  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)

  const handleExport = async () => {
    const result = await exportFacultyProfiles()
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
        className: 'bg-green-500 text-white'
      })
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive'
      })
    }
  }

  const handleViewProfile = (email: string) => {
    const encodedEmail = encodeURIComponent(email)
    router.push(`/admin/faculty/${encodedEmail}`)
  }

  // Calculate statistics based on filtered profiles
  const totalFaculty = filteredProfiles.length
  const totalResearchOutput = filteredProfiles.reduce((acc, profile) => 
    acc + (profile.researchPublications?.length || 0) +
         (profile.researchEngagements?.length || 0) +
         (profile.researchTitles?.length || 0)
  , 0)
  const activeResearchers = filteredProfiles.filter(p => 
    (p.researchPublications?.length || 0) +
    (p.researchTitles?.length || 0) > 0
  ).length
  const researchGrowth = Math.round(processedData?.predictions
    .filter((p: any) => 
      filteredProfiles.some(fp => fp.email === p.email) && 
      p.predictedActivity.trend === 'Increasing'
    ).length / totalFaculty * 100) || 0

  // Update chart data based on filtered profiles
  const departmentChartData = {
    labels: Object.keys(processedData?.departmentSummary || {}),
    datasets: [
      {
        label: 'Publications',
        data: Object.values(processedData?.departmentSummary || {}).map((d: any) => 
          selectedDepartment === 'all' || d.department === selectedDepartment ? d.publications : 0
        ),
        backgroundColor: 'rgba(3, 102, 53, 0.5)',
        borderColor: 'rgb(3, 102, 53)',
      },
      {
        label: 'Engagements',
        data: Object.values(processedData?.departmentSummary || {}).map((d: any) => 
          selectedDepartment === 'all' || d.department === selectedDepartment ? d.engagements : 0
        ),
        backgroundColor: 'rgba(254, 204, 7, 0.5)',
        borderColor: 'rgb(254, 204, 7)',
      },
      {
        label: 'Research Titles',
        data: Object.values(processedData?.departmentSummary || {}).map((d: any) => 
          selectedDepartment === 'all' || d.department === selectedDepartment ? d.titles : 0
        ),
        backgroundColor: 'rgba(3, 102, 53, 0.8)',
        borderColor: 'rgb(3, 102, 53)',
      }
    ]
  }

  const trendsChartData = {
    labels: Object.keys(processedData?.trends?.publications || {}).sort(),
    datasets: [
      {
        label: 'Publications',
        data: Object.keys(processedData?.trends?.publications || {}).sort()
          .map(year => processedData?.trends?.publications[year] || 0),
        borderColor: 'rgb(3, 102, 53)',
        tension: 0.1
      },
      {
        label: 'Engagements',
        data: Object.keys(processedData?.trends?.engagements || {}).sort()
          .map(year => processedData?.trends?.engagements[year] || 0),
        borderColor: 'rgb(254, 204, 7)',
        tension: 0.1
      },
      {
        label: 'Research Titles',
        data: Object.keys(processedData?.trends?.titles || {}).sort()
          .map(year => processedData?.trends?.titles[year] || 0),
        borderColor: 'rgb(3, 102, 53)',
        tension: 0.1
      }
    ]
  }

  const facultyByDepartmentData = {
    labels: Object.keys(processedData?.departmentSummary || {}),
    datasets: [{
      label: 'Total Faculty',
      data: Object.values(processedData?.departmentSummary || {}).map((d: any) => d?.totalFaculty || 0),
      backgroundColor: [
        'rgba(3, 102, 53, 0.8)',
        'rgba(254, 204, 7, 0.8)',
        'rgba(3, 102, 53, 0.6)',
        'rgba(254, 204, 7, 0.6)',
        'rgba(3, 102, 53, 0.4)',
        'rgba(254, 204, 7, 0.4)',
      ],
    }]
  }

  const researchActivityRadarData = {
    labels: Object.keys(processedData?.departmentSummary || {}),
    datasets: [{
      label: 'Research Activity Score',
      data: Object.values(processedData?.departmentSummary || {}).map((d: any) => 
        d ? ((d.publications || 0) * 3 + (d.engagements || 0) * 2 + (d.titles || 0) * 1) / (d.totalFaculty || 1) : 0
      ),
      backgroundColor: 'rgba(3, 102, 53, 0.2)',
      borderColor: 'rgb(3, 102, 53)',
      pointBackgroundColor: 'rgb(3, 102, 53)',
    }]
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-[100px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-spup-green text-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Research Analytics Dashboard</h1>
          <Button 
            variant="ghost" 
            onClick={signOutUser}
            className="text-white hover:bg-spup-green-dark"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-8">
        {/* Overview Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Faculty Research Profiles</CardTitle>
            <CardDescription>Detailed view of research activities</CardDescription>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search faculty..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedDepartment} onValueChange={(value: string) => setSelectedDepartment(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="SASTE">SASTE</SelectItem>
                    <SelectItem value="SITE">SITE</SelectItem>
                    <SelectItem value="SBHAM">SBHAM</SelectItem>
                    <SelectItem value="SNAHS">SNAHS</SelectItem>
                    <SelectItem value="SOM">SOM</SelectItem>
                    <SelectItem value="BEU">BEU</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExport}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="rounded-md border min-w-[800px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name / Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Publications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Engagements
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Research Titles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedProfiles.map((profile) => {
                      const prediction = processedData?.predictions?.find(
                        (p: any) => p.email === profile.email
                      )
                      return (
                        <tr key={profile.email}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                            <div className="text-sm text-gray-500">{profile.department || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {profile.researchPublications?.length || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {profile.researchEngagements?.length || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {profile.researchTitles?.length || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {profile.status || 'Not set'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(profile.email)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Faculty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-spup-green">
                {totalFaculty}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Registered faculty members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Research Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-spup-green">
                {totalResearchOutput}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Combined research activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Researchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-spup-green">
                {activeResearchers}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Faculty with research activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Research Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-spup-green">
                {researchGrowth}%
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Increasing research activity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Research Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Department Research Performance</CardTitle>
              <CardDescription>Research output by department</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <Bar
                data={departmentChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <TrendingTopicsCard processedData={processedData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Research Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Research Activity Trends</CardTitle>
              <CardDescription>Year-wise research output</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <Line
                data={trendsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </CardContent>
          </Card>

          {/* Research Gaps */}
          <ResearchGapsCard processedData={processedData} />
        </div>
      </main>
    </div>
  )
} 