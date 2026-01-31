"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Shift, Doctor } from "@/lib/supabase/types"
import { updateShift } from "@/lib/actions/shifts"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface ReassignShiftDialogProps {
    shift: Shift
    doctors: Doctor[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReassignShiftDialog({ shift, doctors, open, onOpenChange }: ReassignShiftDialogProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [assignmentType, setAssignmentType] = useState<"assigned" | "free">(shift.shift_type)
    const [selectedDoctor, setSelectedDoctor] = useState<string>(shift.doctor_id || "")

    const currentDoctor = shift.doctor_id ? doctors.find((d) => d.id === shift.doctor_id) : null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (assignmentType === "assigned" && !selectedDoctor) {
            toast.error("Selecciona un médico")
            return
        }

        startTransition(async () => {
            const updates: any = {
                shift_type: assignmentType,
                status: assignmentType === "assigned" ? "new" : "free",
                doctor_id: assignmentType === "assigned" ? selectedDoctor : null,
                assigned_to_pool: null,
            }

            const result = await updateShift(shift.id, updates)

            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success("Guardia reasignada exitosamente")
                onOpenChange(false)
                router.refresh()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Reasignar Guardia</DialogTitle>
                    <DialogDescription>
                        Cambia el médico asignado o convierte a guardia libre
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Asignación Actual */}
                    {currentDoctor && (
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-sm text-blue-900">
                                <span className="font-medium">Asignación actual:</span> {currentDoctor.full_name}
                            </p>
                        </div>
                    )}

                    {/* Tipo de Asignación */}
                    <div className="space-y-2">
                        <Label>Tipo de Asignación</Label>
                        <Select value={assignmentType} onValueChange={(value: "assigned" | "free") => setAssignmentType(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="assigned">Asignada (a médico específico)</SelectItem>
                                <SelectItem value="free">Libre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Médico Asignado */}
                    {assignmentType === "assigned" && (
                        <div className="space-y-2">
                            <Label htmlFor="doctor">Médico Asignado *</Label>
                            <Select value={selectedDoctor} onValueChange={setSelectedDoctor} required>
                                <SelectTrigger id="doctor">
                                    <SelectValue placeholder="Selecciona un médico" />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map((doctor) => (
                                        <SelectItem key={doctor.id} value={doctor.id}>
                                            {doctor.full_name} - {doctor.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

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
                            {isPending ? "Reasignando..." : "Reasignar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
