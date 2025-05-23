"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"

interface VoiceVisualizerProps {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  audioLevel: number
  error: boolean
}

export function VoiceVisualizer({ isListening, isProcessing, isSpeaking, audioLevel, error }: VoiceVisualizerProps) {
  const [pulseIntensity, setPulseIntensity] = useState(0)

  useEffect(() => {
    if (isListening && audioLevel > 0) {
      setPulseIntensity(audioLevel)
    } else {
      setPulseIntensity(0)
    }
  }, [isListening, audioLevel])

  const baseScale = 1 + pulseIntensity * 0.3
  const processingScale = isProcessing ? 1.1 : 1
  const speakingScale = isSpeaking ? 1.05 : 1

  if (error) {
    return (
      <div className="relative flex items-center justify-center w-64 h-64 mx-auto">
        <motion.div
          className="absolute inset-8 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center w-64 h-64 mx-auto">
      {/* Outer ring - Listening state */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        animate={{
          scale: isListening ? [1, 1.2, 1] : 1,
          opacity: isListening ? [0.3, 0.6, 0.3] : 0.3,
        }}
        transition={{
          duration: 2,
          repeat: isListening ? Number.POSITIVE_INFINITY : 0,
          ease: "easeInOut",
        }}
      />

      {/* Middle ring - Processing state */}
      <motion.div
        className="absolute inset-4 rounded-full border border-primary/40"
        animate={{
          scale: isProcessing ? [1, 1.15, 1] : isListening ? [1, 1.1, 1] : 1,
          opacity: isProcessing ? [0.5, 0.8, 0.5] : isListening ? [0.4, 0.7, 0.4] : 0.4,
        }}
        transition={{
          duration: isProcessing ? 1 : 1.5,
          repeat: isProcessing || isListening ? Number.POSITIVE_INFINITY : 0,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* Inner circle - Main state indicator */}
      <motion.div
        className={`absolute inset-8 rounded-full flex items-center justify-center ${
          error
            ? "bg-red-500/80"
            : isSpeaking
              ? "bg-blue-500/80"
              : isProcessing
                ? "bg-yellow-500/80"
                : isListening
                  ? "bg-green-500/80"
                  : "bg-primary/80"
        }`}
        animate={{
          scale: baseScale * processingScale * speakingScale,
        }}
        transition={{
          duration: 0.1,
          ease: "easeOut",
        }}
      >
        {/* Dynamic icon based on state */}
        <motion.div
          className="text-primary-foreground flex items-center justify-center"
          animate={{
            rotate: isProcessing ? 360 : 0,
            scale: isSpeaking ? [1, 1.1, 1] : 1,
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: isProcessing ? Number.POSITIVE_INFINITY : 0,
              ease: "linear",
            },
            scale: {
              duration: 0.5,
              repeat: isSpeaking ? Number.POSITIVE_INFINITY : 0,
            },
          }}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isSpeaking ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
          )}
        </motion.div>
      </motion.div>

      {/* Audio level visualization - Orbiting dots */}
      {isListening && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              style={{
                top: "50%",
                left: "50%",
                marginTop: "-4px",
                marginLeft: "-4px",
              }}
              animate={{
                x: Math.cos((i * Math.PI * 2) / 8) * (80 + pulseIntensity * 30),
                y: Math.sin((i * Math.PI * 2) / 8) * (80 + pulseIntensity * 30),
                scale: [0.8, 1.2 + pulseIntensity * 0.5, 0.8],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </>
      )}

      {/* Speaking wave effect */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-500"
          animate={{
            scale: [1, 1.3],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
      )}
    </div>
  )
}
