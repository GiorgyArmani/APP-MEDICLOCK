import { HonorariosSignupForm } from "@/components/auth/honorarios-signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck } from "lucide-react"

export default function HonorariosSignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200/60">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-slate-900 rounded-2xl">
                            <ClipboardCheck className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-900">Portal de Honorarios</CardTitle>
                    <CardDescription className="font-medium text-slate-500">
                        Registro para personal de Liquidación y Auditoría
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HonorariosSignupForm />
                </CardContent>
            </Card>
        </div>
    )
}
