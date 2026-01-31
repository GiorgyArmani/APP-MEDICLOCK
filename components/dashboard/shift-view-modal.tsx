"use client"

import { useEffect, useState } from "react"
import { useSidebar } from "@/contexts/sidebar-context"
import { createClient } from "@/lib/supabase/client"
import type { Shift, Doctor } from "@/lib/supabase/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShiftCard } from "./shift-card"
import { AdminShiftCard } from "@/components/admin/admin-shift-card"
import { Loader2 } from "lucide-react"

interface ShiftViewModalProps {
    currentDoctor: Doctor
}

export function ShiftViewModal({ currentDoctor }: ShiftViewModalProps) {
    const { viewingShiftId, setViewingShiftId } = useSidebar()
    const [shift, setShift] = useState<Shift | null>(null)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!viewingShiftId) {
            setShift(null)
            return
        }

        async function fetchData() {
            setLoading(true)
            try {
                // Fetch shift
                const { data: shiftData, error: shiftError } = await supabase
                    .from("shifts")
                    .select("*")
                    .eq("id", viewingShiftId)
                    .single()

                if (shiftError) throw shiftError
                setShift(shiftData as Shift)

                // If admin, fetch doctors list for the AdminShiftCard actions
                if (currentDoctor.role === "administrator") {
                    const { data: doctorsData, error: doctorsError } = await supabase
                        .from("doctors")
                        .select("*")
                        .order("full_name")

                    if (doctorsError) throw doctorsError
                    setDoctors(doctorsData as Doctor[])
                }
            } catch (error) {
                console.error("Error fetching shift details:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [viewingShiftId, currentDoctor.role])

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setViewingShiftId(null)
        }
    }

    return (
        <Dialog open={!!viewingShiftId} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detalles de la Guardia</DialogTitle>
                    <DialogDescription>
                        Visualiza y gestiona la información de esta guardia.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : shift ? (
                        currentDoctor.role === "administrator" ? (
                            <AdminShiftCard
                                shift={shift}
                                doctors={doctors}
                                currentDoctor={currentDoctor}
                            />
                        ) : (
                            <ShiftCard
                                shift={shift}
                                doctorId={currentDoctor.id}
                            />
                        )
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            No se pudo cargar la información de la guardia.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
