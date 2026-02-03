import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { getDoctors } from "@/lib/actions/doctors"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"
import { Calendar } from "lucide-react"

export default async function HonorariosCalendarPage() {
    const currentDoctor = await getCurrentDoctor()

    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "honorarios") {
        redirect(currentDoctor.role === "administrator" ? "/admin" : "/dashboard")
    }

    const [shifts, doctors] = await Promise.all([getShifts(), getDoctors()])

    return (
        <div className="min-h-screen bg-slate-50 pt-20 lg:pt-8 px-4 pb-8">
            <div className="container mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Calendario Auditoría</h1>
                            <p className="text-sm text-slate-600">Visualización de todas las guardias del sistema (Solo lectura)</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <ShiftsCalendar shifts={shifts} doctors={doctors} readOnly={true} />
                </div>
            </div>
        </div>
    )
}
