"use client"

import { useState, useMemo } from "react"
import { startOfMonth, endOfMonth } from "date-fns"
import type { Shift, Doctor } from "@/lib/supabase/types"
import { HonorariosShiftCard } from "./honorarios-shift-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShiftsFilter } from "@/components/admin/shifts-filter"
import { Button } from "@/components/ui/button"
import { Download, Calendar as CalendarIcon, Users, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { ShiftsCalendar } from "@/components/dashboard/shifts-calendar"

interface HonorariosShiftsListProps {
    shifts: Shift[]
    doctors: Doctor[]
}

export function HonorariosShiftsList({ shifts, doctors }: HonorariosShiftsListProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [filterDoctorId, setFilterDoctorId] = useState<string>("all")
    const [filterArea, setFilterArea] = useState<string>("all")
    const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(new Date()))
    const [dateTo, setDateTo] = useState<Date | undefined>(endOfMonth(new Date()))

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const filteredShifts = useMemo(() => {
        return shifts.filter((shift) => {
            const matchesDoctor = filterDoctorId === "all" || shift.doctor_id === filterDoctorId
            const matchesArea = filterArea === "all" || shift.shift_area === filterArea

            // Date filtering
            const shiftDate = new Date(shift.shift_date + "T00:00:00")
            const matchesDateFrom = !dateFrom || shiftDate >= dateFrom
            const matchesDateTo = !dateTo || shiftDate <= dateTo

            return matchesDoctor && matchesArea && matchesDateFrom && matchesDateTo
        })
    }, [shifts, filterDoctorId, filterArea, dateFrom, dateTo])

    const newShifts = filteredShifts.filter((s) => s.status === "new")
    const freeShifts = filteredShifts.filter((s) => s.status === "free" || s.status === "free_pending")
    const confirmedShifts = filteredShifts.filter((s) => s.status === "confirmed")
    const confirmedCount = confirmedShifts.length
    const pendingCount = newShifts.length + freeShifts.length

    const clearFilters = () => {
        setFilterDoctorId("all")
        setFilterArea("all")
        setDateFrom(undefined)
        setDateTo(undefined)
    }

    if (!isMounted) return null

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden border-none shadow-md group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Filtrado</CardTitle>
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900">{filteredShifts.length}</div>
                        <p className="text-xs font-semibold text-blue-600/70 mt-1">Guardias encontradas</p>
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
                        <div className="text-3xl font-black text-slate-900">{pendingCount}</div>
                        <p className="text-xs font-semibold text-amber-600/70 mt-1">En el rango seleccionado</p>
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
                        <div className="text-3xl font-black text-slate-900">{confirmedCount}</div>
                        <p className="text-xs font-semibold text-green-600/70 mt-1">Listas para liquidar</p>
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
                        <div className="text-3xl font-black text-slate-900">
                            {new Set(filteredShifts.map((s) => s.doctor_id).filter(Boolean)).size}
                        </div>
                        <p className="text-xs font-semibold text-indigo-600/70 mt-1">Personal en este período</p>
                    </CardContent>
                </Card>
            </div>

            <ShiftsFilter
                doctors={doctors}
                filterDoctorId={filterDoctorId}
                setFilterDoctorId={setFilterDoctorId}
                filterArea={filterArea}
                setFilterArea={setFilterArea}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                onClear={clearFilters}
            />

            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-xl font-bold text-slate-900">Gestión de Guardias</CardTitle>
                            <CardDescription>Consulta el calendario y lista detallada de guardias</CardDescription>
                        </div>
                        <Link href="/honorarios/reports">
                            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                                <Download className="h-4 w-4" />
                                Generar Reporte
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    <Tabs defaultValue="list" className="w-full">
                        <div className="px-4 pt-4 sm:px-0 sm:pt-0 mb-6 border-b border-slate-100 pb-4">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1 rounded-lg max-w-md">
                                <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Vista de Lista</TabsTrigger>
                                <TabsTrigger value="calendar" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Calendario</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="calendar" className="mt-0">
                            <ShiftsCalendar shifts={filteredShifts} doctors={doctors} readOnly={true} />
                        </TabsContent>

                        <TabsContent value="list" className="mt-0 space-y-6">
                            <Tabs defaultValue="all" className="w-full">
                                <div className="px-4 sm:px-0">
                                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-slate-100/50 p-1 rounded-lg">
                                        <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Todas ({filteredShifts.length})</TabsTrigger>
                                        <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Nuevas ({newShifts.length})</TabsTrigger>
                                        <TabsTrigger value="free" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Libres ({freeShifts.length})</TabsTrigger>
                                        <TabsTrigger value="confirmed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Confirmadas ({confirmedCount})</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="all" className="space-y-4 mt-6">
                                    {filteredShifts.length === 0 ? (
                                        <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias que coincidan con los filtros</p>
                                    ) : (
                                        filteredShifts.map((shift) => <HonorariosShiftCard key={shift.id} shift={shift} doctors={doctors} />)
                                    )}
                                </TabsContent>

                                <TabsContent value="new" className="space-y-4 mt-6">
                                    {newShifts.length === 0 ? (
                                        <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias nuevas con estos filtros</p>
                                    ) : (
                                        newShifts.map((shift) => <HonorariosShiftCard key={shift.id} shift={shift} doctors={doctors} />)
                                    )}
                                </TabsContent>

                                <TabsContent value="free" className="space-y-4 mt-6">
                                    {freeShifts.length === 0 ? (
                                        <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias libres con estos filtros</p>
                                    ) : (
                                        freeShifts.map((shift) => <HonorariosShiftCard key={shift.id} shift={shift} doctors={doctors} />)
                                    )}
                                </TabsContent>

                                <TabsContent value="confirmed" className="space-y-4 mt-6">
                                    {confirmedShifts.length === 0 ? (
                                        <p className="text-center text-slate-500 py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No hay guardias confirmadas con estos filtros</p>
                                    ) : (
                                        confirmedShifts.map((shift) => <HonorariosShiftCard key={shift.id} shift={shift} doctors={doctors} />)
                                    )}
                                </TabsContent>
                            </Tabs>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
