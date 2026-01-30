"use client"

import type { Shift, Doctor } from "@/lib/supabase/types"
import { ShiftCard } from "@/components/dashboard/shift-card"
import { Clock, CalendarCheck } from "lucide-react"

interface TodayShiftsProps {
    shifts: Shift[]
    currentDoctor: Doctor
}

export function TodayShifts({ shifts, currentDoctor }: TodayShiftsProps) {
    // Get today's date in YYYY-MM-DD format (local time)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const todayStr = `${year}-${month}-${day}`

    // Filter shifts for today that are assigned to the current doctor
    const todayShifts = shifts.filter(
        (s) => s.shift_date === todayStr && s.doctor_id === currentDoctor.id
    )

    if (todayShifts.length === 0) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-full">
                    <Clock className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                    Guardias de Hoy
                </h2>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    En Curso
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayShifts.map((shift) => (
                    <div key={shift.id} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative">
                            <ShiftCard shift={shift} doctorId={currentDoctor.id} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
