"use client"

import { motion } from "framer-motion"
import { Mic, VolumeX, Volume2, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceDynamicIslandProps {
  voiceState: "idle" | "listening" | "processing" | "speaking" | "error"
  isMuted: boolean
  onToggleMic: () => void
  onToggleMute: () => void
  audioLevel: number
}

export function VoiceDynamicIsland({
  voiceState,
  isMuted,
  onToggleMic,
  onToggleMute,
  audioLevel,
}: VoiceDynamicIslandProps) {
  const isActive = voiceState === "listening" || voiceState === "processing" || voiceState === "speaking"

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-auto safe-area-inset-bottom"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className="bg-background/95 backdrop-blur-lg border border-border rounded-full shadow-lg px-6 py-4 flex justify-center"
        layout
        animate={{
          scale: isActive ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-center gap-4">
          {/* Main Mic Button */}
          <Button
            variant={voiceState === "listening" ? "default" : "outline"}
            size="sm"
            onClick={onToggleMic}
            disabled={isMuted || voiceState === "processing"}
            className="rounded-full h-14 w-14 p-0 relative overflow-hidden flex items-center justify-center"
          >
            {/* Audio level visualization */}
            {voiceState === "listening" && (
              <motion.div
                className="absolute inset-0 bg-green-500/20 rounded-full"
                animate={{
                  scale: 1 + audioLevel * 0.5,
                  opacity: 0.3 + audioLevel * 0.4,
                }}
                transition={{ duration: 0.1 }}
              />
            )}

            <motion.div
              animate={{
                scale: voiceState === "listening" ? [1, 1.1, 1] : 1,
                rotate: voiceState === "processing" ? 360 : 0,
              }}
              transition={{
                scale: {
                  duration: 0.5,
                  repeat: voiceState === "listening" ? Number.POSITIVE_INFINITY : 0,
                },
                rotate: {
                  duration: 2,
                  repeat: voiceState === "processing" ? Number.POSITIVE_INFINITY : 0,
                  ease: "linear",
                },
              }}
              className="flex items-center justify-center"
            >
              {voiceState === "listening" ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </motion.div>
          </Button>

          {/* Mute Toggle */}
          <Button
            variant={isMuted ? "destructive" : "ghost"}
            size="sm"
            onClick={onToggleMute}
            className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {/* Enhanced Status Display */}
          <div className="flex items-center gap-3">
            <motion.div
              className={`w-3 h-3 rounded-full ${
                voiceState === "error"
                  ? "bg-red-500"
                  : voiceState === "listening"
                    ? "bg-green-500"
                    : voiceState === "processing"
                      ? "bg-yellow-500"
                      : voiceState === "speaking"
                        ? "bg-blue-500"
                        : isMuted
                          ? "bg-red-400"
                          : "bg-gray-400"
              }`}
              animate={{
                scale: isActive ? [1, 1.3, 1] : 1,
                opacity: isActive ? [0.7, 1, 0.7] : 1,
              }}
              transition={{
                duration: 1,
                repeat: isActive ? Number.POSITIVE_INFINITY : 0,
              }}
            />

            <div className="text-xs space-y-1">
              <div className="font-medium">
                {voiceState === "error" && "Error"}
                {voiceState === "listening" && "Listening"}
                {voiceState === "processing" && "Thinking"}
                {voiceState === "speaking" && "Speaking"}
                {voiceState === "idle" && (isMuted ? "Muted" : "Ready")}
              </div>

              {/* Audio level indicator */}
              {voiceState === "listening" && (
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-2 bg-green-500 rounded-full"
                      animate={{
                        scaleY: audioLevel > i * 0.2 ? 1 : 0.3,
                        opacity: audioLevel > i * 0.2 ? 1 : 0.3,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
