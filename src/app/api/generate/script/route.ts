import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/generate/script - Generate script using LLM
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, genre, duration } = body

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Initialize Z-AI SDK
    const zai = await ZAI.create()

    // Generate script using LLM
    const systemPrompt = `You are a professional screenwriter for short films. Generate a complete script with:
- Title
- Logline
- Characters (with brief descriptions)
- Scenes (with dialogue and action descriptions)
- Visual notes for each scene

Format the response as JSON with the following structure:
{
  "title": "Film Title",
  "logline": "One sentence summary",
  "characters": [{ "name": "...", "description": "..." }],
  "scenes": [
    {
      "number": 1,
      "location": "...",
      "time": "DAY/NIGHT",
      "action": "...",
      "dialogue": [{ "character": "...", "lines": "..." }],
      "visualNotes": "..."
    }
  ]
}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Create a ${duration || '2-3 minute'} short film script${genre ? ` in the ${genre} genre` : ''} based on this concept:\n\n${prompt}` 
        }
      ],
      thinking: { type: 'disabled' }
    })

    const scriptContent = completion.choices[0]?.message?.content || ''

    // Try to parse as JSON, if not, wrap in a basic structure
    let script
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch = scriptContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : scriptContent
      script = JSON.parse(jsonStr)
    } catch {
      script = {
        title: 'Generated Film',
        logline: prompt.slice(0, 100),
        rawContent: scriptContent
      }
    }

    return NextResponse.json({
      success: true,
      script,
      usage: completion.usage
    })
  } catch (error) {
    console.error('Error generating script:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate script' },
      { status: 500 }
    )
  }
}
