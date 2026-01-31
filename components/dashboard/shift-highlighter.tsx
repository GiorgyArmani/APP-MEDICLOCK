"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useSidebar } from "@/contexts/sidebar-context"

export function ShiftHighlighter() {
    const searchParams = useSearchParams()
    const shiftId = searchParams.get("shift")
    const { setViewingShiftId } = useSidebar()

    useEffect(() => {
        if (shiftId) {
            // Open modal
            setViewingShiftId(shiftId)

            // Wait for DOM to be ready for highlighting
            setTimeout(() => {
                const shiftElement = document.getElementById(`shift-${shiftId}`)
                if (shiftElement) {
                    // Scroll to the shift card
                    shiftElement.scrollIntoView({ behavior: "smooth", block: "center" })

                    // Add highlight effect
                    shiftElement.classList.add("ring-4", "ring-blue-500", "ring-offset-2")

                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        shiftElement.classList.remove("ring-4", "ring-blue-500", "ring-offset-2")
                    }, 3000)
                }
            }, 500)
        }
    }, [shiftId, setViewingShiftId])

    return null
}
