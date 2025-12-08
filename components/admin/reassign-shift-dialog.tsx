"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Shift, Doctor, DoctorRole } from "@/lib/supabase/types"
import { updateShift } from "@/lib/actions/shifts"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
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
    const [selectedPools, setSelectedPools] = useState<DoctorRole[]>(shift.assigned_to_pool || [])

    const currentDoctor = shift.doctor_id ? doctors.find((d) => d.id === shift.doctor_id) : null

    const togglePool = (role: DoctorRole) => {
        if (role === "administrator") return
        setSelectedPools((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (assignmentType === "assigned" && !selectedDoctor) {
            toast.error("Selecciona un médico")
            return
        }

        if (assignmentType === "free" && selectedPools.length === 0) {
            toast.error("Selecciona al menos un pool de médicos")
            return
        }

        startTransition(async () => {
            const updates: any = {
                shift_type: assignmentType,
                status: assignmentType === "assigned" ? "new" : "free",
            }

            if (assignmentType === "assigned") {
                updates.doctor_id = selectedDoctor
                updates.assigned_to_pool = null
            } else {
                updates.doctor_id = null
                updates.assigned_to_pool = selectedPools
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
                                <SelectItem value="free">Libre (pool de médicos)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Médico Asignado */}
                    {assignmentType === "assigned" ? (
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
                    ) : (
                        <div className="space-y-2">
                            <Label>Pool de Médicos *</Label>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPools.includes("internacion")}
                                                onChange={() => togglePool("internacion")}
                                                className="w-4 h-4 rounded border-slate-300"
                                            />
                                            <span className="text-sm">Internación</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPools.includes("consultorio")}
                                                onChange={() => togglePool("consultorio")}
                                                className="w-4 h-4 rounded border-slate-300"
                                            />
                                            <span className="text-sm">Consultorio</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPools.includes("completo")}
                                                onChange={() => togglePool("completo")}
                                                className="w-4 h-4 rounded border-slate-300"
                                            />
                                            <span className="text-sm">Completo</span>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
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
