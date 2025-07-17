"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/types"
import Header from "@/components/layout/header"
import UserList from "@/components/chat/user-list"
import DirectMessageList from "@/components/chat/direct-message-list"
import DirectMessageInput from "@/components/chat/direct-message-input"

// Debounce utility
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [userDecision, setUserDecision] = useState<"none" | "stay" | "exit">("none")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const initializationRef = useRef(false)
  const mountedRef = useRef(true)

  // Debounced online status update
  const debouncedUpdateOnlineStatus = useCallback(
    debounce(async (userId: string, isOnline: boolean) => {
      if (!mountedRef.current) return
      try {
        await supabase.rpc("update_user_online_status", {
          user_id: userId,
          is_online: isOnline,
        })
        console.log("📡 Online status updated:", isOnline)
      } catch (error) {
        console.error("❌ Error updating online status:", error)
      }
    }, 500),
    [supabase]
  )

  // Optimized profile fetching
  const fetchUserProfile = useCallback(async (userId: string): Promise<Profile> => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError
      
      // Ensure we return a properly typed Profile object
      return profileData as Profile
    } catch (error) {
      console.error("❌ Error fetching profile:", error)
      throw error
    }
  }, [supabase])

  // Main initialization effect - OPTIMIZED
  useEffect(() => {
    if (initializationRef.current) return
    initializationRef.current = true

    const initializeChat = async () => {
      try {
        console.log("🔄 Initializing chat...")
        setInitError(null)

        // Check session first (fastest operation)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!mountedRef.current) return

        if (sessionError || !session?.user) {
          console.log("❌ No valid session, redirecting to login")
          router.push("/")
          return
        }

        console.log("✅ Valid session found, loading profile...")

        // Fetch profile data
        const profileData = await fetchUserProfile(session.user.id)
        
        if (!mountedRef.current) return

        console.log("✅ Profile loaded:", profileData.username)
        setProfile(profileData)
        setLoading(false)

        // Update online status in background (non-blocking)
        debouncedUpdateOnlineStatus(profileData.id, true)

      } catch (error) {
        console.error("💥 Error in initializeChat:", error)
        if (mountedRef.current) {
          setInitError("Error al cargar el perfil. Por favor, inténtalo de nuevo.")
          setLoading(false)
        }
      }
    }

    initializeChat()
  }, [router, fetchUserProfile, debouncedUpdateOnlineStatus])

  // Online status management - OPTIMIZED
  useEffect(() => {
    if (!profile) return

    let isActive = true

    const handleBeforeUnload = () => {
      // Synchronous call for immediate execution
      navigator.sendBeacon(`/api/user-status`, JSON.stringify({
        userId: profile.id,
        isOnline: false
      }))
    }

    const handleVisibilityChange = () => {
      if (!isActive) return
      
      if (document.visibilityState === "hidden") {
        debouncedUpdateOnlineStatus(profile.id, false)
      } else {
        debouncedUpdateOnlineStatus(profile.id, true)
      }
    }

    const handleFocus = () => {
      if (isActive) debouncedUpdateOnlineStatus(profile.id, true)
    }

    const handleBlur = () => {
      if (isActive) debouncedUpdateOnlineStatus(profile.id, false)
    }

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)

    return () => {
      isActive = false
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
      
      // Final offline status update
      if (profile.id) {
        debouncedUpdateOnlineStatus(profile.id, false)
      }
    }
  }, [profile, debouncedUpdateOnlineStatus])

  // Auth state change listener - SIMPLIFIED
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state changed:", event)
      
      // Only handle SIGNED_OUT event
      if (event === 'SIGNED_OUT' && !showExitConfirmation) {
        router.push("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router, showExitConfirmation])

  // User decision handler - OPTIMIZED
  useEffect(() => {
    if (userDecision === "exit") {
      console.log("🚪 User chose to exit, executing logout...")
      executeLogout()
    } else if (userDecision === "stay") {
      console.log("🏠 User chose to stay")
      setShowExitConfirmation(false)
      setUserDecision("none")
    }
  }, [userDecision])

  // Logout execution - OPTIMIZED
  const executeLogout = useCallback(async () => {
    console.log("🔄 Executing logout...")
    setIsLoggingOut(true)

    try {
      // Parallel operations for faster logout
      const logoutPromises = []
      
      if (profile) {
        logoutPromises.push(
          supabase.rpc("update_user_online_status", {
            user_id: profile.id,
            is_online: false,
          })
        )
      }
      
      logoutPromises.push(supabase.auth.signOut())

      await Promise.allSettled(logoutPromises)
      
      // Immediate redirect
      router.push("/")
    } catch (error) {
      console.error("❌ Error during logout:", error)
      router.push("/")
    }
  }, [profile, supabase, router])

  const handleLogout = useCallback(() => {
    console.log("🔄 Starting logout process...")
    setShowExitConfirmation(true)
  }, [])

  const handleContinueExit = useCallback(() => {
    console.log("🔴 User confirmed exit")
    setUserDecision("exit")
  }, [])

  const handleCancelExit = useCallback(() => {
    console.log("🟢 User cancelled exit")
    setUserDecision("stay")
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-500 mx-auto mb-4"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-500 text-xl">💬</span>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-green-100 mb-2">Cargando Saytro</h3>
        <p className="text-green-300 text-sm">Preparando tu experiencia de chat...</p>
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  ), [])

  // Error state
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center max-w-md mx-4">
          <div className="h-16 w-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-green-100 mb-2">Error de conexión</h3>
          <p className="text-green-300 text-sm mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return LoadingComponent
  }

  // Exit confirmation state
  if (showExitConfirmation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4 border border-green-800">
          <div className="text-center">
            <div className="h-16 w-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-green-100 mb-2">Confirmar salida</h2>
            <p className="text-green-300 mb-6">¿Seguro que desea salir de Saytro?</p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelExit}
                disabled={userDecision !== "none" || isLoggingOut}
                className="flex-1 px-4 py-2 bg-gray-700 text-green-100 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {userDecision === "stay" ? "Cargando..." : "Cancelar"}
              </button>
              <button
                onClick={handleContinueExit}
                disabled={userDecision !== "none" || isLoggingOut}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {userDecision === "exit" || isLoggingOut ? "Saliendo..." : "Salir"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Profile validation
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-100">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Main chat interface
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Header profile={profile} onLogout={handleLogout} />

      <div className="flex-1 flex overflow-hidden">
        {/* User List */}
        <div className="w-80 border-r border-green-800 bg-gray-800">
          <UserList 
            onUserSelect={setSelectedUser} 
            selectedUserId={selectedUser?.id} 
            currentUserId={profile.id} 
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="bg-gray-800 border-b border-green-800 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                      {selectedUser.avatar_url ? (
                        <img
                          src={selectedUser.avatar_url}
                          alt={selectedUser.username || "User"}
                          className="h-10 w-10 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-sm font-medium text-green-100">
                          {selectedUser.username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {selectedUser.is_online && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-green-100">
                      {selectedUser.full_name || selectedUser.username}
                    </h2>
                    <p className="text-sm text-green-300">
                      {selectedUser.is_online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <DirectMessageList 
                otherUser={selectedUser} 
                currentUserId={profile.id} 
              />
              
              {/* Input */}
              <DirectMessageInput 
                otherUserId={selectedUser.id} 
                currentUserId={profile.id} 
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-green-300">
              <div className="text-center">
                <div className="h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-green-500">💬</span>
                </div>
                <h3 className="text-lg font-medium text-green-100 mb-2">Bienvenido a Saytro</h3>
                <p className="text-sm">Selecciona un usuario para iniciar una conversación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}