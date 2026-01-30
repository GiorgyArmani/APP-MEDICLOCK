"use client"

import { User, MapPin, Tag, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Doctor } from "@/lib/supabase/types"

interface ShiftsFilterProps {
    doctors: Doctor[]
    filterDoctorId: string
    setFilterDoctorId: (id: string) => void
    filterArea: string
    setFilterArea: (area: string) => void
    filterStatus?: string
    setFilterStatus?: (status: string) => void
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
    onClear
}: ShiftsFilterProps) {
    const hasFilters = filterDoctorId !== "all" || filterArea !== "all" || (filterStatus && filterStatus !== "all")

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
