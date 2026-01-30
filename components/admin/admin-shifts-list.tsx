"use client"

import { useState } from "react"
import type { Shift, Doctor } from "@/lib/supabase/types"
import { AdminShiftCard } from "./admin-shift-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShiftsFilter } from "./shifts-filter"

interface AdminShiftsListProps {
  shifts: Shift[]
  doctors: Doctor[]
  currentDoctor?: Doctor
}

export function AdminShiftsList({ shifts, doctors, currentDoctor }: AdminShiftsListProps) {
  const [filterDoctorId, setFilterDoctorId] = useState<string>("all")
  const [filterArea, setFilterArea] = useState<string>("all")

  const filteredShifts = shifts.filter((shift) => {
    const matchesDoctor = filterDoctorId === "all" || shift.doctor_id === filterDoctorId
    const matchesArea = filterArea === "all" || shift.shift_area === filterArea
    return matchesDoctor && matchesArea
  })

  const newShifts = filteredShifts.filter((s) => s.status === "new")
  const freeShifts = filteredShifts.filter((s) => s.status === "free" || s.status === "free_pending")
  const confirmedShifts = filteredShifts.filter((s) => s.status === "confirmed")

  const clearFilters = () => {
    setFilterDoctorId("all")
    setFilterArea("all")
  }

  return (
    <div className="space-y-6">
      <ShiftsFilter
        doctors={doctors}
        filterDoctorId={filterDoctorId}
        setFilterDoctorId={setFilterDoctorId}
        filterArea={filterArea}
        setFilterArea={setFilterArea}
        onClear={clearFilters}
      />

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-xl font-bold text-slate-900">Todas las Guardias</CardTitle>
            <CardDescription>Vista completa de todas las guardias del sistema</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="px-4 pt-4 sm:px-0 sm:pt-0">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-slate-100/50 p-1 rounded-lg">
                <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todas ({filteredShifts.length})</TabsTrigger>
                <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Nuevas ({newShifts.length})</TabsTrigger>
                <TabsTrigger value="free" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Libres ({freeShifts.length})</TabsTrigger>
                <TabsTrigger value="confirmed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Confirmadas ({confirmedShifts.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4 mt-6 px-4 pb-6 sm:px-0 sm:pb-0">
              {filteredShifts.length === 0 ? (
                <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias que coincidan con los filtros</p>
              ) : (
                filteredShifts.map((shift) => <AdminShiftCard key={shift.id} shift={shift} doctors={doctors} currentDoctor={currentDoctor} />)
              )}
            </TabsContent>

            <TabsContent value="new" className="space-y-4 mt-6 px-4 pb-6 sm:px-0 sm:pb-0">
              {newShifts.length === 0 ? (
                <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias nuevas con estos filtros</p>
              ) : (
                newShifts.map((shift) => <AdminShiftCard key={shift.id} shift={shift} doctors={doctors} currentDoctor={currentDoctor} />)
              )}
            </TabsContent>

            <TabsContent value="free" className="space-y-4 mt-6 px-4 pb-6 sm:px-0 sm:pb-0">
              {freeShifts.length === 0 ? (
                <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias libres con estos filtros</p>
              ) : (
                freeShifts.map((shift) => <AdminShiftCard key={shift.id} shift={shift} doctors={doctors} currentDoctor={currentDoctor} />)
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4 mt-6 px-4 pb-6 sm:px-0 sm:pb-0">
              {confirmedShifts.length === 0 ? (
                <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias confirmadas con estos filtros</p>
              ) : (
                confirmedShifts.map((shift) => <AdminShiftCard key={shift.id} shift={shift} doctors={doctors} currentDoctor={currentDoctor} />)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
