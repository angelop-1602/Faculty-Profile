'use client'

import { useState, useCallback, useEffect } from 'react'
import type { FacultyProfile, Department, EmploymentStatus } from '@/types/faculty'
import { Button } from '@/components/ui/button'
import { EditProfileButton } from '@/components/faculty/edit-profile-button'
import { signOutUser } from '@/lib/firebase/auth'
import { Building2, GraduationCap, LogOut, Mail, Pencil, UserRound } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'

const DEFAULT_BANNER = '/images/hero-bg.png'
const DEFAULT_PROFILE = '/images/spup-logo.png'

interface ProfileViewProps {
    profile: FacultyProfile
    userEmail: string | null | undefined
    onProfileUpdate: (updates: Partial<FacultyProfile>) => Promise<void>
}

export function ProfileView({ profile, userEmail, onProfileUpdate }: ProfileViewProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedProfile, setEditedProfile] = useState<FacultyProfile>(profile)
    const [headerHeight, setHeaderHeight] = useState('h-48')
    const { toast } = useToast()

    useEffect(() => {
        // Debounce function to limit the frequency of scroll event handling
        const debounce = (func: () => void, delay: number) => {
            let timeoutId: NodeJS.Timeout;
            return () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(func, delay);
            };
        };

        // Handle scroll with debounce
        const handleScroll = debounce(() => {
            const scrollPosition = window.scrollY;
            if (scrollPosition > 50) {
                setHeaderHeight('h-24'); // Smaller height when scrolled
            } else {
                setHeaderHeight('h-48'); // Default height
            }
        }, 50); // Adjust the delay (in milliseconds) as needed

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    const handleSave = useCallback(async () => {
        if (!userEmail) return

        try {
            // Ensure name cannot be edited by faculty
            const updatedProfile = {
                ...editedProfile,
                name: profile.name, // Always use original name for faculty
            }

            await onProfileUpdate(updatedProfile)
            setIsEditing(false)
            toast({
                title: 'Profile Updated',
                description: 'Your profile has been updated successfully.',
                className: 'bg-green-500 text-white'
            })
        } catch (error) {
            console.error('Error updating profile:', error)
            toast({
                title: 'Error',
                description: 'Failed to update profile. Please try again.',
                className: 'bg-red-500 text-white'
            })
        }
    }, [editedProfile, userEmail, onProfileUpdate, toast, profile.name])

    const handleCancel = () => {
        setIsEditing(false)
        setEditedProfile(profile)
    }

    return (
        <div className="sticky top-0 z-50 w-full bg-white shadow-sm">
            {/* Sign Out Button */}
            <div className="absolute top-4 right-4 z-10">
                <Button
                    variant="outline"
                    onClick={signOutUser}
                    className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border-white/50"
                    size="sm"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>

            {/* Banner */}
            <div className={`transition-all duration-300 ${headerHeight}`}>
                <Image
                    src={DEFAULT_BANNER}
                    alt="Profile banner"
                    className="w-full h-full object-cover"
                    width={1920}
                    height={114}
                    priority
                />
            </div>

            {/* Profile Content */}
            <div className="container mx-auto px-4">
                <div className="relative -mt-12 pb-6">
                    <div className="flex flex-col items-center text-center">
                        {/* Profile Photo with Edit Button */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-white shadow-md">
                                <Image
                                    src={profile.photoURL || DEFAULT_PROFILE}
                                    alt={profile.name || 'Profile photo'}
                                    className="w-full h-full object-cover"
                                    width={96}
                                    height={96}
                                    priority
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white"
                            >
                                <Pencil className="h-5 w-5 text-spup-green" />
                            </Button>
                        </div>

                        {/* Profile Info */}
                        <div className="mt-3 w-full max-w-3xl">
                            <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                            <div className="mt-1 space-y-1">
                                <div className="flex items-center justify-center text-gray-600">
                                    <Mail className="w-4 h-4 mr-2" />
                                    {profile.email}
                                </div>

                                {isEditing ? (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                        <div>
                                            <Label htmlFor="department">Department</Label>
                                            <Select
                                                value={editedProfile.department || "unset"}
                                                onValueChange={(value: Department) =>
                                                    setEditedProfile({
                                                        ...editedProfile,
                                                        department: value === "unset" ? "" : value
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unset">Select department</SelectItem>
                                                    <SelectItem value="SASTE">SASTE</SelectItem>
                                                    <SelectItem value="SITE">SITE</SelectItem>
                                                    <SelectItem value="SBHAM">SBHAM</SelectItem>
                                                    <SelectItem value="SNAHS">SNAHS</SelectItem>
                                                    <SelectItem value="SOM">SOM</SelectItem>
                                                    <SelectItem value="BEU">BEU</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="specialization">Specialization</Label>
                                            <Input
                                                id="specialization"
                                                value={editedProfile.specialization || ''}
                                                onChange={(e) => setEditedProfile({ ...editedProfile, specialization: e.target.value })}
                                                placeholder="Enter specialization"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="status">Employment Status</Label>
                                            <Select
                                                value={editedProfile.status || "unset"}
                                                onValueChange={(value: EmploymentStatus) =>
                                                    setEditedProfile({
                                                        ...editedProfile,
                                                        status: value === "unset" ? "" : value
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unset">Select status</SelectItem>
                                                    <SelectItem value="Full Time">Full Time</SelectItem>
                                                    <SelectItem value="Part Time">Part Time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-center gap-4 mt-1 text-sm">
                                        <div className="flex items-center text-gray-400 ">
                                            <Building2 className="w-3 h-3 mr-1" />
                                            {profile.department || 'No department set'}
                                        </div>
                                        <div className="flex items-center text-gray-400">
                                            <GraduationCap className="w-4 h-4 mr-1" />
                                            {profile.specialization || 'No specialization set'}
                                        </div>
                                        <div className="flex items-center text-gray-400">
                                            <UserRound className="w-3 h-3 mr-1" />
                                            {profile.status || 'No status set'}
                                        </div>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        <Button
                                            onClick={handleCancel}
                                            variant="outline"
                                            className="hover:bg-gray-100"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            className="bg-spup-green hover:bg-spup-green/90 text-white transition-colors"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 