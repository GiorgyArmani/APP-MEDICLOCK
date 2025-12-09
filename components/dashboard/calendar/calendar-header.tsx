"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CalendarHeaderProps {
    date: Date
    view: "month" | "week" | "day"
    onViewChange: (view: "month" | "week" | "day") => void
    onDateChange: (date: Date) => void
    onToday: () => void
}

export function CalendarHeader({ date, view, onViewChange, onDateChange, onToday }: CalendarHeaderProps) {
    const navigate = (direction: number) => {
        const newDate = new Date(date)
        switch (view) {
            case "month":
                newDate.setMonth(date.getMonth() + direction)
                break
            case "week":
                newDate.setDate(date.getDate() + direction * 7)
                break
            case "day":
                newDate.setDate(date.getDate() + direction)
                break
        }
        onDateChange(newDate)
    }

    const formatDate = () => {
        const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long" }

        if (view === "day") {
            return date.toLocaleDateString("es-ES", { ...options, day: "numeric", weekday: "long" })
        }

        if (view === "week") {
            // Logic for week range label could go here, for now keeping it simple: just month/year
            // or "Semana del X de Mes"
            const startOfWeek = new Date(date)
            startOfWeek.setDate(date.getDate() - date.getDay())
            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6)

            const startStr = startOfWeek.toLocaleDateString("es-ES", { day: 'numeric', month: 'short' })
            const endStr = endOfWeek.toLocaleDateString("es-ES", { day: 'numeric', month: 'short', year: 'numeric' })
            return `${startStr} - ${endStr}`
        }

        // Default Month View
        return date.toLocaleDateString("es-ES", options)
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b bg-white">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <h2 className="text-xl font-bold capitalize text-slate-800 min-w-[200px]">
                    {formatDate()}
                </h2>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Select value={view} onValueChange={(v: "month" | "week" | "day") => onViewChange(v)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Vista" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">Mes</SelectItem>
                        <SelectItem value="week">Semana</SelectItem>
                        <SelectItem value="day">Día</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center border rounded-md bg-slate-50">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-slate-200">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="px-3 font-medium text-sm hover:bg-slate-200" onClick={onToday}>
                        Hoy
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate(1)} className="hover:bg-slate-200">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
