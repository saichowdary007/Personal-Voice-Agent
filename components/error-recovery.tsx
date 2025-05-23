"use client"

import { motion } from "framer-motion"
import { AlertTriangle, RotateCcw, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ErrorRecoveryProps {
  error: string
  onRetry: () => void
  onDismiss: () => void
}

export function ErrorRecovery({ error, onRetry, onDismiss }: ErrorRecoveryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="p-4 w-full border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />

          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Something went wrong</h4>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 flex items-center justify-center"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Try Again
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 px-2 text-xs text-red-600 hover:bg-red-100 dark:text-red-400 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
