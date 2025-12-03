import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { getDoctors } from "@/lib/actions/doctors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, List, Users } from "lucide-react"
import { CreateShiftDialog } from "@/components/admin/create-shift-dialog"
import { AdminShiftsList } from "@/components/admin/admin-shifts-list"
import { AdminCalendar } from "@/components/admin/admin-calendar"
import { DoctorsList } from "@/components/admin/doctors-list"
import type { Doctor } from "@/lib/supabase/types"

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
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
              <p className="text-sm text-slate-600">Gestión de guardias y médicos</p>
            </div>
            <CreateShiftDialog doctors={doctors} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
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

        {/* Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="doctors" className="gap-2">
              <Users className="h-4 w-4" />
              Médicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <AdminShiftsList shifts={shifts} doctors={doctors} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <AdminCalendar shifts={shifts} />
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            <DoctorsList doctors={doctors} shifts={shifts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
