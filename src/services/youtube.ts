import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import type { TranscriptSegment, VideoMetadata, ProcessedTranscript } from '@/types'

const execAsync = promisify(exec)

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

// Fetch transcript using yt-dlp
export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const tempDir = os.tmpdir()
  const outputPath = path.join(tempDir, `${videoId}_transcript`)

  try {
    // Use yt-dlp to download subtitles in JSON3 format (includes timestamps)
    const ytdlpCommand = `yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format json3 --output "${outputPath}" "https://www.youtube.com/watch?v=${videoId}"`

    await execAsync(ytdlpCommand, { timeout: 60000 })

    // Find the downloaded subtitle file
    const subtitleFile = `${outputPath}.en.json3`

    // Check if file exists
    try {
      await fs.access(subtitleFile)
    } catch {
      // Try without language code
      const altFile = `${outputPath}.json3`
      try {
        await fs.access(altFile)
        const content = await fs.readFile(altFile, 'utf-8')
        return parseJson3Subtitles(content)
      } catch {
        throw new Error('No subtitles available for this video')
      }
    }

    const content = await fs.readFile(subtitleFile, 'utf-8')
    const segments = parseJson3Subtitles(content)

    // Clean up temp files
    try {
      await fs.unlink(subtitleFile)
    } catch {
      // Ignore cleanup errors
    }

    return segments
  } catch (error) {
    console.error('Error fetching transcript with yt-dlp:', error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('No subtitles available')) {
        throw error
      }
      if (error.message.includes('ENOENT')) {
        throw new Error('yt-dlp is not installed. Please install it: pip install yt-dlp')
      }
      if (error.message.includes('timeout')) {
        throw new Error('Transcript fetch timed out. Please try again.')
      }
    }

    throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Parse JSON3 subtitle format from yt-dlp
function parseJson3Subtitles(content: string): TranscriptSegment[] {
  try {
    const data = JSON.parse(content)
    const segments: TranscriptSegment[] = []

    if (data.events) {
      for (const event of data.events) {
        // Skip events without segments (like style events)
        if (!event.segs || event.segs.length === 0) continue

        // Combine all segment texts
        const text = event.segs
          .map((seg: { utf8?: string }) => seg.utf8 || '')
          .join('')
          .trim()

        if (!text) continue

        segments.push({
          text: cleanText(text),
          start: (event.tStartMs || 0) / 1000,
          duration: (event.dDurationMs || 0) / 1000
        })
      }
    }

    return segments
  } catch (error) {
    console.error('Error parsing JSON3 subtitles:', error)
    throw new Error('Failed to parse subtitle data')
  }
}

// Fetch video metadata using yt-dlp
export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    // Use yt-dlp to get video metadata in JSON format
    const { stdout } = await execAsync(
      `yt-dlp --dump-json --no-download "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000 }
    )

    const data = JSON.parse(stdout)

    return {
      videoId,
      title: data.title || 'Unknown Title',
      channelName: data.uploader || data.channel || 'Unknown Channel',
      channelId: data.channel_id,
      thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      description: data.description?.substring(0, 500),
      duration: data.duration,
      publishedAt: data.upload_date ? parseYtdlpDate(data.upload_date) : undefined
    }
  } catch (error) {
    console.error('Error fetching metadata with yt-dlp:', error)

    // Fallback to basic metadata
    return {
      videoId,
      title: 'Unknown Title',
      channelName: 'Unknown Channel',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    }
  }
}

// Parse yt-dlp date format (YYYYMMDD)
function parseYtdlpDate(dateStr: string): Date | undefined {
  if (!dateStr || dateStr.length !== 8) return undefined

  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))

  return new Date(year, month, day)
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
      return `[${timestamp}] ${s.text}`
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
    // Remove newlines within text
    .replace(/\n/g, ' ')
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

  if (segments.length === 0) {
    throw new Error('No transcript segments found for this video')
  }

  const { fullText, formattedText } = processTranscript(segments)

  return {
    metadata,
    segments,
    fullText,
    formattedText
  }
}
