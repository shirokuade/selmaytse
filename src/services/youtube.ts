import { YoutubeTranscript } from 'youtube-transcript'
import type { TranscriptSegment, VideoMetadata, ProcessedTranscript } from '@/types'

// Extract video ID from various YouTube URL formats
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// Fetch transcript from YouTube
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    return transcript.map(item => ({
      text: item.text,
      start: item.offset / 1000, // Convert ms to seconds
      duration: item.duration / 1000
    }))
  } catch (error) {
    console.error('Error fetching transcript:', error)
    throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Fetch video metadata using oEmbed API (no API key required)
export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oEmbedUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch video metadata')
    }

    const data = await response.json()

    return {
      videoId,
      title: data.title || 'Unknown Title',
      channelName: data.author_name || 'Unknown Channel',
      channelId: undefined,
      thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: undefined,
      duration: undefined,
      publishedAt: undefined
    }
  } catch (error) {
    console.error('Error fetching metadata:', error)
    // Return basic metadata if oEmbed fails
    return {
      videoId,
      title: 'Unknown Title',
      channelName: 'Unknown Channel',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }
  }
}

// Process and format transcript text
export function processTranscript(segments: TranscriptSegment[]): { fullText: string; formattedText: string } {
  // Create full text by joining all segments
  const fullText = segments
    .map(s => s.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Create formatted text with timestamps
  const formattedText = segments
    .map(s => {
      const timestamp = formatTimestamp(s.start)
      return `[${timestamp}] ${cleanText(s.text)}`
    })
    .join('\n')

  return { fullText, formattedText }
}

// Format seconds to HH:MM:SS or MM:SS
export function formatTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Clean and correct text
export function cleanText(text: string): string {
  return text
    // Remove HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove [Music], [Applause] etc. markers but keep them for context
    .replace(/\[([^\]]+)\]/g, '[$1]')
    // Fix common transcription errors
    .replace(/\bi\b/g, 'I')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Main function to get processed transcript
export async function getProcessedTranscript(url: string): Promise<ProcessedTranscript> {
  const videoId = extractVideoId(url)

  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  // Fetch metadata and transcript in parallel
  const [metadata, segments] = await Promise.all([
    fetchVideoMetadata(videoId),
    fetchTranscript(videoId)
  ])

  const { fullText, formattedText } = processTranscript(segments)

  return {
    metadata,
    segments,
    fullText,
    formattedText
  }
}
