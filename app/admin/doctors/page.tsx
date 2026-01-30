import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getDoctors } from "@/lib/actions/doctors"
import { getShifts } from "@/lib/actions/shifts"
import { Users } from "lucide-react"
import { DoctorsGrid } from "@/components/admin/doctors-grid"

export default async function DoctorsPage() {
    const currentDoctor = await getCurrentDoctor()

    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "administrator") {
        redirect("/dashboard")
    }

    const [doctors, shifts] = await Promise.all([getDoctors(), getShifts()])

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Médicos</h1>
                    <p className="text-slate-600">Gestión de médicos del sistema. Haz clic en un médico para ver su calendario.</p>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{doctors.length} médicos registrados</span>
                </div>
            </div>

            <DoctorsGrid doctors={doctors} shifts={shifts} />
        </div>
    )
}
