"use client"

import { motion } from "framer-motion"
import { X, Mic, MessageSquare, Keyboard } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-mobile"

interface OnboardingHintsProps {
  onDismiss: () => void
}

export function OnboardingHints({ onDismiss }: OnboardingHintsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)")

  const hints = [
    {
      icon: <Mic className="h-4 w-4" />,
      text: isMobile ? "Tap the mic to start talking" : "Press 'V' or click the mic to start",
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      text: "Switch to chat mode to see conversation history",
    },
    {
      icon: <Keyboard className="h-4 w-4" />,
      text: isMobile ? "Use the mute button for privacy" : "Press 'M' to mute, 'Esc' to stop",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8 w-full max-w-md mx-auto"
    >
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-medium text-primary">Quick Start</h3>
          <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0 flex items-center justify-center">
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-3">
          {hints.map((hint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 text-xs text-muted-foreground"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                {hint.icon}
              </div>
              <span>{hint.text}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
