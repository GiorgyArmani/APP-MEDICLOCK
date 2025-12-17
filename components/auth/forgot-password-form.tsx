"use client"

import { useState } from "react"
import { forgotPassword } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        const email = formData.get("email") as string
        const result = await forgotPassword(email)

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        } else {
            setIsSuccess(true)
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="space-y-6">
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Correo enviado</AlertTitle>
                    <AlertDescription className="text-green-700">
                        Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña.
                    </AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Volver al inicio de sesión</Link>
                </Button>
            </div>
        )
    }

    return (
        <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="doctor@clinica.com"
                    required
                    disabled={isLoading}
                />
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </Button>

            <div className="text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                </Link>
            </div>
        </form>
    )
}
