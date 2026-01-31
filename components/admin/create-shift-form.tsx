"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createShift } from "@/lib/actions/shifts"
import { SHIFT_TYPES } from "@/lib/constants/shift-types"
import type { Doctor } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CreateShiftFormProps {
  doctors: Doctor[]
  onSuccess?: () => void
}

export function CreateShiftForm({ doctors, onSuccess }: CreateShiftFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [shiftType, setShiftType] = useState<"assigned" | "free">("assigned")
  const [selectedDoctor, setSelectedDoctor] = useState<string>("")
  const [selectedShiftCategory, setSelectedShiftCategory] = useState<string>("")

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("")

  const [formData, setFormData] = useState({
    shiftDate: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const shiftInfo = SHIFT_TYPES.find((st) => st.value === selectedShiftCategory)
    if (!shiftInfo) {
      toast.error("Selecciona un tipo de guardia válido")
      return
    }

    startTransition(async () => {
      const result = await createShift({
        doctor_id: shiftType === "assigned" ? selectedDoctor : null,
        shift_type: shiftType,
        shift_category: selectedShiftCategory,
        shift_area: shiftInfo.area,
        shift_hours: shiftInfo.hours,
        shift_date: formData.shiftDate,
        status: shiftType === "assigned" ? "new" : "free",
        notes: formData.notes,
        isRecurring,
        recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined,
      })

      if (result.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        toast.success("Guardia creada exitosamente")
        // Reset form
        setFormData({ shiftDate: "", notes: "" })
        setSelectedDoctor("")
        setSelectedShiftCategory("")
        setIsRecurring(false)
        setRecurrenceEndDate("")
        router.refresh()
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo de Guardia */}
      <div className="space-y-2">
        <Label>Tipo de Asignación</Label>
        <Select value={shiftType} onValueChange={(value: "assigned" | "free") => setShiftType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assigned">Asignada (a médico específico)</SelectItem>
            <SelectItem value="free">Libre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categoría de Guardia */}
      <div className="space-y-2">
        <Label htmlFor="shiftCategory">Tipo de Guardia *</Label>
        <Select value={selectedShiftCategory} onValueChange={setSelectedShiftCategory} required>
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

      {/* Asignación de Médico */}
      {shiftType === "assigned" && (
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

      {/* Fecha y Recurrencia */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shiftDate">Fecha de Inicio *</Label>
          <Input
            id="shiftDate"
            type="date"
            value={formData.shiftDate}
            onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
            required
          />
        </div>

        <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="isRecurring" className="flex-1 cursor-pointer font-medium">
            Repetir semanalmente (Guardia Perpetua)
          </Label>
        </div>

        {isRecurring && (
          <div className="space-y-2 pl-4 border-l-2 border-slate-200">
            <Label htmlFor="recurrenceEndDate">Repetir hasta *</Label>
            <Input
              id="recurrenceEndDate"
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => setRecurrenceEndDate(e.target.value)}
              required={isRecurring}
              min={formData.shiftDate}
            />
            <p className="text-xs text-slate-500">
              Se crearán guardias semanales desde la fecha de inicio hasta esta fecha.
            </p>
          </div>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Información adicional sobre la guardia..."
          rows={3}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end pt-4">
        <Button type="submit" disabled={isPending} className="min-w-[120px]">
          {isPending ? "Creando..." : "Crear Guardia"}
        </Button>
      </div>
    </form>
  )
}
