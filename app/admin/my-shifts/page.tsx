import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ShiftsList } from "@/components/dashboard/shifts-list"
import { TodayShifts } from "@/components/dashboard/today-shifts"
import { Clock } from "lucide-react"
import type { Doctor } from "@/lib/supabase/types"

export default async function AdminMyShiftsPage() {
    const currentDoctor = await getCurrentDoctor()

    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "administrator") {
        redirect("/dashboard")
    }

    const doctor = currentDoctor as Doctor

    // Fetch ALL shifts to determine visibility correctly
    const allShifts = await getShifts()

    // Filter shifts: assigned to admin OR free shifts they can take
    const visibleShifts = allShifts.filter((s) => {
        // Own shifts
        if (s.doctor_id === doctor.id) return true

        // Free shifts logic (Admims can take any free shift if we follow the existing pattern)
        if (s.shift_type === "free") {
            return true // Admins are powerful doctors
        }

        return false
    })

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="container mx-auto px-4 py-8 space-y-8 pt-20 lg:pt-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">
                            Mis Guardias
                        </h1>
                        <p className="text-slate-600">Gestión de tus turnos Personales</p>
                    </div>
                </div>

                <TodayShifts shifts={visibleShifts} currentDoctor={doctor} />

                <StatsCards shifts={visibleShifts} />

                <div className="space-y-4">
                    <ShiftsList shifts={visibleShifts} currentDoctor={doctor} />
                </div>
            </main>
        </div>
    )
}
