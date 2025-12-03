"use client"

import { useState } from "react"
import { setAvailability, deleteAvailability, type AvailabilitySlot } from "@/lib/actions/availability"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AvailabilityCalendarProps {
    doctorId: string
    availability: AvailabilitySlot[]
}

const DAYS = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
]

export function AvailabilityCalendar({ doctorId, availability }: AvailabilityCalendarProps) {
    const router = useRouter()
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("17:00")
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleDayClick = (dayValue: number) => {
        setSelectedDay(dayValue)
        setIsDialogOpen(true)
        setStartTime("09:00")
        setEndTime("17:00")
        setNotes("")
    }

    const handleSubmit = async () => {
        if (selectedDay === null) return

        setIsSubmitting(true)
        const result = await setAvailability(doctorId, selectedDay, startTime, endTime, notes)

        if (result.error) {
            toast.error(`Error: ${result.error}`)
        } else {
            toast.success("Disponibilidad guardada")
            setIsDialogOpen(false)
            router.refresh()
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (availabilityId: string) => {
        const result = await deleteAvailability(availabilityId)

        if (result.error) {
            toast.error(`Error: ${result.error}`)
        } else {
            toast.success("Disponibilidad eliminada")
            router.refresh()
        }
    }

    const getAvailabilityForDay = (dayValue: number) => {
        return availability.filter((a) => a.day_of_week === dayValue)
    }

    return (
        <>
            <div className="space-y-4">
                {DAYS.map((day) => {
                    const dayAvailability = getAvailabilityForDay(day.value)
                    return (
                        <div
                            key={day.value}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="h-5 w-5 text-slate-400" />
                                    <span className="font-medium">{day.label}</span>
                                </div>
                                {dayAvailability.length > 0 ? (
                                    <div className="ml-8 space-y-2">
                                        {dayAvailability.map((slot) => (
                                            <div key={slot.id} className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                                </Badge>
                                                {slot.notes && (
                                                    <span className="text-sm text-slate-600">({slot.notes})</span>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(slot.id)}
                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="ml-8 text-sm text-slate-500">No disponible</p>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDayClick(day.value)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar
                            </Button>
                        </div>
                    )
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Agregar Disponibilidad - {selectedDay !== null ? DAYS[selectedDay].label : ""}
                        </DialogTitle>
                        <DialogDescription>
                            Configura el horario en el que estás disponible para guardias
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-time">Hora Inicio</Label>
                                <Input
                                    id="start-time"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-time">Hora Fin</Label>
                                <Input
                                    id="end-time"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas (opcional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Ej: Preferencia de turno mañana"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
