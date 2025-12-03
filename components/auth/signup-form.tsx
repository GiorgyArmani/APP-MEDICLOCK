"use client"

import { useState } from "react"
import { signUp } from "@/lib/actions/auth"
import type { DoctorRole } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<DoctorRole | "">("")

  async function onSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const phoneNumber = formData.get("phoneNumber") as string

    if (!role) {
      setError("Please select a doctor role")
      setIsLoading(false)
      return
    }

    const result = await signUp({
      email,
      password,
      fullName,
      phoneNumber,
      role,
    })

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
    // If successful, signUp will redirect to dashboard
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Dr. Juan Pérez"
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
        <p className="text-xs text-muted-foreground">Para notificaciones de WhatsApp</p>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="role">Rol de médico</Label>
        <Select value={role} onValueChange={(value) => setRole(value as DoctorRole)} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tu rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="internacion">Internación (Internist)</SelectItem>
            <SelectItem value="consultorio">Consultorio (Office Physician)</SelectItem>
            <SelectItem value="completo">Completo (Full-Service Physician)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creando cuenta..." : "Registrarse"}
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
