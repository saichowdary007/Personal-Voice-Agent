"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Mic, Shield } from "lucide-react"

interface PrivacyIndicatorProps {
  isListening: boolean
  isMuted: boolean
}

export function PrivacyIndicator({ isListening, isMuted }: PrivacyIndicatorProps) {
  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 safe-area-inset-top"
        >
          <div className="bg-green-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center justify-center gap-2">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              className="flex items-center justify-center"
            >
              <Mic className="h-4 w-4" />
            </motion.div>
            <span className="text-xs font-medium">Listening</span>
          </div>
        </motion.div>
      )}

      {isMuted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 safe-area-inset-top"
        >
          <div className="bg-red-500 text-white px-3 py-2 rounded-full shadow-lg flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium">Microphone Off</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
