import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignupSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="space-y-4">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
                        <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">¡Revisa tu correo!</CardTitle>
                    <CardDescription className="text-lg">
                        Hemos enviado un enlace de confirmación a tu dirección de email.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg text-sm text-muted-foreground">
                        <p>
                            Para activar tu cuenta, debes hacer clic en el enlace que enviamos.
                            Si no lo encuentras, revisa tu carpeta de Spam.
                        </p>
                    </div>

                    <Button asChild className="w-full" variant="outline">
                        <Link href="/login">
                            Volver al inicio de sesión
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
