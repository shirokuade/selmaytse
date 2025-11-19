import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { transcripts: true }
          }
        }
      }),
      prisma.video.count()
    ])

    return NextResponse.json({
      videos,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + videos.length < total
      }
    })
  } catch (error) {
    console.error('Get videos error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
        { status: 400 }
      )
    }

    await prisma.video.delete({
      where: { videoId }
    })

    return NextResponse.json({
      message: 'Video deleted successfully'
    })
  } catch (error) {
    console.error('Delete video error:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
