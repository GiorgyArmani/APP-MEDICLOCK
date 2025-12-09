"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, List, Users } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { AdminShiftsList } from "@/components/admin/admin-shifts-list"
import { AdminCalendar } from "@/components/admin/admin-calendar"
import { DoctorsList } from "@/components/admin/doctors-list"
import type { Shift, Doctor } from "@/lib/supabase/types"

interface AdminTabsProps {
    shifts: Shift[]
    doctors: Doctor[]
    defaultTab: string
}

export function AdminTabs({ shifts, doctors, defaultTab }: AdminTabsProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Initialize state from URL or default
    const [currentTab, setCurrentTab] = useState(searchParams.get("tab") || defaultTab || "list")

    // Sync state with URL changes (handle back/forward navigation)
    useEffect(() => {
        const tabFromUrl = searchParams.get("tab")
        if (tabFromUrl && tabFromUrl !== currentTab) {
            setCurrentTab(tabFromUrl)
        }
    }, [searchParams, currentTab])

    const onTabChange = (value: string) => {
        // Update UI immediately
        setCurrentTab(value)

        // Update URL without scroll
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", value)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    return (
        <Tabs value={currentTab} onValueChange={onTabChange} className="space-y-4">
            <TabsList>
                <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    Lista
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendario
                </TabsTrigger>
                <TabsTrigger value="doctors" className="gap-2">
                    <Users className="h-4 w-4" />
                    Médicos
                </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
                <AdminShiftsList shifts={shifts} doctors={doctors} />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
                <AdminCalendar shifts={shifts} />
            </TabsContent>

            <TabsContent value="doctors" className="space-y-4">
                <DoctorsList doctors={doctors} shifts={shifts} />
            </TabsContent>
        </Tabs>
    )
}
