import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatTimestamp } from '@/services/youtube'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const searchTerms = query.trim().toLowerCase()

    // Search for matching transcript segments
    const segments = await prisma.transcriptSegment.findMany({
      where: {
        text: {
          contains: searchTerms,
          mode: 'insensitive'
        }
      },
      include: {
        video: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit * 3, // Fetch more to group by video
      skip: offset
    })

    // Group results by video
    const videoResults = new Map<string, {
      video: {
        id: string
        videoId: string
        title: string
        channelName: string
        thumbnail: string | null
      }
      matchedSegments: {
        text: string
        start: number
        duration: number
        timestamp: string
        context: string
      }[]
    }>()

    for (const segment of segments) {
      const videoId = segment.video.videoId

      if (!videoResults.has(videoId)) {
        videoResults.set(videoId, {
          video: {
            id: segment.video.id,
            videoId: segment.video.videoId,
            title: segment.video.title,
            channelName: segment.video.channelName,
            thumbnail: segment.video.thumbnail
          },
          matchedSegments: []
        })
      }

      const result = videoResults.get(videoId)!

      // Only add up to 3 segments per video
      if (result.matchedSegments.length < 3) {
        // Highlight the search term in the text
        const highlightedText = highlightSearchTerm(segment.text, searchTerms)

        result.matchedSegments.push({
          text: segment.text,
          start: segment.start,
          duration: segment.duration,
          timestamp: formatTimestamp(segment.start),
          context: highlightedText
        })
      }
    }

    // Convert to array and limit results
    const results = Array.from(videoResults.values()).slice(0, limit)

    // Get total count for pagination
    const totalVideos = await prisma.video.count({
      where: {
        transcripts: {
          some: {
            text: {
              contains: searchTerms,
              mode: 'insensitive'
            }
          }
        }
      }
    })

    return NextResponse.json({
      results,
      pagination: {
        total: totalVideos,
        limit,
        offset,
        hasMore: offset + results.length < totalVideos
      },
      query
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

function highlightSearchTerm(text: string, searchTerm: string): string {
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi')
  return text.replace(regex, '**$1**')
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
