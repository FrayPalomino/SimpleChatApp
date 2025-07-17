"use client"

import type React from "react"

import { useState } from "react"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import ProfileModal from "@/components/profile/profile-modal"

interface HeaderProps {
  profile: Profile | null
  onLogout?: () => void
}

export default function Header({ profile, onLogout }: HeaderProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (isLoggingOut) return

    try {
      setIsLoggingOut(true)
      console.log("Header: Starting logout process...")

      if (onLogout) {
        await onLogout()
      } else {
        console.warn("No onLogout function provided, using fallback")
        const { createClient } = await import("@/lib/supabase/client")
        const { useRouter } = await import("next/navigation")
        
        const supabase = createClient()
        const router = useRouter()

        if (profile) {
          console.log("Updating online status to false for user:", profile.id)
          try {
            await supabase.rpc("update_user_online_status", {
              user_id: profile.id,
              is_online: false,
            })
          } catch (statusError) {
            console.warn("Failed to update online status:", statusError)
          }
        }

        console.log("Signing out from Supabase...")
        const { error } = await supabase.auth.signOut()

        if (error) {
          console.error("Error signing out:", error)
          throw error
        }

        console.log("Successfully signed out")
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Header logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowProfileModal(true)
  }

  return (
    <>
      <header className="bg-gray-900 border-b border-green-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-green-400">Saytro</h1>

          <div className="flex items-center space-x-4">
            {profile && <div className="text-sm text-green-300">Bienvenido, {profile.full_name || profile.username}</div>}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-gray-800">
                  <Avatar className="h-8 w-8 border border-green-600">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-gray-700 text-green-400">
                      {profile?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border border-green-700" align="end" forceMount>
                <DropdownMenuItem 
                  onClick={handleProfileClick}
                  className="text-green-300 hover:bg-gray-700 focus:bg-gray-700"
                >
                  <User className="mr-2 h-4 w-4 text-green-400" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-green-300 hover:bg-gray-700 focus:bg-gray-700">
                  <Settings className="mr-2 h-4 w-4 text-green-400" />
                  <span>Configuracion</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  disabled={isLoggingOut}
                  className="text-green-300 hover:bg-gray-700 focus:bg-gray-700"
                >
                  <LogOut className="mr-2 h-4 w-4 text-green-400" />
                  <span>{isLoggingOut ? "Cerrando Sesion..." : "Cerrar Sesion"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut} 
              disabled={isLoggingOut}
              className="border-green-600 text-green-300 hover:bg-gray-800 hover:text-green-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Cerrando Sesion..." : "Cerrar Sesion"}
            </Button>
          </div>  
        </div>
      </header>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} profile={profile} />
    </>
  )
}
