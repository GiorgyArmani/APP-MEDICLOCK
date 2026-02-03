import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { getDoctors } from "@/lib/actions/doctors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Clock, CheckCircle2 } from "lucide-react"
import type { Doctor } from "@/lib/supabase/types"
import { HonorariosShiftsList } from "@/components/honorarios/honorarios-shifts-list"

export default async function HonorariosPage() {
    const currentDoctor = await getCurrentDoctor()

    // Redirect if not authenticated or not honorarios
    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "honorarios") {
        redirect(currentDoctor.role === "administrator" ? "/admin" : "/dashboard")
    }

    // Fetch all data in parallel
    const [shifts, doctors] = await Promise.all([getShifts(), getDoctors()])

    const pendingShifts = shifts.filter((s) => s.status === "new" || s.status === "free").length
    const confirmedShifts = shifts.filter((s) => s.status === "confirmed").length

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="container mx-auto px-4 py-8 space-y-8 pt-20 lg:pt-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Honorarios</h1>
                        <p className="text-slate-500 font-medium">Vista de todas las guardias para auditoría y reportes</p>
                    </div>
                </div>

                {/* Shifts List Section (Includes dynamic stats & filters) */}
                <div className="space-y-4">
                    <HonorariosShiftsList shifts={shifts} doctors={doctors} />
                </div>
            </main>
        </div>
    )
}
