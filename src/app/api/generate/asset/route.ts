import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/generate/asset - Generate visual assets using Image Generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, style, count = 1, size = '1024x1024' } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Initialize Z-AI SDK
    const zai = await ZAI.create()

    // Enhance prompt with style
    const enhancedPrompt = style 
      ? `${prompt}, ${style} style, cinematic, high quality, detailed`
      : `${prompt}, cinematic, high quality, detailed`

    // Generate images
    const images = []
    for (let i = 0; i < Math.min(count, 4); i++) {
      try {
        const result = await zai.images.generate({
          prompt: enhancedPrompt,
          n: 1,
          size: size as '256x256' | '512x512' | '1024x1024'
        })

        if (result.data && result.data[0]) {
          images.push({
            url: result.data[0].url || result.data[0].b64_json,
            prompt: enhancedPrompt,
            index: i
          })
        }
      } catch (imgError) {
        console.error(`Error generating image ${i}:`, imgError)
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate any images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images,
      count: images.length
    })
  } catch (error) {
    console.error('Error generating assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate assets' },
      { status: 500 }
    )
  }
}
