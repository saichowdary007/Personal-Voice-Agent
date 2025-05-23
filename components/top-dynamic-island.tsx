"use client"

import { motion } from "framer-motion"
import { Mic, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-mobile"

interface TopDynamicIslandProps {
  mode: "voice" | "chat"
  onSwitchToVoice: () => void
  onSwitchToChat: () => void
}

export function TopDynamicIsland({ mode, onSwitchToVoice, onSwitchToChat }: TopDynamicIslandProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <motion.div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className="bg-background/90 backdrop-blur-lg border border-border rounded-full shadow-lg px-4 py-2.5 flex justify-center"
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-center gap-3">
          {!isMobile ? (
            <>
              <Button
                variant={mode === "voice" ? "default" : "ghost"}
                size="sm"
                onClick={onSwitchToVoice}
                className="rounded-full h-9 px-4 gap-2 text-xs font-medium"
              >
                <Mic className="h-3.5 w-3.5" />
                Voice
              </Button>
              <Button
                variant={mode === "chat" ? "default" : "ghost"}
                size="sm"
                onClick={onSwitchToChat}
                className="rounded-full h-9 px-4 gap-2 text-xs font-medium"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={mode === "voice" ? onSwitchToChat : onSwitchToVoice}
              className="rounded-full h-9 w-9 p-0 flex items-center justify-center"
            >
              {mode === "voice" ? <MessageSquare className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
