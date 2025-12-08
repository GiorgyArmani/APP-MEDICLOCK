"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Shift } from "@/lib/supabase/types"
import { deleteShift } from "@/lib/actions/shifts"
import { SHIFT_TYPES } from "@/lib/constants/shift-types"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface DeleteShiftDialogProps {
    shift: Shift
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteShiftDialog({ shift, open, onOpenChange }: DeleteShiftDialogProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const shiftTypeInfo = SHIFT_TYPES.find((st) => st.value === shift.shift_category)
    const shiftLabel = shiftTypeInfo?.label || shift.shift_category

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00")
        return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    }

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteShift(shift.id)
            if (result.error) {
                toast.error(`Error: ${result.error}`)
            } else {
                toast.success("Guardia eliminada exitosamente")
                onOpenChange(false)
                router.refresh()
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar guardia?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>Esta acción no se puede deshacer. Se eliminará permanentemente:</p>
                        <div className="bg-slate-50 p-3 rounded-md mt-2 space-y-1 text-slate-900">
                            <p><span className="font-medium">Tipo:</span> {shiftLabel}</p>
                            <p><span className="font-medium">Fecha:</span> {formatDate(shift.shift_date)}</p>
                            <p><span className="font-medium">Horario:</span> {shift.shift_hours}</p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isPending ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
