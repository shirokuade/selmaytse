'use client'

import { useState } from 'react'

interface MatchedSegment {
  text: string
  start: number
  duration: number
  timestamp: string
  context: string
}

interface SearchResultVideo {
  video: {
    id: string
    videoId: string
    title: string
    channelName: string
    thumbnail: string | null
  }
  matchedSegments: MatchedSegment[]
}

interface SearchResponse {
  results: SearchResultVideo[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  query: string
}

export default function SearchEngine() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const openYouTubeAtTime = (videoId: string, startTime: number) => {
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startTime)}s`
    window.open(url, '_blank')
  }

  const renderHighlightedText = (context: string) => {
    // Split by ** markers and render with highlighting
    const parts = context.split(/\*\*/)
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="bg-yellow-200 font-semibold">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Content Search Engine
      </h2>
      <p className="text-gray-600 mb-6">
        Search across all saved transcripts in the library
      </p>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcripts..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Found {results.pagination.total} video{results.pagination.total !== 1 ? 's' : ''} matching &quot;{results.query}&quot;
            </p>
          </div>

          {results.results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No results found. Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.results.map((result) => (
                <div
                  key={result.video.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition"
                >
                  <div className="flex items-start space-x-4">
                    {result.video.thumbnail && (
                      <img
                        src={result.video.thumbnail}
                        alt={result.video.title}
                        className="w-32 h-20 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {result.video.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {result.video.channelName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Matched Segments
                    </p>
                    {result.matchedSegments.map((segment, index) => (
                      <button
                        key={index}
                        onClick={() => openYouTubeAtTime(result.video.videoId, segment.start)}
                        className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100 transition group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-red-600 font-mono text-sm">
                              [{segment.timestamp}]
                            </span>
                            <p className="text-sm text-gray-700 mt-1">
                              {renderHighlightedText(segment.context)}
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-red-600 ml-2 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
