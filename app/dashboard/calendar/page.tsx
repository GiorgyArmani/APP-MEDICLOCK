import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"
import { Calendar } from "lucide-react"

export default async function DoctorCalendarPage() {
    const doctor = await getCurrentDoctor()

    if (!doctor) {
        redirect("/login")
    }

    // Filter shifts for role-based visibility (same logic as in dashboard)
    const allShifts = await getShifts()

    const visibleShifts = doctor.role === "administrator"
        ? allShifts
        : allShifts.filter((s) => {
            if (s.doctor_id === doctor.id) return true
            if (s.shift_type === "free") {
                if (doctor.role === 'completo') return true
                const pool = s.assigned_to_pool || []
                return pool.includes(doctor.role)
            }
            return false
        })

    return (
        <div className="min-h-screen bg-slate-50 pt-20 lg:pt-8 px-4 pb-8">
            <div className="container mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Mi Calendario</h1>
                        <p className="text-sm text-slate-600">Visualiza tus guardias y las disponibles en formato calendario</p>
                    </div>
                </div>

                <ShiftsCalendar shifts={visibleShifts} />
            </div>
        </div>
    )
}
