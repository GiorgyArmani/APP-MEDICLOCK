import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShiftsByDoctor, getShifts } from "@/lib/actions/shifts"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ShiftsList } from "@/components/dashboard/shifts-list"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, List } from "lucide-react"
import type { Doctor } from "@/lib/supabase/types"

export default async function DashboardPage() {
  const currentDoctor = await getCurrentDoctor()

  if (!currentDoctor) {
    redirect("/login")
  }

  // TypeScript now knows currentDoctor is Doctor (not null) after the check above
  const doctor = currentDoctor as Doctor

  // Fetch ALL shifts to determine visibility correctly (matching shifts page logic)
  const allShifts = await getShifts()

  // Filter shifts for role-based visibility
  // 1. Admin sees everything
  // 2. Doctors see:
  //    a. Their own assigned shifts
  //    b. Free shifts that match their role pool (or if they are Completo)
  const visibleShifts = doctor.role === "administrator"
    ? allShifts
    : allShifts.filter((s) => {
      // Own shifts
      if (s.doctor_id === doctor.id) return true

      // Free shifts logic
      if (s.shift_type === "free") {
        // Completo sees all free shifts
        if (doctor.role === 'completo') return true

        // Check pool
        const pool = s.assigned_to_pool || []
        return pool.includes(doctor.role)
      }

      return false
    })

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-8 space-y-8 pt-20 lg:pt-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Bienvenido, Dr. {doctor.full_name.split(" ")[1] || doctor.full_name}
          </h1>
          <p className="text-slate-600">Gestiona tus guardias y horarios</p>
        </div>

        <StatsCards shifts={visibleShifts} />

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <ShiftsList shifts={visibleShifts} currentDoctor={doctor} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <ShiftsCalendar shifts={visibleShifts} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
