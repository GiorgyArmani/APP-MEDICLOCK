import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { getDoctors } from "@/lib/actions/doctors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users } from "lucide-react"
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-sm text-slate-600">Gestión de guardias y médicos</p>
          </div>
          {/* Desktop Create Button */}
          <div className="hidden lg:block">
            <CreateShiftDialog doctors={doctors} />
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guardias</CardTitle>
              <Calendar className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts.length}</div>
              <p className="text-xs text-slate-600">Todas las guardias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Calendar className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingShifts}</div>
              <p className="text-xs text-slate-600">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedShifts}</div>
              <p className="text-xs text-slate-600">Guardias asignadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Médicos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctors.length}</div>
              <p className="text-xs text-slate-600">Registrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Shifts List Section */}
        <div className="space-y-4">
          <AdminShiftsList shifts={shifts} doctors={doctors} />
        </div>
      </main >
    </div >
  )
}
