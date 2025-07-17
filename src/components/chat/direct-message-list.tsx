"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at?: string
}

interface DirectMessageListProps {
  otherUser: Profile
  currentUserId: string
}

export default function DirectMessageList({ otherUser, currentUserId }: DirectMessageListProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    const matrixChars = "01"
    const fontSize = 12 
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * -100)

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)' 
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = 'rgba(32, 194, 14, 0.3)' 
      ctx.font = `${fontSize}px monospace`
      
      for (let i = 0; i < drops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize
        
        ctx.fillText(char, x, y)
        
        if (y > canvas.height && Math.random() > 0.985) { 
          drops[i] = 0
        }
        
        drops[i] += 0.5 
      }
    }

    const interval = setInterval(drawMatrix, 80) 

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  useEffect(() => {
    if (otherUser && currentUserId) {
      initializeConversation()
    }
  }, [otherUser, currentUserId])

  useEffect(() => {
    if (conversationId) {
      fetchMessages()
      const unsubscribe = subscribeToMessages()
      return unsubscribe
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeConversation = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        user1_uuid: currentUserId,
        user2_uuid: otherUser.id,
      })

      if (error) {
        console.error("Error getting/creating conversation:", error)
        return
      }

      setConversationId(data)
    } catch (error) {
      console.error("Error in initializeConversation:", error)
    }
  }

  const fetchMessages = async () => {
    if (!conversationId) return

    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching messages:", error)
      } else {
        setMessages(data || [])
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    if (!conversationId) return () => {}
  
    const audio = new Audio("/notification.mp3") // Ruta al sonido
  
    const channel = supabase
      .channel(`direct_messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage
  
          // Solo reproducir si el mensaje NO es del usuario actual
          if (newMessage.sender_id !== currentUserId) {
            audio.play().catch((err) => console.error("Error playing sound:", err))
          }
  
          setMessages((prev) => [...prev, newMessage])
        },
      )
      .subscribe()
  
    return () => {
      supabase.removeChannel(channel)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-green-400">
        Cargando mensajes...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto relative bg-gray-900">
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none z-0"
      />
      
      <div className="relative z-10 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-green-400 flex-col">
            <Avatar className="h-16 w-16 mb-4 border border-green-500">
              <AvatarImage src={otherUser.avatar_url || ""} />
              <AvatarFallback className="text-2xl bg-gray-800 text-green-400">
                {otherUser.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-lg font-medium font-mono">{otherUser.full_name || otherUser.username}</p>
            <p className="text-sm text-green-500">Iniciar una conversación!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId
            return (
              <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md`}>
                  {!isOwnMessage && (
                    <Avatar className="h-6 w-6 border border-green-500">
                      <AvatarImage src={otherUser.avatar_url || ""} />
                      <AvatarFallback className="text-xs bg-gray-800 text-green-400">
                        {otherUser.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? "bg-green-700 text-green-100 rounded-br-none border border-green-600"
                        : "bg-gray-800 text-green-300 rounded-bl-none border border-gray-700"
                    }`}
                  >
                    <div className="text-sm font-mono">{message.content}</div>
                    <div className={`text-xs mt-1 ${isOwnMessage ? "text-green-300" : "text-gray-400"}`}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
