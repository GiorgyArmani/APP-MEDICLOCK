import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getAvailability } from "@/lib/actions/availability"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvailabilityCalendar } from "@/components/availability/availability-calendar"
import { Calendar, Info } from "lucide-react"

export default async function AvailabilityPage() {
    const doctor = await getCurrentDoctor()

    if (!doctor) {
        redirect("/login")
    }

    const availability = await getAvailability(doctor.id)

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Mi Disponibilidad</h1>
                <p className="text-slate-600">Configura tu disponibilidad semanal para guardias</p>
            </div>

            <div className="grid gap-6">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-900">
                                <p className="font-medium mb-1">¿Cómo funciona?</p>
                                <p>
                                    Configura los días y horarios en los que estás disponible para guardias. El
                                    administrador podrá ver tu disponibilidad al asignar guardias.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Horario Semanal
                        </CardTitle>
                        <CardDescription>
                            Haz clic en un día para agregar o editar tu disponibilidad
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AvailabilityCalendar doctorId={doctor.id} availability={availability} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
