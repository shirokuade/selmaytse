'use client'

import { useState } from 'react'

interface TranscriptSegment {
  text: string
  start: number
  duration: number
}

interface Video {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string | null
  transcripts: TranscriptSegment[]
}

interface TranscriptResult {
  message: string
  video: Video
  formattedText?: string
  isExisting: boolean
}

export default function TranscriptGenerator() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TranscriptResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate transcript')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getFormattedTranscript = (): string => {
    if (!result?.video.transcripts) return ''
    return result.video.transcripts
      .map(s => `[${formatTimestamp(s.start)}] ${s.text}`)
      .join('\n')
  }

  const copyToClipboard = async () => {
    const text = getFormattedTranscript()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Transcript Generator
      </h2>
      <p className="text-gray-600 mb-6">
        Enter a YouTube URL to extract and save the transcript
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            YouTube URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Transcript'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            {result.video.thumbnail && (
              <img
                src={result.video.thumbnail}
                alt={result.video.title}
                className="w-32 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">
                {result.video.title}
              </h3>
              <p className="text-sm text-gray-600">{result.video.channelName}</p>
              <p className="text-xs text-gray-500 mt-1">
                {result.video.transcripts.length} segments
              </p>
              {result.isExisting && (
                <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  Already in library
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-700">Transcript</h4>
              <button
                onClick={copyToClipboard}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 font-mono text-sm">
              {result.video.transcripts.map((segment, index) => (
                <div key={index} className="mb-2 hover:bg-gray-100 p-1 rounded">
                  <span className="text-red-600 font-medium">
                    [{formatTimestamp(segment.start)}]
                  </span>{' '}
                  <span className="text-gray-700">{segment.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
