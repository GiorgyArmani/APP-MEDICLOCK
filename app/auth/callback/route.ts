import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const next = requestUrl.searchParams.get("next") || "/dashboard"

    console.log("[Auth Callback] Processing callback")
    console.log("[Auth Callback] Request URL:", request.url)
    console.log("[Auth Callback] Code present:", !!code)
    console.log("[Auth Callback] Next path:", next)

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log("[Auth Callback] Session exchanged successfully")
            console.log("[Auth Callback] Redirecting to:", `${requestUrl.origin}${next}`)
            return NextResponse.redirect(`${requestUrl.origin}${next}`)
        } else {
            console.error("[Auth Callback] Error exchanging code:", error)
        }
    } else {
        console.error("[Auth Callback] No code provided")
        // Check for error description in params
        const errorDescription = requestUrl.searchParams.get("error_description")
        if (errorDescription) {
            console.error("[Auth Callback] Error from provider:", errorDescription)
        }
    }

    // Return the user to an error page with instructions
    console.log("[Auth Callback] Redirecting to login with error")
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate user`)
}
