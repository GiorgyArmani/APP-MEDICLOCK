"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateShiftForm } from "./create-shift-form"
import type { Doctor } from "@/lib/supabase/types"

interface CreateShiftDialogProps {
    doctors: Doctor[]
}

export function CreateShiftDialog({ doctors }: CreateShiftDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Guardia
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Guardia</DialogTitle>
                    <DialogDescription>
                        Asigna una guardia a un médico específico o déjala libre para el pool
                    </DialogDescription>
                </DialogHeader>
                <CreateShiftForm doctors={doctors} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
