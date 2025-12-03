import { redirect } from "next/navigation"
import { getCurrentDoctor } from "@/lib/actions/auth"
import { getShifts } from "@/lib/actions/shifts"
import { ShiftsList } from "@/components/dashboard/shifts-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ShiftsPage() {
    const doctor = await getCurrentDoctor()

    if (!doctor) {
        redirect("/login")
    }

    // Get ALL shifts to show free shifts to everyone
    const allShifts = await getShifts()

    // Filter to show assigned shifts and free shifts
    const myShifts = allShifts.filter((s) => s.doctor_id === doctor.id)

    // ALL doctors can see ALL free shifts
    const freeShifts = allShifts.filter((s) => s.shift_type === "free")

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Mis Guardias</h1>
                <p className="text-slate-600">Gestiona tus guardias asignadas y disponibles</p>
            </div>

            <Tabs defaultValue="assigned" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="assigned">Mis Guardias ({myShifts.length})</TabsTrigger>
                    <TabsTrigger value="available">Disponibles ({freeShifts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="assigned" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Guardias Asignadas</CardTitle>
                            <CardDescription>Guardias que te han sido asignadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {myShifts.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No tienes guardias asignadas</p>
                            ) : (
                                <ShiftsList shifts={myShifts} currentDoctor={doctor} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="available" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Guardias Disponibles</CardTitle>
                            <CardDescription>Guardias libres que puedes aceptar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {freeShifts.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">
                                    No hay guardias disponibles en este momento
                                </p>
                            ) : (
                                <ShiftsList shifts={freeShifts} currentDoctor={doctor} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
