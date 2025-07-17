"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import AuthForm from "@/components/auth/auth-form"
import { useRouter } from "next/navigation"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Error getting session:", error)
          setUser(null)
        } else {
          console.log("Session initialized:", session?.user?.id || "No session")
          setUser(session?.user ?? null)

          if (session?.user) {
            console.log("User authenticated, redirecting to chat...")
            router.push("/chat")
          }
        }
      } catch (error) {
        console.error("Unexpected error initializing auth:", error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.id || "No user")

      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in, redirecting to chat...")
        router.push("/chat")
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out, staying on home page")
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-300">Iniciando...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-300">Redirigiendo a chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AuthForm />
    </div>
  )
}
