"use client"

import { ReactNode } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"
import type { Doctor } from "@/lib/supabase/types"
import { ShiftViewModal } from "@/components/dashboard/shift-view-modal"
import { ShiftHighlighter } from "@/components/dashboard/shift-highlighter"

interface SidebarLayoutContentProps {
    doctor: Doctor
    children: ReactNode
}

export function SidebarLayoutContent({ doctor, children }: SidebarLayoutContentProps) {
    const { isCollapsed } = useSidebar()

    return (
        <div className="flex-1 flex flex-col">
            <AppHeader doctor={doctor} />
            <main
                className={cn(
                    "flex-1 mt-16 bg-slate-50 transition-all duration-300",
                    isCollapsed ? "lg:ml-20" : "lg:ml-64"
                )}
            >
                {children}
            </main>
            <ShiftViewModal currentDoctor={doctor} />
            <ShiftHighlighter />
        </div>
    )
}
