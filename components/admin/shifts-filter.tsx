"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, User, MapPin, Tag, X, CalendarDays } from "lucide-react"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"
import type { Doctor } from "@/lib/supabase/types"
import { useState, useEffect } from "react"

interface ShiftsFilterProps {
    doctors: Doctor[]
    filterDoctorId: string
    setFilterDoctorId: (id: string) => void
    filterArea: string
    setFilterArea: (area: string) => void
    filterStatus?: string
    setFilterStatus?: (status: string) => void
    dateFrom?: Date
    setDateFrom?: (date: Date | undefined) => void
    dateTo?: Date
    setDateTo?: (date: Date | undefined) => void
    onClear: () => void
}

export function ShiftsFilter({
    doctors,
    filterDoctorId,
    setFilterDoctorId,
    filterArea,
    setFilterArea,
    filterStatus,
    setFilterStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    onClear,
}: ShiftsFilterProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const hasFilters =
        filterDoctorId !== "all" ||
        filterArea !== "all" ||
        (filterStatus && filterStatus !== "all") ||
        dateFrom ||
        dateTo

    if (!isMounted) return <div className="h-[74px] w-full bg-slate-50/50 rounded-xl border border-slate-200/60 animate-pulse" />

    return (
        <div className="flex flex-wrap items-end gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 backdrop-blur-sm">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Médico
                </label>
                <Select value={filterDoctorId} onValueChange={setFilterDoctorId}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-200">
                        <SelectValue placeholder="Todos los médicos" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los médicos</SelectItem>
                        {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    Área
                </label>
                <Select value={filterArea} onValueChange={setFilterArea}>
                    <SelectTrigger className="w-[150px] bg-white border-slate-200">
                        <SelectValue placeholder="Todas las áreas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las áreas</SelectItem>
                        <SelectItem value="consultorio">Consultorio</SelectItem>
                        <SelectItem value="internacion">Internación</SelectItem>
                        <SelectItem value="refuerzo">Refuerzo</SelectItem>
                        <SelectItem value="completo">Completo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {setFilterStatus && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        Estado
                    </label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[150px] bg-white border-slate-200">
                            <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="new">Nueva</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="free">Libre</SelectItem>
                            <SelectItem value="rejected">Rechazada</SelectItem>
                            <SelectItem value="free_pending">Pendiente +12h</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {setDateFrom && setDateTo && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
                            <CalendarDays className="w-3 h-3 text-slate-400" />
                            Período
                        </label>
                        <div className="flex gap-1 bg-white border border-slate-200 rounded-md p-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDateFrom(startOfMonth(new Date()))
                                    setDateTo(endOfMonth(new Date()))
                                }}
                                className="h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-slate-50"
                            >
                                Este Mes
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const lastMonth = subMonths(new Date(), 1)
                                    setDateFrom(startOfMonth(lastMonth))
                                    setDateTo(endOfMonth(lastMonth))
                                }}
                                className="h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-slate-50 border-l border-slate-100 rounded-none"
                            >
                                Anterior
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            Desde
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "w-[140px] justify-start text-left font-normal bg-white border-slate-200",
                                        !dateFrom && "text-muted-foreground"
                                    )}
                                >
                                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "DD/MM/YYYY"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-1">
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            Hasta
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "w-[140px] justify-start text-left font-normal bg-white border-slate-200",
                                        !dateTo && "text-muted-foreground"
                                    )}
                                >
                                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "DD/MM/YYYY"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </>
            )}

            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-9 px-3 text-slate-500 hover:text-red-600 transition-colors"
                >
                    <X className="w-4 h-4 mr-1.5" />
                    Limpiar
                </Button>
            )}
        </div>
    )
}
