'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { signInWithMicrosoft } from '@/lib/firebase/auth'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle2, FileText, GraduationCap, Mail, PenTool, Users } from 'lucide-react'

export default function LoginPage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user && role) {
      if (role === 'admin') {
        router.push('/admin')
      } else if (role === 'faculty') {
        router.push('/faculty')
      }
    }
  }, [user, role, router])

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true)
      await signInWithMicrosoft()
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: 'Error signing in',
        description: error.message || 'An error occurred during sign in. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#29853a] to-[#024423] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center lg:items-start 
     justify-center lg:justify-center gap-8 lg:gap-4">
          {/* Logo Container with Shadow */}
          <div className="relative w-40 h-40 md:w-64 md:h-64 lg:order-first">
            <div className="absolute inset-0 bg-[#E5B606] blur-[20px] opacity-50 rounded-full -z-10 " />
            <Image
              src="/images/spup-logo.png"
              alt="SPUP Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          {/* Text Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 lg:mb-6">
              Welcome to the Faculty Research Portfolio
            </h1>
            <p className="text-base md:text-lg opacity-90 mb-6 lg:mb-8">
              The <b>Center for Planning, Research, Innovations, and New Technology (CPRINT)</b> is
              requiring all faculty members to maintain a research portfolio. This initiative
              will help us track faculty research engagement and analyze trends to support
              future research development.
            </p>

            {/* Login Button */}
            <div className="flex justify-center lg:justify-start">
              <Button
                onClick={handleMicrosoftLogin}
                className="bg-white/20 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold px-8 py-6 text-sm md:text-base transition-transform hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#ff5722" d="M6 6H22V22H6z" transform="rotate(-180 14 14)"></path>
                      <path fill="#4caf50" d="M26 6H42V22H26z" transform="rotate(-180 34 14)"></path>
                      <path fill="#ffc107" d="M26 26H42V42H26z" transform="rotate(-180 34 34)"></path>
                      <path fill="#03a9f4" d="M6 26H22V42H6z" transform="rotate(-180 14 34)"></path>
                    </svg>
                    Sign in with Microsoft
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#036635] mb-8 text-center">
            By submitting your research details, we aim to:
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex items-start space-x-4 p-4">
              <CheckCircle2 className="w-6 h-6 text-[#036635] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Monitor Research Output</h3>
                <p className="text-gray-600">Track and analyze faculty research activities over time</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4">
              <Users className="w-6 h-6 text-[#036635] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Foster Collaboration</h3>
                <p className="text-gray-600">Identify opportunities for collaboration and funding</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4">
              <GraduationCap className="w-6 h-6 text-[#036635] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Support Growth</h3>
                <p className="text-gray-600">Provide institutional support for research development</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What to Include Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#036635] mb-8 text-center">
            What to Include in Your Portfolio
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-[#036635] mr-3" />
                <h3 className="font-semibold">Research Titles</h3>
              </div>
              <p className="text-gray-600">A list of research projects you have conducted within the last five years</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <PenTool className="w-6 h-6 text-[#036635] mr-3" />
                <h3 className="font-semibold">Research Publications</h3>
              </div>
              <p className="text-gray-600">Published research papers with journal/conference details and publication year</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-[#036635] mr-3" />
                <h3 className="font-semibold">Research Engagements</h3>
              </div>
              <p className="text-gray-600">Conferences, seminars, workshops attended and roles undertaken</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative bg-[#036635] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg mb-4 md:mb-6">
            Your research contributes to the growth of our institution.
            <br />
            Let us work together to strengthen our research culture!
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>For inquiries, contact CPRINT at cprint@spup.edu.ph or visit our office</span>
            </div>
          </div>
          <div className="mt-8 md:mt-12">
            <p className="font-semibold mb-2">St. Paul University Philippines</p>
            <p className="text-sm opacity-80">
              Center for Planning, Research, Innovations, and New Technology
            </p>
          </div>
        </div>
        <span className="absolute bottom-4 left-0 right-0 text-center text-[#14633d]">
          ©Angelo P. Peralta
        </span>
      </div>


    </div>
  )
}