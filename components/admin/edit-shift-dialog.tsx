"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Shift } from "@/lib/supabase/types"
import { updateShift } from "@/lib/actions/shifts"
import { SHIFT_TYPES } from "@/lib/constants/shift-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface EditShiftDialogProps {
    shift: Shift
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditShiftDialog({ shift, open, onOpenChange }: EditShiftDialogProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [selectedCategory, setSelectedCategory] = useState(shift.shift_category)
    const [shiftDate, setShiftDate] = useState(shift.shift_date)
    const [notes, setNotes] = useState(shift.notes || "")

    // Recurrence logic for converting single shift to perpetual
    const [isRecurring, setIsRecurring] = useState(false)
    const [recurrenceEndDate, setRecurrenceEndDate] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const shiftInfo = SHIFT_TYPES.find((st) => st.value === selectedCategory)
        if (!shiftInfo) {
            toast.error("Selecciona un tipo de guardia válido")
            return
        }

        startTransition(async () => {
            const result = await updateShift(shift.id, {
                shift_category: selectedCategory,
                shift_area: shiftInfo.area,
                shift_hours: shiftInfo.hours,
                shift_date: shiftDate,
                notes: notes || null,
                // Pass recurrence params
                isRecurring,
                recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined
            })

            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success("Guardia actualizada exitosamente")
                onOpenChange(false)
                router.refresh()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Guardia</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de la guardia
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tipo de Guardia */}
                    <div className="space-y-2">
                        <Label htmlFor="shiftCategory">Tipo de Guardia *</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                            <SelectTrigger id="shiftCategory">
                                <SelectValue placeholder="Selecciona el tipo de guardia" />
                            </SelectTrigger>
                            <SelectContent>
                                {SHIFT_TYPES.map((shiftType) => (
                                    <SelectItem key={shiftType.value} value={shiftType.value}>
                                        {shiftType.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fecha y Recurrencia */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="shiftDate">Fecha de Inicio *</Label>
                            <Input
                                id="shiftDate"
                                type="date"
                                value={shiftDate}
                                onChange={(e) => setShiftDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Recurrence Option - Only show if not already part of a series or if we want to extend it? 
                            User request: "so all the shift that i have already created ... can be easyly added into this perpetual status"
                            This implies taking a single shift and making it recurring.
                        */}
                        {!shift.recurrence_id && (
                            <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="isRecurring" className="flex-1 cursor-pointer font-medium">
                                    Convertir en Guardia Perpetua (Repetir semanalmente)
                                </Label>
                            </div>
                        )}

                        {isRecurring && (
                            <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                                <Label htmlFor="recurrenceEndDate">Repetir hasta *</Label>
                                <Input
                                    id="recurrenceEndDate"
                                    type="date"
                                    value={recurrenceEndDate}
                                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                    required={isRecurring}
                                    min={shiftDate}
                                />
                                <p className="text-xs text-slate-500">
                                    Se crearán nuevas guardias semanales desde esta fecha.
                                </p>
                            </div>
                        )}

                        {/* Info if already recurring */}
                        {shift.recurrence_id && (
                            <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-md">
                                Esta guardia es parte de una serie recurrente.
                            </div>
                        )}
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Información adicional sobre la guardia..."
                            rows={3}
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
