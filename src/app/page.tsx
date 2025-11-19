import TranscriptGenerator from '@/components/TranscriptGenerator'
import SearchEngine from '@/components/SearchEngine'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 text-white p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SelmaYTSE</h1>
                <p className="text-xs text-gray-500">YouTube Transcript Search Engine</p>
              </div>
            </div>
            <nav className="hidden sm:flex items-center space-x-4">
              <a href="#generate" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Generate
              </a>
              <a href="#search" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Search
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            YouTube Transcript Search Engine
          </h2>
          <p className="text-lg text-red-100 max-w-2xl mx-auto">
            Extract transcripts from any YouTube video and build your searchable content library.
            Find exactly what was said, when it was said.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Transcript Generator */}
          <section id="generate">
            <TranscriptGenerator />
          </section>

          {/* Search Engine */}
          <section id="search">
            <SearchEngine />
          </section>
        </div>

        {/* Features Section */}
        <section className="mt-12 py-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 text-center mb-8">
            Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Auto Transcription</h4>
              <p className="text-sm text-gray-600">
                Extract transcripts from any YouTube video with timestamps
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Full-Text Search</h4>
              <p className="text-sm text-gray-600">
                Search across all your saved transcripts instantly
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Jump to Time</h4>
              <p className="text-sm text-gray-600">
                Click any search result to open YouTube at that exact moment
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            SelmaYTSE - YouTube Transcript Search Engine
          </p>
        </div>
      </footer>
    </div>
  )
}
