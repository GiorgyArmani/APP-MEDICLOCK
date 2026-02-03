"use client"

import { useState } from "react"
import { signUp } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export function HonorariosSignupForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const fullName = formData.get("fullName") as string
        const phoneNumber = formData.get("phoneNumber") as string

        const result = await signUp({
            email,
            password,
            fullName,
            phoneNumber,
            role: "honorarios",
        })

        if (result?.error) {
            setError(result.error)
            setIsLoading(false)
        }
    }

    return (
        <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Ej: Lic. María García"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número de teléfono</Label>
                <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico profesional</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="audit@clinica.com"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={6}
                />
                <p className="text-xs text-muted-foreground">Debe tener al menos 6 caracteres</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
                {isLoading ? "Creando cuenta de Auditor..." : "Registrarse como Auditor"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                    Iniciar sesión
                </Link>
            </p>
        </form>
    )
}
