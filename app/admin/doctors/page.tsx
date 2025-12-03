import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getDoctors } from "@/lib/actions/doctors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Phone } from "lucide-react"

export default async function DoctorsPage() {
    const currentDoctor = await getCurrentDoctor()

    if (!currentDoctor) {
        redirect("/login")
    }

    if (currentDoctor.role !== "administrator") {
        redirect("/dashboard")
    }

    const doctors = await getDoctors()

    const roleLabels = {
        internacion: "Internación",
        consultorio: "Consultorio",
        completo: "Completo",
        administrator: "Administrador",
    }

    const roleColors = {
        internacion: "bg-blue-100 text-blue-800",
        consultorio: "bg-green-100 text-green-800",
        completo: "bg-purple-100 text-purple-800",
        administrator: "bg-red-100 text-red-800",
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Médicos</h1>
                    <p className="text-slate-600">Gestión de médicos del sistema</p>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{doctors.length} médicos registrados</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor) => (
                    <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
                                    <Badge className={roleColors[doctor.role]}>{roleLabels[doctor.role]}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{doctor.email}</span>
                            </div>
                            {doctor.phone_number && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="h-4 w-4" />
                                    <span>{doctor.phone_number}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t">
                                <p className="text-xs text-slate-500">
                                    Registrado: {new Date(doctor.created_at).toLocaleDateString("es-ES")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
