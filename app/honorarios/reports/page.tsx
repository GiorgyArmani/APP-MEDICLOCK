import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShiftsForHonorarios, getDoctorsForHonorarios } from "@/lib/actions/shifts"
import { ReportsGenerator } from "@/components/honorarios/reports-generator"

export default async function ReportsPage() {
    const currentDoctor = await getCurrentDoctor()

    // Redirect if not authenticated or not honorarios
    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "honorarios") {
        redirect(currentDoctor.role === "administrator" ? "/admin" : "/dashboard")
    }

    // Fetch all data using bypassing actions for honorarios role
    const [shifts, doctors] = await Promise.all([getShiftsForHonorarios(), getDoctorsForHonorarios()])

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="container mx-auto px-4 py-8 space-y-8 pt-20 lg:pt-8">
                {/* Page Header */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Generador de Reportes</h1>
                    <p className="text-slate-500 font-medium mt-1">Exporta guardias por médico y período para procesamiento de honorarios</p>
                </div>

                {/* Reports Generator */}
                <ReportsGenerator shifts={shifts} doctors={doctors} />
            </main>
        </div>
    )
}
