import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { getDoctors } from "@/lib/actions/doctors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Clock, CheckCircle2 } from "lucide-react"
import { CreateShiftDialog } from "@/components/admin/create-shift-dialog"
import type { Doctor } from "@/lib/supabase/types"

import { AdminShiftsList } from "@/components/admin/admin-shifts-list"

export default async function AdminPage() {
  const currentDoctor = await getCurrentDoctor()

  // Redirect if not authenticated or not admin
  if (!currentDoctor) {
    redirect("/login")
  }

  if (currentDoctor.role !== "administrator") {
    redirect("/dashboard")
  }

  // Fetch all data in parallel
  const [shifts, doctors] = await Promise.all([getShifts(), getDoctors()])

  const pendingShifts = shifts.filter((s) => s.status === "new" || s.status === "free").length
  const confirmedShifts = shifts.filter((s) => s.status === "confirmed").length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <CreateShiftDialog doctors={doctors} variant="fab" />
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8 pt-20 lg:pt-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Administración</h1>
            <p className="text-slate-500 font-medium">Gestión integral de guardias y personal médico</p>
          </div>
          {/* Desktop Create Button */}
          <div className="hidden lg:block">
            <CreateShiftDialog doctors={doctors} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-none shadow-md group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Guardias</CardTitle>
              <div className="p-2 bg-blue-50 rounded-xl">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{shifts.length}</div>
              <p className="text-xs font-semibold text-blue-600/70 mt-1">Registradas en el sistema</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pendientes</CardTitle>
              <div className="p-2 bg-amber-50 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{pendingShifts}</div>
              <p className="text-xs font-semibold text-amber-600/70 mt-1">Requieren confirmación</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Confirmadas</CardTitle>
              <div className="p-2 bg-green-50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{confirmedShifts}</div>
              <p className="text-xs font-semibold text-green-600/70 mt-1">Listas para ejecución</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Médicos</CardTitle>
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{doctors.length}</div>
              <p className="text-xs font-semibold text-indigo-600/70 mt-1">Personal capacitado</p>
            </CardContent>
          </Card>
        </div>

        {/* Shifts List Section */}
        <div className="space-y-4">
          <AdminShiftsList shifts={shifts} doctors={doctors} currentDoctor={currentDoctor} />
        </div>
      </main >
    </div >
  )
}
