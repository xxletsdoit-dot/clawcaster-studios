import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/generate/voice - Generate voice audio using TTS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice = 'alloy', speed = 1.0 } = body

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    // Initialize Z-AI SDK
    const zai = await ZAI.create()

    // Generate speech
    const result = await zai.audio.speech.create({
      model: 'tts-1',
      input: text,
      voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
      speed: speed
    })

    // Convert to base64
    const buffer = Buffer.from(await result.arrayBuffer())
    const base64Audio = buffer.toString('base64')
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`

    return NextResponse.json({
      success: true,
      audio: {
        url: audioUrl,
        format: 'mp3',
        voice,
        textLength: text.length
      }
    })
  } catch (error) {
    console.error('Error generating voice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate voice' },
      { status: 500 }
    )
  }
}

// GET /api/generate/voice - Get available voices
export async function GET() {
  return NextResponse.json({
    success: true,
    voices: [
      { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
      { id: 'echo', name: 'Echo', description: 'Warm, conversational voice' },
      { id: 'fable', name: 'Fable', description: 'Expressive, storytelling voice' },
      { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
      { id: 'nova', name: 'Nova', description: 'Friendly, energetic voice' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle voice' }
    ]
  })
}
