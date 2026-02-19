import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/generate/video - Generate video content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration = 5, style = 'cinematic' } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Initialize Z-AI SDK
    const zai = await ZAI.create()

    // Enhance prompt for video generation
    const enhancedPrompt = `${prompt}, ${style} style, smooth motion, high quality video`

    // Generate video
    const result = await zai.videos.generate({
      model: 'kling-v1',
      prompt: enhancedPrompt,
      duration: duration
    })

    // For async generation, we might need to poll for results
    // For now, return the task ID for status checking
    const taskId = result.id || result.task_id || `task_${Date.now()}`

    return NextResponse.json({
      success: true,
      video: {
        taskId,
        status: 'processing',
        prompt: enhancedPrompt,
        estimatedDuration: duration,
        // If video is ready, include URL
        url: result.url || null
      }
    })
  } catch (error) {
    console.error('Error generating video:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate video' },
      { status: 500 }
    )
  }
}

// GET /api/generate/video?taskId=xxx - Check video generation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Initialize Z-AI SDK
    const zai = await ZAI.create()

    // Check video generation status
    const result = await zai.videos.retrieve({
      id: taskId
    })

    return NextResponse.json({
      success: true,
      video: {
        taskId,
        status: result.status || 'processing',
        url: result.url || null,
        progress: result.progress || 0
      }
    })
  } catch (error) {
    console.error('Error checking video status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check video status' },
      { status: 500 }
    )
  }
}
