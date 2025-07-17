"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile | null
}

export default function ProfileModal({ isOpen, onClose, profile }: ProfileModalProps) {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "")
      setUsername(profile.username || "")
      setAvatarUrl(profile.avatar_url || "")
    }
  }, [profile])

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
  
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debes seleccionar una imagen para subir.")
      }
  
      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const filePath = `avatars/${profile?.id}/avatar.${fileExt}` // nombre fijo por usuario
  
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true, // ✅ permite sobrescribir
        })
  
      if (uploadError) throw uploadError
  
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
  
      setAvatarUrl(data.publicUrl)
    } catch (error) {
      console.error("Error subiendo avatar:", error)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username: username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id)

      if (error) {
        throw error
      }

      onClose()
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-green-800">
        <DialogHeader>
          <DialogTitle className="text-green-400">Editar perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20 border-2 border-green-600">
              <AvatarImage src={avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="bg-green-800 text-green-300">
                {username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
  
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              className="hidden"
            />
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button 
                variant="outline" 
                disabled={uploading} 
                className="bg-gray-800 text-green-400 border-green-600 hover:bg-gray-700 hover:text-green-300"
              >
                <Upload className="h-4 w-4 mr-2 text-green-400" />
                {uploading
                  ? "Subiendo..."
                  : avatarUrl
                    ? "Editar Avatar"
                    : "Subir Avatar"}
              </Button>
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-green-300">Nombre Completo</Label>
            <Input 
              id="fullName" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className="bg-gray-800 border-green-700 text-green-300 focus:border-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-green-300">Nombre de usuario</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="bg-gray-800 border-green-700 text-green-300 focus:border-green-500"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-gray-800 text-green-400 border-green-600 hover:bg-gray-700 hover:text-green-300"
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveProfile} 
              disabled={saving}
              className="bg-green-700 text-white hover:bg-green-600"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
