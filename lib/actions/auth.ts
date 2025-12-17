"use server"

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { DoctorRole } from "@/lib/supabase/types"
import { sendPasswordRecoveryEmail, sendWelcomeEmail } from "@/lib/notifications/email"

export async function signUp(formData: {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  role: DoctorRole
}) {
  const adminSupabase = await getSupabaseAdminClient()
  const supabase = await getSupabaseServerClient()

  // 1. Create user with Admin API (Auto-confirm email)
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true, // Auto-confirm the user
    user_metadata: {
      full_name: formData.fullName,
    },
  })

  if (authError) {
    console.error("Error creating user:", authError)
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Failed to create user" }
  }

  // 2. Create doctor profile
  const { error: profileError } = await adminSupabase.from("doctors").insert({
    id: authData.user.id,
    email: formData.email,
    full_name: formData.fullName,
    phone_number: formData.phoneNumber,
    role: formData.role,
  })

  if (profileError) {
    console.error("Error creating profile:", profileError)
    // Optional: Delete the auth user if profile creation fails?
    // await adminSupabase.auth.admin.deleteUser(authData.user.id)
    return { error: profileError.message }
  }

  // 3. Immediately Sign In the user to establish a session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (signInError) {
    console.error("Error signing in after signup:", signInError)
    return { error: "Account created but failed to sign in. Please try logging in." }
  }

  // 4. Send custom welcome email
  await sendWelcomeEmail(formData.email, formData.fullName, formData.role)

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signIn(email: string, password: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function signOut() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function getCurrentDoctor() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: doctor, error } = await supabase.from("doctors").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Error fetching doctor profile:", error)
    return null
  }

  return doctor
}

export async function forgotPassword(email: string) {
  const adminSupabase = await getSupabaseAdminClient()

  // 1. Generate recovery link
  const { data, error } = await adminSupabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/auth/update-password`,
    },
  })

  if (error) {
    console.error("Error generating recovery link:", error)
    return { error: "No se pudo generar el enlace de recuperación. Verifica el correo." }
  }

  if (!data?.properties?.action_link) {
    return { error: "Error al generar enlace." }
  }

  // 2. Send custom email
  const emailResult = await sendPasswordRecoveryEmail(email, data.properties.action_link)

  if (!emailResult.success) {
    return { error: "Error al enviar el correo. Intenta nuevamente." }
  }

  return { success: true }
}

export async function updatePassword(password: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error("Error updating password:", error)
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
