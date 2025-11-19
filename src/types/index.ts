export interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

export interface VideoMetadata {
  videoId: string
  title: string
  channelName: string
  channelId?: string
  description?: string
  thumbnail?: string
  duration?: number
  publishedAt?: Date
}

export interface ProcessedTranscript {
  metadata: VideoMetadata
  segments: TranscriptSegment[]
  fullText: string
  formattedText: string
}

export interface SearchResult {
  videoId: string
  title: string
  channelName: string
  thumbnail?: string
  matchedSegments: {
    text: string
    start: number
    duration: number
    context: string
  }[]
  relevanceScore: number
}

export interface TranscriptGenerationRequest {
  url: string
}

export interface SearchRequest {
  query: string
  limit?: number
  offset?: number
}
