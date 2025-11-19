import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProcessedTranscript, extractVideoId } from '@/services/youtube'
import { z } from 'zod'

const transcriptRequestSchema = z.object({
  url: z.string().url('Invalid URL format')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = transcriptRequestSchema.parse(body)

    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    // Check if video already exists
    const existingVideo = await prisma.video.findUnique({
      where: { videoId },
      include: { transcripts: { orderBy: { order: 'asc' } } }
    })

    if (existingVideo) {
      return NextResponse.json({
        message: 'Transcript already exists',
        video: existingVideo,
        isExisting: true
      })
    }

    // Fetch and process transcript
    const processed = await getProcessedTranscript(url)

    // Save to database
    const video = await prisma.video.create({
      data: {
        videoId: processed.metadata.videoId,
        title: processed.metadata.title,
        channelName: processed.metadata.channelName,
        channelId: processed.metadata.channelId,
        description: processed.metadata.description,
        thumbnail: processed.metadata.thumbnail,
        duration: processed.metadata.duration,
        publishedAt: processed.metadata.publishedAt,
        transcripts: {
          create: processed.segments.map((segment, index) => ({
            text: segment.text,
            start: segment.start,
            duration: segment.duration,
            order: index
          }))
        }
      },
      include: {
        transcripts: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({
      message: 'Transcript generated successfully',
      video,
      formattedText: processed.formattedText,
      isExisting: false
    })
  } catch (error) {
    console.error('Transcript generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate transcript' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      )
    }

    const video = await prisma.video.findUnique({
      where: { videoId },
      include: {
        transcripts: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Get transcript error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    )
  }
}
