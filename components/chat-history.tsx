"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageSquare } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatHistoryProps {
  messages: Message[]
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    // This would integrate with the same voice processing logic
    setNewMessage("")
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Filter to only show assistant messages
  const assistantMessages = messages.filter((message) => message.role === "assistant")

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] w-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4 w-full">
        <div className="space-y-6 py-4 w-full">
          <AnimatePresence>
            {assistantMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2 w-full"
              >
                {/* Timestamp */}
                <div className="text-xs text-muted-foreground/60 text-center">{formatTime(message.timestamp)}</div>

                {/* Message Content - Transparent text without box */}
                <div className="text-sm leading-relaxed text-foreground/80 px-2">{message.content}</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {assistantMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center w-full">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <h3 className="text-base font-medium mb-2 text-muted-foreground">No conversations yet</h3>
              <p className="text-sm text-muted-foreground/60 max-w-sm">
                Switch to voice mode to start a conversation with the AI assistant.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input - Instagram style */}
      <div className="p-4 border-t bg-background/50 backdrop-blur-sm w-full">
        <div className="flex gap-3 items-end w-full">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="rounded-full border-muted bg-muted/30 px-4 py-2 text-sm resize-none min-h-[40px] max-h-[120px] w-full"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="rounded-full h-10 w-10 shrink-0 flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
