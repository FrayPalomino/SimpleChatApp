"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface UserListProps {
  onUserSelect: (user: Profile) => void
  selectedUserId?: string
  currentUserId: string
}

interface ConversationInfo {
  user: Profile
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

export default function UserList({ onUserSelect, selectedUserId, currentUserId }: UserListProps) {
  const [conversations, setConversations] = useState<ConversationInfo[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showAllUsers, setShowAllUsers] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchConversationsAndUsers()
    const interval = setInterval(fetchConversationsAndUsers, 10000)
    return () => clearInterval(interval)
  }, [currentUserId])

  const fetchConversationsAndUsers = async () => {
    try {
      const { data: conversationsData, error: convError } = await supabase
        .from("conversations")
        .select(`
          id,
          user1_id,
          user2_id,
          last_message_at,
          direct_messages (
            content,
            created_at,
            sender_id
          )
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order("last_message_at", { ascending: false })

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .order("username")

      if (usersError) {
        console.error("Error fetching users:", usersError)
        return
      }

      setAllUsers(usersData || [])

      if (convError) {
        console.error("Error fetching conversations:", convError)
        setLoading(false)
        return
      }

      const conversationInfos: ConversationInfo[] = []
      const usersWithConversations = new Set<string>()

      for (const conv of conversationsData || []) {
        const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id
        const otherUser = usersData?.find((u) => u.id === otherUserId)
      
        if (otherUser) {
          usersWithConversations.add(otherUserId)
      
          // Obtener último mensaje
          const lastMessage = conv.direct_messages?.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )?.[0]
      
          // Obtener cantidad de mensajes no leídos (de ese usuario hacia mí)
          const { data: unreadMessages, error: unreadError } = await supabase
            .from("direct_messages")
            .select("id", { count: "exact", head: true }) // solo cuenta
            .eq("conversation_id", conv.id)
            .eq("sender_id", otherUserId)
            .is("read_at", null)
      
          if (unreadError) {
            console.error("Error fetching unread count:", unreadError)
          }
      
          conversationInfos.push({
            user: otherUser,
            lastMessage: lastMessage
              ? (lastMessage.sender_id === currentUserId ? `Tú: ${lastMessage.content}` : lastMessage.content)
              : "No messages yet",
            lastMessageTime: lastMessage?.created_at,
            unreadCount: unreadMessages?.length || 0,
          })
        }
      }

      setConversations(conversationInfos)
      setLoading(false)
    } catch (error) {
      console.error("Error in fetchConversationsAndUsers:", error)
      setLoading(false)
    }
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  const filteredUsers = allUsers.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <Card className="h-full bg-gray-900 border-green-800">
        <CardContent className="p-4">
          <div className="text-center text-green-400">Cargando chats...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-gray-900 border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-green-400">
          Chats
          <Badge variant="secondary" className="bg-gray-700 text-green-300">{conversations.length}</Badge>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-green-700 text-green-300 placeholder-green-600"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAllUsers(false)}
            className={`px-3 py-1 text-sm rounded ${
              !showAllUsers ? "bg-green-700 text-white" : "bg-gray-800 text-green-300"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setShowAllUsers(true)}
            className={`px-3 py-1 text-sm rounded ${
              showAllUsers ? "bg-green-700 text-white" : "bg-gray-800 text-green-300"
            }`}
          >
            Todos los usuarios
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {showAllUsers
            ? filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onUserSelect(user)}
                  className={`w-full text-left p-3 hover:bg-gray-800 transition-colors ${
                    selectedUserId === user.id ? "bg-green-900 border-r-2 border-green-500" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-green-600">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-green-800 text-green-300">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.is_online && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-green-300">{user.full_name || user.username}</div>
                      <div className="text-sm text-gray-400 truncate">
                        {user.is_online ? (
                          <span className="text-green-400">Online</span>
                        ) : (
                          <span className="text-gray-500">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            : filteredConversations.map((conv) => (
                <button
                  key={conv.user.id}
                  onClick={() => onUserSelect(conv.user)}
                  className={`w-full text-left p-3 hover:bg-gray-800 transition-colors ${
                    selectedUserId === conv.user.id ? "bg-green-900 border-r-2 border-green-500" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-green-600">
                        <AvatarImage src={conv.user.avatar_url || ""} />
                        <AvatarFallback className="bg-green-800 text-green-300">
                          {conv.user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conv.user.is_online && (
                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate text-green-300">
                          {conv.user.full_name || conv.user.username}
                        </div>
                        <div className="text-xs text-gray-400">{formatTime(conv.lastMessageTime)}</div>
                      </div>
                      <div className="text-sm text-gray-400 truncate">{conv.lastMessage}</div>
                    </div>
                    {conv.unreadCount && conv.unreadCount > 0 && (
                      <Badge variant="default" className="bg-green-600 text-white">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}

          {((showAllUsers && filteredUsers.length === 0) || (!showAllUsers && filteredConversations.length === 0)) && (
            <div className="p-4 text-center text-gray-400">
              {searchTerm ? "No users found" : showAllUsers ? "No users available" : "No conversations yet"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
