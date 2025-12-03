"use server"

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { DoctorRole } from "@/lib/supabase/types"

export async function signUp(formData: {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  role: DoctorRole
}) {
  const supabase = await getSupabaseServerClient()

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Failed to create user" }
  }

  // Create doctor profile using admin client to bypass RLS
  const adminSupabase = await getSupabaseAdminClient()
  const { error: profileError } = await adminSupabase.from("doctors").insert({
    id: authData.user.id,
    email: formData.email,
    full_name: formData.fullName,
    phone_number: formData.phoneNumber,
    role: formData.role,
  })

  if (profileError) {
    return { error: profileError.message }
  }

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
