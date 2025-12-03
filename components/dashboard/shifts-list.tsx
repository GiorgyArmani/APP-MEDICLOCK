"use client"

import type { Doctor } from "@/lib/supabase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShiftCard } from "@/components/dashboard/shift-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ShiftsListProps {
  shifts: any[]
  currentDoctor: Doctor
}

export function ShiftsList({ shifts, currentDoctor }: ShiftsListProps) {
  const newShifts = shifts.filter((s) => s.status === "new")
  const freeShifts = shifts.filter((s) => s.status === "free" || s.status === "free_pending")
  const confirmed = shifts.filter((s) => s.status === "confirmed")
  const rejected = shifts.filter((s) => s.status === "rejected")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus Guardias</CardTitle>
        <CardDescription>Gestiona tus próximas guardias y coberturas</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">Nuevas ({newShifts.length})</TabsTrigger>
            <TabsTrigger value="free">Libres ({freeShifts.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmadas ({confirmed.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazadas ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 mt-4">
            {newShifts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias nuevas</p>
            ) : (
              newShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={currentDoctor.id} />)
            )}
          </TabsContent>

          <TabsContent value="free" className="space-y-4 mt-4">
            {freeShifts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias libres disponibles</p>
            ) : (
              freeShifts.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={currentDoctor.id} />)
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4 mt-4">
            {confirmed.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias confirmadas</p>
            ) : (
              confirmed.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={currentDoctor.id} />)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-4">
            {rejected.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No hay guardias rechazadas</p>
            ) : (
              rejected.map((shift) => <ShiftCard key={shift.id} shift={shift} doctorId={currentDoctor.id} />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
