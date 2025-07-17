"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface OnlineUsersProps {
  roomId?: string
}

export default function OnlineUsers({ roomId }: OnlineUsersProps) {
  const [roomMembers, setRoomMembers] = useState<Profile[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Profile[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (roomId) {
      fetchRoomMembers()
      const interval = setInterval(fetchRoomMembers, 30000)
      return () => clearInterval(interval)
    }
  }, [roomId])

  const fetchRoomMembers = async () => {
    if (!roomId) return

    try {
      const { data, error } = await supabase
        .from("room_members")
        .select(`
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            is_online,
            last_seen
          )
        `)
        .eq("room_id", roomId)

      if (error) {
        console.error("Error fetching room members:", error)
      } else {
        const members = data?.map((item: any) => item.profiles).filter(Boolean) || []
        setRoomMembers(members)
        setOnlineUsers(members.filter((user: Profile) => user.is_online))
        console.log("Room members:", members)
        console.log(
          "Online users:",
          members.filter((user: Profile) => user.is_online),
        )
      }
    } catch (err) {
      console.error("Error in fetchRoomMembers:", err)
    }
  }

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <Card className="h-full bg-gray-900 border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-green-400">
          Room Members
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-gray-700 text-green-300">{roomMembers.length} total</Badge>
            <Badge variant="default" className="bg-green-600 text-white">
              {onlineUsers.length} online
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {roomMembers.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">No members in this room</div>
        ) : (
          roomMembers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3 hover:bg-gray-800 p-2 rounded">
              <div className="relative">
                <Avatar className="h-8 w-8 border border-green-600">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="bg-green-800 text-green-300">
                    {user.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.is_online ? (
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-gray-600 rounded-full border-2 border-gray-900"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-green-300">{user.full_name || user.username}</div>
                <div className="text-xs text-gray-400 truncate">
                  {user.is_online ? (
                    <span className="text-green-400">Online</span>
                  ) : (
                    `Last seen ${formatLastSeen(user.last_seen)}`
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
