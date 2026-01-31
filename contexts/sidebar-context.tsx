"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface SidebarContextType {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
    isMobileOpen: boolean
    setIsMobileOpen: (open: boolean) => void
    viewingShiftId: string | null
    setViewingShiftId: (id: string | null) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [viewingShiftId, setViewingShiftId] = useState<string | null>(null)

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            setIsCollapsed,
            isMobileOpen,
            setIsMobileOpen,
            viewingShiftId,
            setViewingShiftId
        }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider")
    }
    return context
}
