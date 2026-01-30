import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { getDoctors } from "@/lib/actions/doctors"
import { AdminCalendar } from "@/components/admin/admin-calendar"
import { Calendar } from "lucide-react"

export default async function AdminCalendarPage() {
    const currentDoctor = await getCurrentDoctor()

    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "administrator") {
        redirect("/dashboard")
    }

    const [shifts, doctors] = await Promise.all([getShifts(), getDoctors()])

    return (
        <div className="min-h-screen bg-slate-50 pt-20 lg:pt-8 px-4 pb-8">
            <div className="container mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Calendario de Guardias</h1>
                        <p className="text-sm text-slate-600">Visualización mensual, semanal y diaria de todas las guardias</p>
                    </div>
                </div>

                <AdminCalendar shifts={shifts} doctors={doctors} />
            </div>
        </div>
    )
}
