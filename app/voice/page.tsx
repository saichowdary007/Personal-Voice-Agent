"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Keyboard, Volume2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoiceVisualizer } from "@/components/voice-visualizer"
import { TopDynamicIsland } from "@/components/top-dynamic-island"
import { VoiceDynamicIsland } from "@/components/voice-dynamic-island"
import { ChatHistory } from "@/components/chat-history"
import { OnboardingHints } from "@/components/onboarding-hints"
import { ErrorRecovery } from "@/components/error-recovery"
import { PrivacyIndicator } from "@/components/privacy-indicator"
import { useMediaQuery } from "@/hooks/use-mobile"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    speechSynthesis: any
    SpeechSynthesisUtterance: any
  }
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string
        confidence: number
      }
      isFinal: boolean
      length: number
    }
    length: number
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  confidence?: number
  needsConfirmation?: boolean
}

type Mode = "voice" | "chat"
type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error"

export default function VoicePage() {
  const [mode, setMode] = useState<Mode>("voice")
  const [voiceState, setVoiceState] = useState<VoiceState>("idle")
  const [isMuted, setIsMuted] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [currentResponse, setCurrentResponse] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isFirstSession, setIsFirstSession] = useState(true)
  const [pendingConfirmation, setPendingConfirmation] = useState<Message | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  // Initialize Speech Recognition with enhanced error handling
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setLastError("Speech recognition not supported in this browser")
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"
      recognition.maxAlternatives = 3

      recognition.onstart = () => {
        setVoiceState("listening")
        setLastError(null)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ""
        let interim = ""
        let confidence = 0

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          confidence = event.results[i][0].confidence || 0

          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interim += transcript
          }
        }

        setInterimTranscript(interim)

        if (finalTranscript) {
          setCurrentTranscript(finalTranscript)
          // Low confidence detection for error recovery
          if (confidence < 0.7) {
            setPendingConfirmation({
              id: Date.now().toString(),
              role: "user",
              content: finalTranscript,
              timestamp: new Date(),
              confidence,
              needsConfirmation: true,
            })
          } else {
            handleVoiceInput(finalTranscript, confidence)
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error)
        setVoiceState("error")
        setLastError(getErrorMessage(event.error))
      }

      recognition.onend = () => {
        if (voiceState === "listening") {
          setVoiceState("idle")
        }
      }

      recognitionRef.current = recognition
    }
  }, [voiceState])

  // Initialize audio analysis for real-time feedback
  useEffect(() => {
    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let stream: MediaStream | null = null

    const setupAudioAnalysis = async () => {
      if (voiceState === "listening" && !audioContextRef.current) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          micStreamRef.current = stream

          audioContext = new AudioContext()
          analyser = audioContext.createAnalyser()
          const microphone = audioContext.createMediaStreamSource(stream)

          analyser.fftSize = 256
          microphone.connect(analyser)

          audioContextRef.current = audioContext
          analyserRef.current = analyser

          // Real-time audio level monitoring
          const updateAudioLevel = () => {
            if (analyserRef.current && voiceState === "listening") {
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
              analyserRef.current.getByteFrequencyData(dataArray)
              const average = dataArray.reduce((a, b) => a + b) / dataArray.length
              setAudioLevel(average / 255)
              requestAnimationFrame(updateAudioLevel)
            }
          }
          updateAudioLevel()
        } catch (error) {
          setLastError("Microphone access denied")
          setVoiceState("error")
        }
      }
    }

    setupAudioAnalysis()

    return () => {
      // Clean up media stream first
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
        micStreamRef.current = null
      }

      // Then check AudioContext state before closing
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close()
        } catch (e) {
          console.warn("Error closing AudioContext:", e)
        }
        audioContextRef.current = null
        analyserRef.current = null
      }
    }
  }, [voiceState])

  // Keyboard shortcuts with accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "v" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        setMode("voice")
        startListening()
      } else if (event.key === "Escape") {
        event.preventDefault()
        stopListening()
      } else if (event.key === "m" && event.ctrlKey) {
        event.preventDefault()
        toggleMute()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Hide onboarding after first interaction
  useEffect(() => {
    if (messages.length > 0 && showOnboarding) {
      setTimeout(() => setShowOnboarding(false), 3000)
    }
  }, [messages.length, showOnboarding])

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case "no-speech":
        return "No speech detected. Please try speaking closer to the microphone."
      case "audio-capture":
        return "Microphone access is required. Please check your permissions."
      case "not-allowed":
        return "Microphone permission denied. Please enable microphone access."
      case "network":
        return "Network error. Please check your connection and try again."
      default:
        return "Speech recognition error. Please try again."
    }
  }

  const startListening = useCallback(() => {
    if (recognitionRef.current && voiceState === "idle" && !isMuted) {
      setCurrentTranscript("")
      setInterimTranscript("")
      setCurrentResponse("")
      setLastError(null)
      setPendingConfirmation(null)

      // Reset AudioContext if it was previously closed
      if (audioContextRef.current && audioContextRef.current.state === "closed") {
        audioContextRef.current = null
        analyserRef.current = null
      }

      try {
        recognitionRef.current.start()
      } catch (e) {
        // Handle the case where recognition is already started
        console.warn("Recognition failed to start:", e)
        setLastError("Failed to start listening. Please try again.")
      }
    }
  }, [voiceState, isMuted])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && voiceState === "listening") {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Handle the case where recognition is already stopped
        console.warn("Recognition failed to stop:", e)
      }
      setVoiceState("idle")
    }
  }, [voiceState])

  const toggleMute = useCallback(() => {
    if (voiceState === "listening") {
      stopListening()
    }
    setIsMuted(!isMuted)

    // Haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [isMuted, voiceState, stopListening, isMobile])

  const confirmInput = useCallback(
    (confirmed: boolean) => {
      if (pendingConfirmation) {
        if (confirmed) {
          handleVoiceInput(pendingConfirmation.content, pendingConfirmation.confidence || 0)
        }
        setPendingConfirmation(null)
      }
    },
    [pendingConfirmation],
  )

  const handleVoiceInput = async (userInput: string, confidence = 1) => {
    if (!userInput.trim()) return

    setVoiceState("processing")
    stopListening()

    // Immediate acknowledgment for better UX
    if (!prefersReducedMotion) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 1500)
    }

    // Add user message to history
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
      confidence,
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      // Stream AI response with immediate feedback
      const result = await streamText({
        model: openai(process.env.NEXT_PUBLIC_MODEL_PROVIDER || "gpt-4o"),
        messages: [
          {
            role: "system",
            content: `You are a helpful voice assistant with a warm, conversational tone. 
                     Keep responses concise but informative. When providing lists or detailed information,
                     structure it clearly for both voice and visual consumption. 
                     If you're unsure about something, ask for clarification.
                     Match the user's energy level and be encouraging.`,
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userInput },
        ],
        temperature: 0.7,
        maxTokens: 300,
      })

      let fullResponse = ""
      let firstChunk = true

      for await (const delta of result.textStream) {
        fullResponse += delta
        setCurrentResponse(fullResponse)

        // Start TTS for first chunk to reduce perceived latency
        if (firstChunk && delta.length > 10) {
          firstChunk = false
          setVoiceState("speaking")
        }
      }

      // Add assistant message to history
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Text-to-speech for accessibility and multimodal experience
      if (window.speechSynthesis && !isMuted) {
        const utterance = new SpeechSynthesisUtterance(fullResponse)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.onend = () => setVoiceState("idle")
        window.speechSynthesis.speak(utterance)
      } else {
        setVoiceState("idle")
      }

      setCurrentResponse("")
      setCurrentTranscript("")
      setIsFirstSession(false)
    } catch (error) {
      console.error("Error processing voice input:", error)
      setVoiceState("error")
      setLastError("Failed to process your request. Please try again.")
    }
  }

  const switchToChat = () => {
    setMode("chat")
    stopListening()
    setVoiceState("idle")

    // Clean up audio resources when switching to chat
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }

    // Don't close AudioContext here, just disconnect any nodes
    if (audioContextRef.current && analyserRef.current) {
      try {
        // Just disconnect instead of closing
        analyserRef.current.disconnect()
      } catch (e) {
        console.warn("Error disconnecting audio nodes:", e)
      }
    }
  }

  const switchToVoice = () => {
    setMode("voice")
  }

  const retryLastInput = () => {
    if (currentTranscript) {
      handleVoiceInput(currentTranscript)
    } else {
      startListening()
    }
    setLastError(null)
  }

  // Final cleanup on component unmount
  useEffect(() => {
    return () => {
      // Stop any ongoing speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }

      // Stop any ongoing speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping recognition
        }
      }

      // Clean up media stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
        micStreamRef.current = null
      }

      // Close AudioContext if it exists and isn't already closed
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close()
        } catch (e) {
          console.warn("AudioContext cleanup error:", e)
        }
        audioContextRef.current = null
      }
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative">
      {/* Privacy Indicator */}
      <PrivacyIndicator isListening={voiceState === "listening"} isMuted={isMuted} />

      {/* Top Dynamic Island */}
      <TopDynamicIsland mode={mode} onSwitchToVoice={switchToVoice} onSwitchToChat={switchToChat} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 py-16 pb-24 safe-area-inset-top safe-area-inset-bottom">
        <AnimatePresence mode="wait">
          {mode === "voice" ? (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl mx-auto space-y-8"
            >
              {/* Onboarding Hints */}
              {showOnboarding && isFirstSession && <OnboardingHints onDismiss={() => setShowOnboarding(false)} />}

              {/* Voice Visualizer */}
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
                <VoiceVisualizer
                  isListening={voiceState === "listening"}
                  isProcessing={voiceState === "processing"}
                  isSpeaking={voiceState === "speaking"}
                  audioLevel={audioLevel}
                  error={voiceState === "error"}
                />

                {/* Enhanced Status Display */}
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${
                        voiceState === "error"
                          ? "bg-red-500"
                          : voiceState === "listening"
                            ? "bg-green-500"
                            : voiceState === "processing"
                              ? "bg-yellow-500"
                              : voiceState === "speaking"
                                ? "bg-blue-500"
                                : "bg-gray-400"
                      }`}
                      animate={{
                        scale: voiceState === "listening" ? [1, 1.2, 1] : 1,
                        opacity: voiceState === "listening" ? [0.7, 1, 0.7] : 1,
                      }}
                      transition={{
                        duration: 1,
                        repeat: voiceState === "listening" ? Number.POSITIVE_INFINITY : 0,
                      }}
                    />
                    <Badge variant="outline" className="text-xs">
                      {voiceState === "listening" && "Listening"}
                      {voiceState === "processing" && "Thinking..."}
                      {voiceState === "speaking" && "Speaking"}
                      {voiceState === "error" && "Error"}
                      {voiceState === "idle" && (isMuted ? "Muted" : "Ready")}
                    </Badge>
                  </div>

                  {voiceState === "idle" && !isMuted && (
                    <p className="text-sm text-muted-foreground">
                      {isMobile ? "Tap the mic to start" : "Press V to start, M to mute, or click the mic"}
                    </p>
                  )}
                </div>

                {/* Live Transcript with Confidence Indicator */}
                {(currentTranscript || interimTranscript) && (
                  <Card className="p-4 w-full max-w-md mx-auto">
                    <div className="space-y-2">
                      {currentTranscript && <p className="text-sm font-medium">{currentTranscript}</p>}
                      {interimTranscript && <p className="text-sm text-muted-foreground italic">{interimTranscript}</p>}
                    </div>
                  </Card>
                )}

                {/* Streaming Response with Visual Hierarchy */}
                {currentResponse && (
                  <Card className="p-4 w-full max-w-lg mx-auto">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-muted-foreground">Assistant</span>
                      </div>
                      <p className="text-sm leading-relaxed">{currentResponse}</p>
                    </div>
                  </Card>
                )}

                {/* Error Recovery */}
                {lastError && (
                  <ErrorRecovery error={lastError} onRetry={retryLastInput} onDismiss={() => setLastError(null)} />
                )}

                {/* Confirmation Dialog */}
                {pendingConfirmation && (
                  <Card className="p-4 w-full max-w-md mx-auto border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                    <div className="space-y-3">
                      <p className="text-sm">Did you say:</p>
                      <p className="text-sm font-medium">"{pendingConfirmation.content}"</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmInput(true)}
                          className="px-3 py-1 text-xs bg-green-500 text-white rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => confirmInput(false)}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded"
                        >
                          No, try again
                        </button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl"
            >
              <ChatHistory messages={messages} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Voice Dynamic Island */}
      <VoiceDynamicIsland
        voiceState={voiceState}
        isMuted={isMuted}
        onToggleMic={voiceState === "listening" ? stopListening : startListening}
        onToggleMute={toggleMute}
        audioLevel={audioLevel}
      />

      {/* Success Micro-interactions */}
      <AnimatePresence>
        {showConfetti && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full"
                initial={{
                  x: "50vw",
                  y: "50vh",
                  scale: 0,
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: [0, 1, 0],
                  rotate: 360,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help */}
      {!isMobile && (
        <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm border rounded-lg p-2">
          <div className="flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            <span>V: Voice • M: Mute • Esc: Stop</span>
          </div>
        </div>
      )}
    </div>
  )
}
