"use client"

import type { Shift, Doctor } from "@/lib/supabase/types"
import { ShiftCard } from "@/components/dashboard/shift-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AdminShiftsListProps {
  shifts: Shift[]
  doctors: Doctor[]
}

export function AdminShiftsList({ shifts }: AdminShiftsListProps) {

  const newShifts = shifts.filter((s) => s.status === "new")
  const freeShifts = shifts.filter((s) => s.status === "free" || s.status === "free_pending")
  const confirmedShifts = shifts.filter((s) => s.status === "confirmed")
  const rejectedShifts = shifts.filter((s) => s.status === "rejected")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todas las Guardias</CardTitle>
        <CardDescription>Vista completa de todas las guardias del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todas ({shifts.length})</TabsTrigger>
            <TabsTrigger value="new">Nuevas ({newShifts.length})</TabsTrigger>
            <TabsTrigger value="free">Libres ({freeShifts.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmadas ({confirmedShifts.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazadas ({rejectedShifts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {shifts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias registradas</p>
            ) : (
              shifts.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={shift.doctor_id || ""} />)
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-6">
            {newShifts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias nuevas</p>
            ) : (
              newShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={shift.doctor_id || ""} />)
            )}
          </TabsContent>

          <TabsContent value="free" className="space-y-4 mt-6">
            {freeShifts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias libres</p>
            ) : (
              freeShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={shift.doctor_id || ""} />)
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4 mt-6">
            {confirmedShifts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias confirmadas</p>
            ) : (
              confirmedShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={shift.doctor_id || ""} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-6">
            {rejectedShifts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias rechazadas</p>
            ) : (
              rejectedShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={shift.doctor_id || ""} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
