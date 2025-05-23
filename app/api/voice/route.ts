import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { NextRequest } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages, transcript } = await req.json()

    // If transcript is provided, add it as the latest user message
    const allMessages = transcript ? [...messages, { role: "user", content: transcript }] : messages

    const result = streamText({
      model: openai(process.env.NEXT_PUBLIC_MODEL_PROVIDER || "gpt-4o"),
      system: `You are a helpful voice assistant. Keep responses concise and conversational.
               Respond naturally as if speaking to someone, avoiding overly formal language.
               If asked about capabilities, mention you can help with questions, tasks, and conversations.`,
      messages: allMessages,
      temperature: 0.7,
      maxTokens: 500, // Keep responses reasonably short for voice
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Voice API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
