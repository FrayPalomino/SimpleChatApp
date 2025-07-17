"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface DirectMessageInputProps {
  otherUserId: string
  currentUserId: string
}

export default function DirectMessageInput({ otherUserId, currentUserId }: DirectMessageInputProps) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)

    try {
      const { data: conversationId, error: convError } = await supabase.rpc("get_or_create_conversation", {
        user1_uuid: currentUserId,
        user2_uuid: otherUserId,
      })

      if (convError) {
        console.error("Error getting conversation:", convError)
        return
      }

      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: message.trim(),
      })

      if (error) {
        console.error("Error sending message:", error)
      } else {
        setMessage("")
      }
    } catch (error) {
      console.error("Error in sendMessage:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={sendMessage} className="flex space-x-2 p-4 border-t border-gray-700 bg-gray-900">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribir mensaje..."
        disabled={sending}
        className="flex-1 bg-gray-800 border-gray-700 text-green-400 placeholder-gray-500 focus:border-green-500 focus:ring-green-500 font-mono"
      />
      <Button 
        type="submit" 
        disabled={sending || !message.trim()}
        className="bg-green-700 hover:bg-green-600 text-white border border-green-600"
      >
        {sending ? (
          <div className="animate-pulse">
            <Send className="h-4 w-4" />
          </div>
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
